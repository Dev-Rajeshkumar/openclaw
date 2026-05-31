"""
Telegram Reminder Bot — Never forget a birthday or special event again.
Supports one-time & recurring reminders (yearly/weekly/daily/custom),
edit events, import/export via JSON/CSV.
Uses SQLite for persistence, APScheduler for timed reminders.
All times are in IST (Indian Standard Time, UTC+5:30).
"""

import os
import json
import csv
import io
import sqlite3
import logging
import threading
from datetime import datetime, timedelta, date
from http.server import HTTPServer, BaseHTTPRequestHandler
import pytz

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputFile
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    ConversationHandler, MessageHandler, filters, ContextTypes
)

# ─── Configuration ───────────────────────────────────────────
BOT_TOKEN = os.environ.get("BOT_TOKEN")
if not BOT_TOKEN:
    raise SystemExit("BOT_TOKEN environment variable is required")
DB_PATH = os.getenv("DB_PATH", "reminders.db")
CHECK_TIME = os.getenv("CHECK_TIME", "09:00")
IST = pytz.timezone("Asia/Kolkata")

# ─── Logging ─────────────────────────────────────────────────
logging.basicConfig(format="%(asctime)s | %(levelname)s | %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Database ────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                chat_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                event_type TEXT DEFAULT 'custom',
                event_date TEXT NOT NULL,
                frequency TEXT DEFAULT 'yearly',
                custom_days INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.commit()
    logger.info("Database initialized at %s", DB_PATH)

def add_reminder(user_id, chat_id, name, event_type, event_date, frequency="yearly", custom_days=0, notes=""):
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO reminders (user_id, chat_id, name, event_type, event_date, frequency, custom_days, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, chat_id, name, event_type, event_date, frequency, custom_days, notes)
        )
        db.commit()
        return cur.lastrowid

def update_reminder(reminder_id, user_id, **kwargs):
    allowed = {"name", "event_type", "event_date", "frequency", "custom_days", "notes"}
    fields = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
    if not fields:
        return False
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [reminder_id, user_id]
    with get_db() as db:
        cur = db.execute(f"UPDATE reminders SET {set_clause} WHERE id = ? AND user_id = ?", values)
        db.commit()
        return cur.rowcount > 0

def get_reminder(reminder_id, user_id):
    with get_db() as db:
        row = db.execute("SELECT * FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, user_id)).fetchone()
        return dict(row) if row else None

def get_user_reminders(user_id):
    with get_db() as db:
        return db.execute("SELECT * FROM reminders WHERE user_id = ? ORDER BY event_date", (user_id,)).fetchall()

def delete_reminder(reminder_id, user_id):
    with get_db() as db:
        cur = db.execute("DELETE FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, user_id))
        db.commit()
        return cur.rowcount > 0

def frequency_label(freq):
    labels = {
        "yearly": "Yearly",
        "monthly": "Monthly",
        "weekly": "Weekly",
        "daily": "Daily",
        "once": "One-time",
        "custom": "Custom"
    }
    return labels.get(freq, freq.capitalize())

def frequency_emoji(freq):
    emojis = {
        "yearly": "📅",
        "monthly": "🗓️",
        "weekly": "📆",
        "daily": "⏰",
        "once": "1️⃣",
        "custom": "⚙️"
    }
    return emojis.get(freq, "📅")

def event_type_emoji(event_type):
    emojis = {
        "birthday": "🎂",
        "anniversary": "💍",
        "holiday": "🎄",
        "meeting": "📋",
        "custom": "📌"
    }
    return emojis.get(event_type, "📌")

def is_recurring(freq):
    return freq not in ("once",)

def next_occurrence(event_date_str, frequency, custom_days=0, from_date=None):
    """Calculate next occurrence of a reminder from a given date."""
    event_date = datetime.strptime(event_date_str, "%Y-%m-%d").date()
    today = from_date or date.today()

    if frequency == "once":
        return event_date if event_date >= today else None

    if frequency == "daily":
        return today

    if frequency == "weekly":
        # Find next same weekday
        days_ahead = event_date.weekday() - today.weekday()
        if days_ahead < 0:
            days_ahead += 7
        result = today + timedelta(days=days_ahead)
        if result < today:
            result += timedelta(days=7)
        return result

    if frequency == "monthly":
        result = today.replace(day=min(event_date.day, 28))
        if result < today:
            if today.month == 12:
                result = today.replace(year=today.year + 1, month=1, day=min(event_date.day, 28))
            else:
                result = today.replace(month=today.month + 1, day=min(event_date.day, 28))
        return result

    if frequency == "custom" and custom_days > 0:
        return today + timedelta(days=custom_days)

    # yearly (default)
    try:
        result = event_date.replace(year=today.year)
    except ValueError:
        result = event_date.replace(year=today.year, day=event_date.day - 1)
    if result < today:
        try:
            result = event_date.replace(year=today.year + 1)
        except ValueError:
            result = event_date.replace(year=today.year + 1, day=event_date.day - 1)
    return result

def get_todays_reminders():
    today = datetime.now(IST).date()
    results = []
    with get_db() as db:
        for rem in db.execute("SELECT * FROM reminders").fetchall():
            rem_dict = dict(rem)
            next_occ = next_occurrence(rem_dict["event_date"], rem_dict["frequency"], rem_dict.get("custom_days", 0), from_date=today)
            if next_occ == today:
                results.append(rem_dict)
    return results

def get_upcoming_reminders(user_id, days=7):
    today = datetime.now(IST).date()
    upcoming = []
    with get_db() as db:
        for rem in db.execute("SELECT * FROM reminders WHERE user_id = ?", (user_id,)).fetchall():
            rem_dict = dict(rem)
            next_occ = next_occurrence(rem_dict["event_date"], rem_dict["frequency"], rem_dict.get("custom_days", 0), from_date=today)
            if next_occ:
                delta = (next_occ - today).days
                if 0 <= delta <= days:
                    upcoming.append({**rem_dict, "days_until": delta, "next_date": next_occ.strftime("%Y-%m-%d")})
    return upcoming

def format_reminder(rem, show_id=True):
    emoji = event_type_emoji(rem["event_type"])
    freq = frequency_emoji(rem["frequency"]) + " " + frequency_label(rem["frequency"])
    text = f"{emoji} *{rem['name']}*\n"
    if show_id:
        text += f"   🆔 `#{rem['id']}` | {freq}\n"
    else:
        text += f"   {freq}\n"
    text += f"   📅 {rem['event_date']}"
    if rem.get("notes"):
        text += f"\n   📝 {rem['notes']}"
    return text

# ─── Import / Export ─────────────────────────────────────────
def export_user_reminders_json(user_id):
    reminders = get_user_reminders(user_id)
    data = []
    for rem in reminders:
        data.append({
            "name": rem["name"],
            "event_type": rem["event_type"],
            "event_date": rem["event_date"],
            "frequency": rem["frequency"],
            "custom_days": rem["custom_days"],
            "notes": rem["notes"]
        })
    return json.dumps(data, indent=2, ensure_ascii=False)

def export_user_reminders_csv(user_id):
    reminders = get_user_reminders(user_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "event_type", "event_date", "frequency", "custom_days", "notes"])
    for rem in reminders:
        writer.writerow([rem["name"], rem["event_type"], rem["event_date"], rem["frequency"], rem["custom_days"], rem["notes"]])
    return output.getvalue()

def import_reminders_from_json(user_id, chat_id, json_text):
    data = json.loads(json_text)
    added = 0
    errors = []
    for i, item in enumerate(data):
        try:
            name = item.get("name", "").strip()
            event_type = item.get("event_type", "custom").strip()
            event_date = item.get("event_date", "").strip()
            frequency = item.get("frequency", "yearly").strip()
            custom_days = int(item.get("custom_days", 0))
            notes = item.get("notes", "").strip()
            if not name or not event_date:
                errors.append(f"Row {i+1}: Missing name or date")
                continue
            datetime.strptime(event_date, "%Y-%m-%d")
            if frequency not in ("yearly", "monthly", "weekly", "daily", "once", "custom"):
                frequency = "yearly"
            add_reminder(user_id, chat_id, name, event_type, event_date, frequency, custom_days, notes)
            added += 1
        except ValueError:
            errors.append(f"Row {i+1}: Invalid date format (use YYYY-MM-DD)")
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")
    return added, errors

def import_reminders_from_csv(user_id, chat_id, csv_text):
    reader = csv.DictReader(io.StringIO(csv_text))
    added = 0
    errors = []
    for i, row in enumerate(reader):
        try:
            name = row.get("name", "").strip()
            event_type = row.get("event_type", "custom").strip()
            event_date = row.get("event_date", "").strip()
            frequency = row.get("frequency", "yearly").strip()
            custom_days = int(row.get("custom_days", 0))
            notes = row.get("notes", "").strip()
            if not name or not event_date:
                errors.append(f"Row {i+1}: Missing name or date")
                continue
            datetime.strptime(event_date, "%Y-%m-%d")
            if frequency not in ("yearly", "monthly", "weekly", "daily", "once", "custom"):
                frequency = "yearly"
            add_reminder(user_id, chat_id, name, event_type, event_date, frequency, custom_days, notes)
            added += 1
        except ValueError:
            errors.append(f"Row {i+1}: Invalid date format")
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")
    return added, errors

# ─── Bot Commands ────────────────────────────────────────────
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("➕ Add Event", callback_data="add"), InlineKeyboardButton("📋 My Events", callback_data="list")],
        [InlineKeyboardButton("🔔 Upcoming", callback_data="upcoming"), InlineKeyboardButton("📅 Today", callback_data="today")],
        [InlineKeyboardButton("✏️ Edit", callback_data="edit_menu"), InlineKeyboardButton("🗑️ Delete", callback_data="delete_menu")],
        [InlineKeyboardButton("📥 Import", callback_data="import_menu"), InlineKeyboardButton("📤 Export", callback_data="export_menu")],
        [InlineKeyboardButton("🔍 Search", callback_data="search_menu")],
        [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
    ]
    welcome = (
        "🎉 *Welcome to ReminderBot!*\n\n"
        "Never forget a birthday, anniversary, or special event.\n\n"
        "✨ *Features:*\n"
        "• Multiple frequencies: Yearly, Monthly, Weekly, Daily, One-time, Custom\n"
        "• Edit any event after creation\n"
        "• Search through your events\n"
        "• Import/Export via JSON/CSV\n"
        "• 🔔 Daily notifications at 09:00 IST\n\n"
        "Choose an option:"
    )
    await update.message.reply_text(welcome, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "📖 *ReminderBot Commands*\n\n"
        "/start — Main menu\n"
        "/add — Add a new event\n"
        "/list — View all events\n"
        "/upcoming — Events in next 7 days\n"
        "/today — Today's events\n"
        "/search — Search events\n"
        "/delete <id> — Delete an event\n"
        "/edit <id> — Edit an event\n"
        "/export — Export all events\n"
        "/help — Show this message\n\n"
        "📅 *All times are in IST (UTC+5:30)*\n"
        "🔔 Daily check at 09:00 IST\n\n"
        "*Frequencies:* yearly, monthly, weekly, daily, once, custom\n"
        "*Event Types:* birthday, anniversary, meeting, holiday, custom\n"
        "*Date Format:* YYYY-MM-DD"
    )
    await update.message.reply_text(text, parse_mode="Markdown")

# ─── Callback Router ─────────────────────────────────────────
async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = query.from_user.id

    # ── Main menu navigation ──
    if data == "back":
        keyboard = [
            [InlineKeyboardButton("➕ Add Event", callback_data="add"), InlineKeyboardButton("📋 My Events", callback_data="list")],
            [InlineKeyboardButton("🔔 Upcoming", callback_data="upcoming"), InlineKeyboardButton("📅 Today", callback_data="today")],
            [InlineKeyboardButton("✏️ Edit", callback_data="edit_menu"), InlineKeyboardButton("🗑️ Delete", callback_data="delete_menu")],
            [InlineKeyboardButton("📥 Import", callback_data="import_menu"), InlineKeyboardButton("📤 Export", callback_data="export_menu")],
            [InlineKeyboardButton("🔍 Search", callback_data="search_menu")],
            [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
        ]
        await query.edit_message_text("🎉 *Main Menu*\n\nChoose an option:", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END

    if data == "add":
        keyboard = [
            [InlineKeyboardButton("🎂 Birthday", callback_data="type_birthday"), InlineKeyboardButton("💍 Anniversary", callback_data="type_anniversary")],
            [InlineKeyboardButton("🎄 Holiday", callback_data="type_holiday"), InlineKeyboardButton("📋 Meeting", callback_data="type_meeting")],
            [InlineKeyboardButton("📌 Custom", callback_data="type_custom")],
            [InlineKeyboardButton("🔙 Back", callback_data="back")],
        ]
        await query.edit_message_text("📅 *Create New Event*\n\nSelect event type:", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return "SELECT_TYPE"

    if data == "list":
        return await show_events_list(query, user_id)

    if data == "upcoming":
        return await show_upcoming(query, user_id)

    if data == "today":
        return await show_today(query, user_id)

    if data == "help":
        text = (
            "📖 *How to use ReminderBot*\n\n"
            "• ➕ *Add* — Create events with reminders\n"
            "• 📋 *My Events* — View all your events\n"
            "• 🔔 *Upcoming* — See next 7 days\n"
            "• ✏️ *Edit* — Modify any event\n"
            "• 🗑️ *Delete* — Remove events\n"
            "• 📥 *Import* — Upload JSON/CSV file\n"
            "• 📤 *Export* — Download your data\n"
            "• 🔍 *Search* — Find events by name\n\n"
            "*Reminder frequencies:* Daily, Weekly, Monthly, Yearly, One-time, Custom days"
        )
        await query.edit_message_text(text, parse_mode="Markdown")
        return ConversationHandler.END

    # ── Event type selection ──
    if data.startswith("type_"):
        event_type = data.replace("type_", "")
        context.user_data["event_type"] = event_type
        emoji = event_type_emoji(event_type)
        await query.edit_message_text(
            f"{emoji} *{event_type.capitalize()}*\n\nEnter the *name* or *event title*:",
            parse_mode="Markdown"
        )
        return "ENTER_NAME"

    # ── Export menu ──
    if data == "export_menu":
        keyboard = [
            [InlineKeyboardButton("📄 JSON", callback_data="export_json"), InlineKeyboardButton("📊 CSV", callback_data="export_csv")],
            [InlineKeyboardButton("🔙 Back", callback_data="back")],
        ]
        await query.edit_message_text("📤 *Export Events*\n\nChoose format:", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END

    if data == "export_json":
        return await export_json(query, user_id)

    if data == "export_csv":
        return await export_csv(query, user_id)

    # ── Import menu ──
    if data == "import_menu":
        text = (
            "📥 *Import Events*\n\n"
            "Send me a `.json` or `.csv` file to bulk import.\n\n"
            "*JSON Format:*\n"
            "`[{\"name\": \"John\", \"event_type\": \"birthday\", \"event_date\": \"1995-08-15\", \"frequency\": \"yearly\"}]`\n\n"
            "*CSV Format:*\n"
            + "`name,event_type,event_date,frequency,custom_days,notes`"
        )
        await query.edit_message_text(text, parse_mode="Markdown")
        return ConversationHandler.END

    # ── Delete menu ──
    if data == "delete_menu":
        return await show_delete_menu(query, user_id)

    if data.startswith("del_"):
        return await handle_delete(query, user_id, data)

    # ── Edit menu ──
    if data == "edit_menu":
        return await show_edit_menu(query, user_id)

    if data.startswith("edit_") and data != "edit_menu":
        return await handle_edit_select(query, user_id, data, context)

    if data.startswith("edfield_"):
        return await handle_edit_field(query, data, context)

    # ── Search ──
    if data == "search_menu":
        await query.edit_message_text("🔍 *Search Events*\n\nType a name or keyword to search:", parse_mode="Markdown")
        context.user_data["searching"] = True
        return ConversationHandler.END

    # ── Frequency selection (for add flow) ──
    if data.startswith("freq_") and context.user_data.get("waiting_freq"):
        return await handle_frequency_select(query, data, context)

    # ── Custom days ──
    if data.startswith("customdays_") and context.user_data.get("waiting_custom_days"):
        return await handle_custom_days(query, data, context)

    return ConversationHandler.END

# ─── Show Functions ──────────────────────────────────────────
async def show_events_list(query, user_id):
    reminders = get_user_reminders(user_id)
    if not reminders:
        keyboard = [[InlineKeyboardButton("➕ Add First Event", callback_data="add"), InlineKeyboardButton("🔙 Back", callback_data="back")]]
        await query.edit_message_text("📭 *No events yet!*\n\nCreate your first reminder:", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END
    text = "📋 *Your Events*\n\n"
    for rem in reminders:
        text += format_reminder(rem) + "\n\n"
    keyboard = [
        [InlineKeyboardButton("➕ Add", callback_data="add"), InlineKeyboardButton("✏️ Edit", callback_data="edit_menu")],
        [InlineKeyboardButton("🗑️ Delete", callback_data="delete_menu"), InlineKeyboardButton("🔙 Back", callback_data="back")],
    ]
    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    return ConversationHandler.END

async def show_upcoming(query, user_id):
    upcoming = get_upcoming_reminders(user_id, 7)
    if not upcoming:
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
        await query.edit_message_text("🔔 *No events in the next 7 days.*", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END
    text = "🔔 *Upcoming Events (Next 7 Days)*\n\n"
    for rem in sorted(upcoming, key=lambda x: x["days_until"]):
        days_text = "Today! 🎉" if rem["days_until"] == 0 else f"In {rem['days_until']} day(s)"
        emoji = event_type_emoji(rem["event_type"])
        freq = frequency_label(rem["frequency"])
        text += f"{emoji} *{rem['name']}*\n   📅 {rem['next_date']} ({days_text}) | {freq}\n\n"
    keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    return ConversationHandler.END

async def show_today(query, user_id):
    today_r = [r for r in get_todays_reminders() if r["user_id"] == user_id]
    if not today_r:
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
        await query.edit_message_text("📅 *No events today!*", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END
    text = "🎉 *Today's Events*\n\n"
    for rem in today_r:
        emoji = event_type_emoji(rem["event_type"])
        event_date = datetime.strptime(rem["event_date"], "%Y-%m-%d").date()
        today = date.today()
        if rem["event_type"] == "birthday" and rem["frequency"] == "yearly":
            try:
                age = today.year - event_date.year
                text += f"{emoji} *{rem['name']}* — Turnin' {age}! 🎈\n"
            except:
                text += f"{emoji} *{rem['name']}*\n"
        else:
            text += f"{emoji} *{rem['name']}* ({rem['event_type'].capitalize()})\n"
    keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    return ConversationHandler.END

async def show_delete_menu(query, user_id):
    reminders = get_user_reminders(user_id)
    if not reminders:
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
        await query.edit_message_text("📭 No events to delete!", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END
    keyboard = []
    for r in reminders:
        emoji = event_type_emoji(r["event_type"])
        keyboard.append([InlineKeyboardButton(f"{emoji} #{r['id']} — {r['name']}", callback_data=f"del_{r['id']}")])
    keyboard.append([InlineKeyboardButton("🔙 Back", callback_data="back")])
    await query.edit_message_text("🗑️ *Delete Event*\n\nSelect an event:", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    return "DELETE_SELECT"

async def handle_delete(query, user_id, data):
    rid = int(data.replace("del_", ""))
    rem = get_reminder(rid, user_id)
    if rem and delete_reminder(rid, user_id):
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
        await query.edit_message_text(f"✅ *Deleted:* {rem['name']}", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await query.edit_message_text("❌ Event not found or already deleted.")
    return ConversationHandler.END

async def show_edit_menu(query, user_id):
    reminders = get_user_reminders(user_id)
    if not reminders:
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
        await query.edit_message_text("📭 No events to edit!", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END
    keyboard = []
    for r in reminders:
        emoji = event_type_emoji(r["event_type"])
        keyboard.append([InlineKeyboardButton(f"{emoji} #{r['id']} — {r['name']}", callback_data=f"edit_{r['id']}")])
    keyboard.append([InlineKeyboardButton("🔙 Back", callback_data="back")])
    await query.edit_message_text("✏️ *Edit Event*\n\nSelect an event to edit:", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    return "EDIT_SELECT"

async def handle_edit_select(query, user_id, data, context):
    rid = int(data.replace("edit_", ""))
    rem = get_reminder(rid, user_id)
    if not rem:
        await query.edit_message_text("❌ Event not found.")
        return ConversationHandler.END
    context.user_data["edit_id"] = rid
    text = f"✏️ *Editing: {rem['name']}*\n\n" + format_reminder(rem, show_id=False) + "\n\nWhat do you want to edit?"
    keyboard = [
        [InlineKeyboardButton("📝 Name", callback_data="edfield_name"), InlineKeyboardButton("📅 Date", callback_data="edfield_date")],
        [InlineKeyboardButton("🔔 Frequency", callback_data="edfield_frequency"), InlineKeyboardButton("🏷️ Type", callback_data="edfield_type")],
        [InlineKeyboardButton("📌 Notes", callback_data="edfield_notes")],
        [InlineKeyboardButton("🔙 Back", callback_data="edit_menu")],
    ]
    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    return "EDIT_FIELD"

async def handle_edit_field(query, data, context):
    field = data.replace("edfield_", "")
    context.user_data["edit_field"] = field

    if field == "frequency":
        keyboard = [
            [InlineKeyboardButton("📅 Yearly", callback_data="freq_yearly"), InlineKeyboardButton("🗓️ Monthly", callback_data="freq_monthly")],
            [InlineKeyboardButton("📆 Weekly", callback_data="freq_weekly"), InlineKeyboardButton("⏰ Daily", callback_data="freq_daily")],
            [InlineKeyboardButton("1️⃣ One-time", callback_data="freq_once"), InlineKeyboardButton("⚙️ Custom days", callback_data="freq_custom")],
            [InlineKeyboardButton("🔙 Cancel", callback_data="edit_menu")],
        ]
        await query.edit_message_text("🔔 *Select new frequency:*", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        context.user_data["waiting_freq"] = True
        return "EDIT_FREQUENCY"

    if field == "type":
        keyboard = [
            [InlineKeyboardButton("🎂 Birthday", callback_data="edtype_birthday"), InlineKeyboardButton("💍 Anniversary", callback_data="edtype_anniversary")],
            [InlineKeyboardButton("🎄 Holiday", callback_data="edtype_holiday"), InlineKeyboardButton("📋 Meeting", callback_data="edtype_meeting")],
            [InlineKeyboardButton("📌 Custom", callback_data="edtype_custom")],
            [InlineKeyboardButton("🔙 Cancel", callback_data="edit_menu")],
        ]
        await query.edit_message_text("🏷️ *Select new type:*", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        context.user_data["waiting_edit_type"] = True
        return "EDIT_TYPE"

    field_labels = {"name": "Name", "date": "Date (YYYY-MM-DD)", "notes": "Notes"}
    await query.edit_message_text(f"✏️ Enter new *{field_labels.get(field, field)}*:", parse_mode="Markdown")
    return "EDIT_VALUE"

async def handle_frequency_select(query, data, context):
    freq = data.replace("freq_", "")
    rid = context.user_data.get("edit_id")
    user_id = query.from_user.id

    if freq == "custom":
        keyboard = [
            [InlineKeyboardButton("Every 3 days", callback_data="customdays_3"), InlineKeyboardButton("Every 5 days", callback_data="customdays_5")],
            [InlineKeyboardButton("Every 7 days", callback_data="customdays_7"), InlineKeyboardButton("Every 14 days", callback_data="customdays_14")],
            [InlineKeyboardButton("Every 30 days", callback_data="customdays_30")],
            [InlineKeyboardButton("🔙 Cancel", callback_data="edit_menu")],
        ]
        await query.edit_message_text("⚙️ *Select custom interval:*", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        context.user_data["waiting_custom_days"] = True
        context.user_data["edit_field"] = "frequency"
        return "EDIT_CUSTOM_DAYS"

    if update_reminder(rid, user_id, frequency=freq):
        await show_edit_success(query, rid, user_id, f"Frequency → {frequency_label(freq)}")
    else:
        await query.edit_message_text("❌ Update failed.")
    context.user_data["waiting_freq"] = False
    return ConversationHandler.END

async def handle_custom_days(query, data, context):
    days = int(data.replace("customdays_", ""))
    rid = context.user_data.get("edit_id")
    user_id = query.from_user.id
    if update_reminder(rid, user_id, frequency="custom", custom_days=days):
        await show_edit_success(query, rid, user_id, f"Custom → Every {days} days")
    else:
        await query.edit_message_text("❌ Update failed.")
    context.user_data["waiting_custom_days"] = False
    return ConversationHandler.END

async def show_edit_success(query, rid, user_id, change_text):
    rem = get_reminder(rid, user_id)
    keyboard = [[InlineKeyboardButton("✏️ Edit More", callback_data=f"edit_{rid}"), InlineKeyboardButton("🔙 Main Menu", callback_data="back")]]
    text = f"✅ *Updated!*\n\n{change_text}\n\n" + format_reminder(rem)
    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

# ─── Export Functions ────────────────────────────────────────
async def export_json(query, user_id):
    json_data = export_user_reminders_json(user_id)
    if not json_data or json_data == "[]":
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
        await query.edit_message_text("📭 No events to export!", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END
    bio = io.BytesIO(json_data.encode("utf-8"))
    bio.name = "reminders.json"
    await query.message.reply_document(document=InputFile(bio), caption="📄 Your events (JSON)")
    await query.edit_message_text("✅ Export complete!")
    return ConversationHandler.END

async def export_csv(query, user_id):
    csv_data = export_user_reminders_csv(user_id)
    lines = csv_data.strip().split("\n")
    if len(lines) <= 1:
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="back")]]
        await query.edit_message_text("📭 No events to export!", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END
    bio = io.BytesIO(csv_data.encode("utf-8"))
    bio.name = "reminders.csv"
    await query.message.reply_document(document=InputFile(bio), caption="📊 Your events (CSV)")
    await query.edit_message_text("✅ Export complete!")
    return ConversationHandler.END

# ─── Conversation Handlers ───────────────────────────────────
async def add_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🎂 Birthday", callback_data="type_birthday"), InlineKeyboardButton("💍 Anniversary", callback_data="type_anniversary")],
        [InlineKeyboardButton("🎄 Holiday", callback_data="type_holiday"), InlineKeyboardButton("📋 Meeting", callback_data="type_meeting")],


    ]
    await update.message.reply_text(
        f"📅 *Date: {date_str}*\n\n🔔 How often should I remind you?",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    context.user_data["waiting_add_freq"] = True
    return "ENTER_FREQUENCY"

async def received_frequency(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if query:
        await query.answer()
        freq = query.data.replace("addfreq_", "")

        if freq == "custom":
            keyboard = [
                [InlineKeyboardButton("Every 3 days", callback_data="addcustom_3"), InlineKeyboardButton("Every 5 days", callback_data="addcustom_5")],
                [InlineKeyboardButton("Every 7 days", callback_data="addcustom_7"), InlineKeyboardButton("Every 14 days", callback_data="addcustom_14")],
                [InlineKeyboardButton("Every 30 days", callback_data="addcustom_30")],
            ]
            await query.edit_message_text("⚙️ *Select custom interval:*", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
            context.user_data["waiting_add_custom"] = True
            return "ENTER_CUSTOM_DAYS"

        context.user_data["frequency"] = freq
        return await ask_notes(query.message, context)

    # Fallback for text input
    context.user_data["frequency"] = "yearly"
    return await ask_notes(update.message, context)

async def received_custom_days(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    days = int(query.data.replace("addcustom_", ""))
    context.user_data["frequency"] = "custom"
    context.user_data["custom_days"] = days
    context.user_data["waiting_add_custom"] = False
    return await ask_notes(query.message, context)

async def ask_notes(message, context):
    keyboard = [[InlineKeyboardButton("⏭️ Skip", callback_data="skip_notes")]]
    await message.reply_text(
        "📝 Any notes? (optional)\nSend text or skip:",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    return "ENTER_NOTES"

async def received_notes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    notes = update.message.text.strip()
    return await save_reminder(update, context, notes)

async def skip_notes_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    return await save_reminder_callback(query, context, "")

async def save_reminder(update, context, notes=""):
    user_id = update.effective_user.id
    chat_id = update.message.chat_id
    name = context.user_data.get("event_name", "Unknown")
    event_type = context.user_data.get("event_type", "custom")
    event_date = context.user_data.get("event_date", datetime.now().strftime("%Y-%m-%d"))
    frequency = context.user_data.get("frequency", "yearly")
    custom_days = context.user_data.get("custom_days", 0)

    rid = add_reminder(user_id, chat_id, name, event_type, event_date, frequency, custom_days, notes)

    emoji = event_type_emoji(event_type)
    freq_text = frequency_label(frequency)
    if frequency == "custom":
        freq_text += f" (every {custom_days}d)"

    next_occ = next_occurrence(event_date, frequency, custom_days)
    next_text = next_occ.strftime("%Y-%m-%d") if next_occ else "N/A"

    text = (
        f"✅ *Event Created!*\n\n"
        f"{emoji} *{name}*\n"
        f"📅 {event_date}\n"
        f"🔔 {freq_text}\n"
        f"📌 Next: {next_text}\n"
        f"🆔 `#{rid}`\n"
    )
    if notes:
        text += f"📝 {notes}\n"
    text += f"\n🔔 I'll remind you at {CHECK_TIME} IST!"

    keyboard = [
        [InlineKeyboardButton("➕ Add Another", callback_data="add"), InlineKeyboardButton("📋 My Events", callback_data="list")],
        [InlineKeyboardButton("🔙 Main Menu", callback_data="back")],
    ]
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    context.user_data.clear()
    return ConversationHandler.END

async def save_reminder_callback(query, context, notes=""):
    user_id = query.from_user.id
    chat_id = query.message.chat_id
    name = context.user_data.get("event_name", "Unknown")
    event_type = context.user_data.get("event_type", "custom")
    event_date = context.user_data.get("event_date", datetime.now().strftime("%Y-%m-%d"))
    frequency = context.user_data.get("frequency", "yearly")
    custom_days = context.user_data.get("custom_days", 0)

    rid = add_reminder(user_id, chat_id, name, event_type, event_date, frequency, custom_days, notes)

    emoji = event_type_emoji(event_type)
    freq_text = frequency_label(frequency)
    if frequency == "custom":
        freq_text += f" (every {custom_days}d)"

    next_occ = next_occurrence(event_date, frequency, custom_days)
    next_text = next_occ.strftime("%Y-%m-%d") if next_occ else "N/A"

    text = (
        f"✅ *Event Created!*\n\n"
        f"{emoji} *{name}*\n"
        f"📅 {event_date}\n"
        f"🔔 {freq_text}\n"
        f"📌 Next: {next_text}\n"
        f"🆔 `#{rid}`\n"
    )
    if notes:
        text += f"📝 {notes}\n"
    text += f"\n🔔 I'll remind you at {CHECK_TIME} IST!"

    keyboard = [
        [InlineKeyboardButton("➕ Add Another", callback_data="add"), InlineKeyboardButton("📋 My Events", callback_data="list")],
        [InlineKeyboardButton("🔙 Main Menu", callback_data="back")],
    ]
    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    context.user_data.clear()
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Cancelled.")
    context.user_data.clear()
    return ConversationHandler.END

# ─── File Import Handler ────────────────────────────────────
async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    chat_id = update.message.chat_id
    doc = update.message.document
    file_name = doc.file_name.lower()

    if not (file_name.endswith(".json") or file_name.endswith(".csv")):
        await update.message.reply_text("❌ Send a .json or .csv file!")
        return

    try:
        file = await context.bot.get_file(doc.file_id)
        content = await file.download_as_bytearray()
        text = content.decode("utf-8")

        if file_name.endswith(".json"):
            added, errors = import_reminders_from_json(user_id, chat_id, text)
        else:
            added, errors = import_reminders_from_csv(user_id, chat_id, text)

        result_text = f"📥 *Import Complete!*\n\n✅ Added: {added} events\n"
        if errors:
            result_text += f"❌ Errors: {len(errors)}\n"
            for err in errors[:5]:
                result_text += f"  • {err}\n"
            if len(errors) > 5:
                result_text += f"  ... and {len(errors)-5} more"
        await update.message.reply_text(result_text, parse_mode="Markdown")
    except json.JSONDecodeError:
        await update.message.reply_text("❌ Invalid JSON format!")
    except Exception as e:
        await update.message.reply_text(f"❌ Import failed: {str(e)}")

# ─── Direct Commands ───────────────────────────────────────
async def list_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    reminders = get_user_reminders(update.effective_user.id)
    if not reminders:
        await update.message.reply_text("📭 No events yet.")
        return
    text = "📋 *Your Events*\n\n"
    for rem in reminders:
        text += format_reminder(rem) + "\n\n"
    await update.message.reply_text(text, parse_mode="Markdown")

async def upcoming_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    upcoming = get_upcoming_reminders(update.effective_user.id, 7)
    if not upcoming:
        await update.message.reply_text("🔔 No events in next 7 days!")
        return
    text = "🔔 *Next 7 Days*\n\n"
    for rem in sorted(upcoming, key=lambda x: x["days_until"]):
        days_text = "Today! 🎉" if rem["days_until"] == 0 else f"In {rem['days_until']}d"
        emoji = event_type_emoji(rem["event_type"])
        text += f"{emoji} *{rem['name']}* — {rem['next_date']} ({days_text})\n"
    await update.message.reply_text(text, parse_mode="Markdown")

async def today_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    today_r = [r for r in get_todays_reminders() if r["user_id"] == update.effective_user.id]
    if not today_r:
        await update.message.reply_text("📅 No events today!")
        return
    text = "🎉 *Today's Events*\n\n"
    for rem in today_r:
        emoji = event_type_emoji(rem["event_type"])
        event_date = datetime.strptime(rem["event_date"], "%Y-%m-%d").date()
        today = date.today()
        if rem["event_type"] == "birthday" and rem["frequency"] == "yearly":
            age = today.year - event_date.year
            text += f"{emoji} *{rem['name']}* — Turnin' {age}! 🎈\n"
        else:
            text += f"{emoji} *{rem['name']}* ({rem['event_type'].capitalize()})\n"
    await update.message.reply_text(text, parse_mode="Markdown")

async def delete_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /delete <event_id>")
        return
    try:
        rid = int(context.args[0])
    except ValueError:
        await update.message.reply_text("❌ Invalid ID. Use: /delete <number>")
        return
    if delete_reminder(rid, update.effective_user.id):
        await update.message.reply_text(f"✅ Event #{rid} deleted!")
    else:
        await update.message.reply_text("❌ Event not found.")

async def edit_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /edit <event_id>")
        return
    try:
        rid = int(context.args[0])
    except ValueError:
        await update.message.reply_text("❌ Invalid ID.")
        return
    rem = get_reminder(rid, update.effective_user.id)
    if not rem:
        await update.message.reply_text("❌ Event not found.")
        return
    context.user_data["edit_id"] = rid
    text = f"✏️ *Editing: {rem['name']}*\n\n" + format_reminder(rem, show_id=False) + "\n\nWhat do you want to edit?"
    keyboard = [
        [InlineKeyboardButton("📝 Name", callback_data="edfield_name"), InlineKeyboardButton("📅 Date", callback_data="edfield_date")],
        [InlineKeyboardButton("🔔 Frequency", callback_data="edfield_frequency"), InlineKeyboardButton("🏷️ Type", callback_data="edfield_type")],
        [InlineKeyboardButton("📌 Notes", callback_data="edfield_notes")],
    ]
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

async def export_json_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data = export_user_reminders_json(update.effective_user.id)
    if not data or data == "[]":
        await update.message.reply_text("📭 No events to export!")
        return
    bio = io.BytesIO(data.encode("utf-8"))
    bio.name = "reminders.json"
    await update.message.reply_document(document=InputFile(bio), caption="📄 Your events (JSON)")

async def search_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Usage: /search <keyword>")
        return
    keyword = " ".join(context.args).lower()
    reminders = get_user_reminders(update.effective_user.id)
    results = [r for r in reminders if keyword in r["name"].lower() or keyword in r["event_type"].lower() or keyword in r["notes"].lower()]
    if not results:
        await update.message.reply_text(f"🔍 No events matching '{keyword}'")
        return
    text = f"🔍 *Search: '{keyword}'*\n\n"
    for rem in results:
        text += format_reminder(rem) + "\n\n"
    await update.message.reply_text(text, parse_mode="Markdown")

# ─── Edit Value Handler (text input for name/date/notes) ────
async def received_edit_value(update: Update, context: ContextTypes.DEFAULT_TYPE):
    field = context.user_data.get("edit_field")
    rid = context.user_data.get("edit_id")
    user_id = update.effective_user.id
    value = update.message.text.strip()

    if field == "date":
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            await update.message.reply_text("❌ Invalid date! Use YYYY-MM-DD")
            return "EDIT_VALUE"

    if field == "type" and value.lower() not in ("birthday", "anniversary", "holiday", "meeting", "custom"):
        await update.message.reply_text("❌ Invalid type! Choose: birthday, anniversary, holiday, meeting, custom")
        return "EDIT_VALUE"

    success = update_reminder(rid, user_id, **{field: value})
    if success:
        rem = get_reminder(rid, user_id)
        keyboard = [[InlineKeyboardButton("✏️ Edit More", callback_data=f"edit_{rid}"), InlineKeyboardButton("🔙 Main Menu", callback_data="back")]]
        text = f"✅ *Updated!*\n\n" + format_reminder(rem)
        await update.message.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await update.message.reply_text("❌ Update failed.")
    context.user_data["edit_field"] = None
    return ConversationHandler.END

# ─── Edit Type Handler ──────────────────────────────────────
async def received_edit_type(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if query:
        await query.answer()
        new_type = query.data.replace("edtype_", "")
        rid = context.user_data.get("edit_id")
        user_id = query.from_user.id
        update_reminder(rid, user_id, event_type=new_type)
        await show_edit_success(query, rid, user_id, f"Type → {event_type_emoji(new_type)} {new_type.capitalize()}")
        context.user_data["waiting_edit_type"] = False
    return ConversationHandler.END

# ─── Scheduled Job ──────────────────────────────────────────
async def send_daily_reminders(context: ContextTypes.DEFAULT_TYPE):
    logger.info("Running daily reminder check...")
    for rem in get_todays_reminders():
        try:
            emoji = event_type_emoji(rem["event_type"])
            event_date = datetime.strptime(rem["event_date"], "%Y-%m-%d").date()
            today = date.today()
            freq = frequency_label(rem["frequency"])

            if rem["event_type"] == "birthday" and rem["frequency"] == "yearly":
                age = today.year - event_date.year
                text = f"🎉 *Reminder!*\n\n{emoji} *{rem['name']}*'s birthday TODAY! 🎂\n🎈 Turnin' {age}!"
            else:
                text = f"🔔 *Reminder!*\n\n{emoji} *{rem['name']}*'s {rem['event_type']} is today!\n📅 {freq}"

            if rem.get("notes"):
                text += f"\n\n📝 {rem['notes']}"

            await context.bot.send_message(
                chat_id=rem["chat_id"],
                text=text,
                parse_mode="Markdown"
            )
        except Exception as e:
            logger.error(f"Failed to send reminder for #{rem['id']}: {e}")

# ─── Main ──────────────────────────────────────────────────
def main():
    logger.info("Starting ReminderBot...")
    init_db()

    app = Application.builder().token(BOT_TOKEN).build()

    # Add conversation handler
    add_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(handle_callback, pattern="^add$"), CommandHandler("add", add_cmd)],
        states={
            "SELECT_TYPE": [CallbackQueryHandler(handle_callback, pattern="^type_")],
            "ENTER_NAME": [MessageHandler(filters.TEXT & ~filters.COMMAND, received_name)],
            "ENTER_DATE": [MessageHandler(filters.TEXT & ~filters.COMMAND, received_date)],
            "ENTER_FREQUENCY": [CallbackQueryHandler(received_frequency, pattern="^addfreq_")],
            "ENTER_CUSTOM_DAYS": [CallbackQueryHandler(received_custom_days, pattern="^addcustom_")],
            "ENTER_NOTES": [
                MessageHandler(filters.TEXT & ~filters.COMMAND, received_notes),
                CallbackQueryHandler(skip_notes_callback, pattern="^skip_notes$")
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    # Edit conversation handler
    edit_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(handle_callback, pattern="^edit_\\d+$"), CommandHandler("edit", edit_cmd)],
        states={
            "EDIT_SELECT": [CallbackQueryHandler(handle_callback, pattern="^edit_\\d+$")],
            "EDIT_FIELD": [CallbackQueryHandler(handle_callback, pattern="^edfield_")],
            "EDIT_FREQUENCY": [CallbackQueryHandler(handle_callback, pattern="^freq_")],
            "EDIT_CUSTOM_DAYS": [CallbackQueryHandler(handle_callback, pattern="^customdays_")],
            "EDIT_TYPE": [CallbackQueryHandler(received_edit_type, pattern="^edtype_")],
            "EDIT_VALUE": [MessageHandler(filters.TEXT & ~filters.COMMAND, received_edit_value)],
        },
        fallbacks=[CommandHandler("cancel", cancel), CallbackQueryHandler(handle_callback, pattern="^edit_menu$")],
    )

    # Delete conversation handler
    delete_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(handle_callback, pattern="^delete_menu$")],
        states={
            "DELETE_SELECT": [CallbackQueryHandler(handle_callback, pattern="^del_\\d+$")],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    # Register handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(add_conv)
    app.add_handler(edit_conv)
    app.add_handler(delete_conv)
    app.add_handler(CommandHandler("list", list_cmd))
    app.add_handler(CommandHandler("upcoming", upcoming_cmd))
    app.add_handler(CommandHandler("today", today_cmd))
    app.add_handler(CommandHandler("delete", delete_cmd))
    app.add_handler(CommandHandler("search", search_cmd))
    app.add_handler(CommandHandler("export", export_json_cmd))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    app.add_handler(CallbackQueryHandler(handle_callback))

    # Schedule daily check at configured time (IST)
    hour, minute = CHECK_TIME.split(":")
    app.job_queue.run_daily(
        send_daily_reminders,
        time=datetime.strptime(CHECK_TIME, "%H:%M").time().replace(tzinfo=IST),
        name="daily_reminders"
    )
    logger.info(f"Daily check scheduled at {CHECK_TIME} IST")

    # Start HTTP health check server for Railway
    class HealthHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ReminderBot is running!")
        def log_message(self, format, *args):
            pass

    port = int(os.getenv("PORT", "8080"))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    logger.info(f"Health check server started on port {port}")

    logger.info("Bot polling started.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
