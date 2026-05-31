"""
Telegram Reminder Bot — Never forget a birthday or special event again.
Supports one-time & recurring reminders, import/export via JSON/CSV.
Uses SQLite for persistence, APScheduler for timed reminders.
All times are in IST (Indian Standard Time, UTC+5:30).
"""

import os
import json
import csv
import io
import sqlite3
import logging
from datetime import datetime, timedelta
import pytz

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputFile
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    ConversationHandler, MessageHandler, filters, ContextTypes
)

# ─── Configuration ───────────────────────────────────────────
BOT_TOKEN = os.environ.get("BOT_TOKEN")
if not BOT_TOKEN:
    logger.error("BOT_TOKEN environment variable not set! Exiting.")
    raise SystemExit("BOT_TOKEN environment variable is required")
DB_PATH = os.getenv("DB_PATH", "reminders.db")
CHECK_TIME = os.getenv("CHECK_TIME", "09:00")
IST = pytz.timezone("Asia/Kolkata")  # Indian Standard Time

# ─── Logging ─────────────────────────────────────────────────
logging.basicConfig(format="%(asctime)s | %(levelname)s | %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Database ────────────────────────────────────────────────
def get_db():
    """Get SQLite connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables."""
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                chat_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                event_type TEXT DEFAULT 'birthday',
                event_date TEXT NOT NULL,
                is_recurring INTEGER DEFAULT 1,
                notes TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.commit()
    logger.info("Database initialized at %s", DB_PATH)

def add_reminder(user_id, chat_id, name, event_type, event_date, is_recurring=1, notes=""):
    """Add a new reminder. Returns reminder ID."""
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO reminders (user_id, chat_id, name, event_type, event_date, is_recurring, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, chat_id, name, event_type, event_date, is_recurring, notes)
        )
        db.commit()
        return cur.lastrowid

def get_user_reminders(user_id):
    """Get all reminders for a user."""
    with get_db() as db:
        return db.execute("SELECT * FROM reminders WHERE user_id = ? ORDER BY event_date", (user_id,)).fetchall()

def delete_reminder(reminder_id, user_id):
    """Delete a reminder. Returns True if deleted."""
    with get_db() as db:
        cur = db.execute("DELETE FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, user_id))
        db.commit()
        return cur.rowcount > 0

def get_todays_reminders():
    """Get all reminders occurring today (IST timezone)."""
    today = datetime.now(IST)
    today_mmdd = today.strftime("%m-%d")
    with get_db() as db:
        recurring = db.execute("SELECT * FROM reminders WHERE is_recurring = 1 AND substr(event_date, 6, 5) = ?", (today_mmdd,)).fetchall()
        one_time = db.execute("SELECT * FROM reminders WHERE is_recurring = 0 AND event_date = ?", (today.strftime("%Y-%m-%d"),)).fetchall()
        return list(recurring) + list(one_time)

def get_upcoming_reminders(user_id, days=7):
    """Get reminders in next N days."""
    today = datetime.now(IST)
    upcoming = []
    with get_db() as db:
        for rem in db.execute("SELECT * FROM reminders WHERE user_id = ?", (user_id,)).fetchall():
            event_date = datetime.strptime(rem["event_date"], "%Y-%m-%d")
            if rem["is_recurring"]:
                next_occ = event_date.replace(year=today.year)
                if next_occ < today:
                    next_occ = next_occ.replace(year=today.year + 1)
                delta = (next_occ - today).days
            else:
                delta = (event_date - today).days
            if 0 <= delta <= days:
                upcoming.append({**dict(rem), "days_until": delta})
    return upcoming

# ─── Import / Export ─────────────────────────────────────────
def export_user_reminders_json(user_id):
    """Export all user reminders as JSON string."""
    reminders = get_user_reminders(user_id)
    data = []
    for rem in reminders:
        data.append({
            "name": rem["name"],
            "event_type": rem["event_type"],
            "event_date": rem["event_date"],
            "is_recurring": bool(rem["is_recurring"]),
            "notes": rem["notes"]
        })
    return json.dumps(data, indent=2, ensure_ascii=False)

def export_user_reminders_csv(user_id):
    """Export all user reminders as CSV string."""
    reminders = get_user_reminders(user_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "event_type", "event_date", "is_recurring", "notes"])
    for rem in reminders:
        writer.writerow([rem["name"], rem["event_type"], rem["event_date"], rem["is_recurring"], rem["notes"]])
    return output.getvalue()

def import_reminders_from_json(user_id, chat_id, json_text):
    """Import reminders from JSON. Returns (added_count, errors)."""
    data = json.loads(json_text)
    added = 0
    errors = []
    for i, item in enumerate(data):
        try:
            name = item.get("name", "").strip()
            event_type = item.get("event_type", "custom").strip()
            event_date = item.get("event_date", "").strip()
            is_recurring = 1 if item.get("is_recurring", True) else 0
            notes = item.get("notes", "").strip()
            if not name or not event_date:
                errors.append(f"Row {i+1}: Missing name or date")
                continue
            datetime.strptime(event_date, "%Y-%m-%d")
            add_reminder(user_id, chat_id, name, event_type, event_date, is_recurring, notes)
            added += 1
        except ValueError:
            errors.append(f"Row {i+1}: Invalid date format (use YYYY-MM-DD)")
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")
    return added, errors

def import_reminders_from_csv(user_id, chat_id, csv_text):
    """Import reminders from CSV. Returns (added_count, errors)."""
    reader = csv.DictReader(io.StringIO(csv_text))
    added = 0
    errors = []
    for i, row in enumerate(reader):
        try:
            name = row.get("name", "").strip()
            event_type = row.get("event_type", "custom").strip()
            event_date = row.get("event_date", "").strip()
            is_recurring = 1 if row.get("is_recurring", "1") in ("1", "true", "yes") else 0
            notes = row.get("notes", "").strip()
            if not name or not event_date:
                errors.append(f"Row {i+1}: Missing name or date")
                continue
            datetime.strptime(event_date, "%Y-%m-%d")
            add_reminder(user_id, chat_id, name, event_type, event_date, is_recurring, notes)
            added += 1
        except ValueError:
            errors.append(f"Row {i+1}: Invalid date format")
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")
    return added, errors

# ─── Bot Commands ────────────────────────────────────────────
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start — show main menu."""
    keyboard = [
        [InlineKeyboardButton("➕ Add Event", callback_data="add")],
        [InlineKeyboardButton("📋 My Events", callback_data="list")],
        [InlineKeyboardButton("🔔 Upcoming", callback_data="upcoming")],
        [InlineKeyboardButton("📥 Import", callback_data="import_menu")],
        [InlineKeyboardButton("📤 Export", callback_data="export_menu")],
        [InlineKeyboardButton("🗑️ Delete", callback_data="delete_menu")],
        [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
    ]
    welcome = (
        "🎉 *Welcome to ReminderBot!*\n\n"
        "Never forget a birthday, anniversary, or special event.\n\n"
        "✨ *Features:*\n"
        "• 🎂 Yearly recurring birthday reminders\n"
        "• 📅 One-time event reminders\n"
        "• 📥 Import events from JSON/CSV\n"
        "• 📤 Export your events\n"
        "• 🔔 Daily notifications at " + CHECK_TIME + " IST\n\n"
        "Select an option below:"
    )
    await update.message.reply_text(welcome, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help — show all commands."""
    text = (
        "📖 *ReminderBot Commands*\n\n"
        "/start — Main menu\n"
        "/add — Add a new event\n"
        "/list — View all events\n"
        "/upcoming — Events in next 7 days\n"
        "/today — Today's events\n"
        "/delete \\<id\\> — Delete an event\n"
        "/export — Export all events as JSON\n"
        "/help — Show this message\n\n"
        "📅 *All times are in IST (Indian Standard Time)*\n"
        "🔔 Daily reminder check at " + CHECK_TIME + " IST\n\n"
        "*Event Types:* birthday, anniversary, meeting, holiday, custom\n"
        "*Date Format:* YYYY\\-MM\\-DD (e.g., 1995\\-08\\-15)\n"
        "*Import:* Send a JSON or CSV file to import events"
    )
    await update.message.reply_text(text, parse_mode="Markdown")

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline keyboard button presses."""
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = query.from_user.id

    if data == "add":
        keyboard = [
            [InlineKeyboardButton("🎂 Birthday", callback_data="type_birthday")],
            [InlineKeyboardButton("💍 Anniversary", callback_data="type_anniversary")],
            [InlineKeyboardButton("🎄 Holiday", callback_data="type_holiday")],
            [InlineKeyboardButton("📋 Custom", callback_data="type_custom")],
            [InlineKeyboardButton("🔙 Back", callback_data="back")],
        ]
        await query.edit_message_text("What type of event?", reply_markup=InlineKeyboardMarkup(keyboard))
        return "SELECT_TYPE"

    elif data.startswith("type_"):
        event_type = data.replace("type_", "")
        context.user_data["event_type"] = event_type
        emojis = {"birthday": "🎂", "anniversary": "💍", "holiday": "🎄", "custom": "📋"}
        await query.edit_message_text(f"{emojis.get(event_type, '📅')} Enter the *person's name* or *event name*:", parse_mode="Markdown")
        return "ENTER_NAME"

    elif data == "list":
        reminders = get_user_reminders(user_id)
        if not reminders:
            await query.edit_message_text("📭 No events yet. Use /add to create one!")
            return ConversationHandler.END
        text = "📋 *Your Events:*\\n\\n"
        for rem in reminders:
            recur = "🔄" if rem["is_recurring"] else "📅"
            text += f"`#{rem['id']}` {recur} *{rem['name']}* — {rem['event_date']} ({rem['event_type']})\\n"
        await query.edit_message_text(text, parse_mode="Markdown")
        return ConversationHandler.END

    elif data == "upcoming":
        upcoming = get_upcoming_reminders(user_id, 7)
        if not upcoming:
            await query.edit_message_text("🔔 No events in the next 7 days!")
            return ConversationHandler.END
        text = "🔔 *Upcoming Events:*\\n\\n"
        for rem in sorted(upcoming, key=lambda x: x["days_until"]):
            text += f"*{rem['name']}* — {rem['event_date']} ({rem['days_until']}d)\\n"
        await query.edit_message_text(text, parse_mode="Markdown")
        return ConversationHandler.END

    elif data == "export_menu":
        keyboard = [
            [InlineKeyboardButton("📄 Export as JSON", callback_data="export_json")],
            [InlineKeyboardButton("📊 Export as CSV", callback_data="export_csv")],
            [InlineKeyboardButton("🔙 Back", callback_data="back")],
        ]
        await query.edit_message_text("Choose export format:", reply_markup=InlineKeyboardMarkup(keyboard))

    elif data == "export_json":
        json_data = export_user_reminders_json(user_id)
        if not json_data or json_data == "[]":
            await query.edit_message_text("📭 No events to export!")
            return ConversationHandler.END
        bio = io.BytesIO(json_data.encode("utf-8"))
        bio.name = "reminders.json"
        await query.message.reply_document(document=InputFile(bio), caption="📄 Your events exported as JSON")
        await query.edit_message_text("✅ Export complete!")
        return ConversationHandler.END

    elif data == "export_csv":
        csv_data = export_user_reminders_csv(user_id)
        lines = csv_data.strip().split("\\n")
        if len(lines) <= 1:
            await query.edit_message_text("📭 No events to export!")
            return ConversationHandler.END
        bio = io.BytesIO(csv_data.encode("utf-8"))
        bio.name = "reminders.csv"
        await query.message.reply_document(document=InputFile(bio), caption="📊 Your events exported as CSV")
        await query.edit_message_text("✅ Export complete!")
        return ConversationHandler.END

    elif data == "import_menu":
        text = (
            "📥 *Import Events*\\n\\n"
            "Send me a file (.json or .csv) to import events.\\n\\n"
            "*JSON Format:*\\n"
            "```[{\"name\": \"John\", \"event_date\": \"2024-12-25\", \"is_recurring\": true}]```\\n\\n"
            "*CSV Format:*\\n"
            "```name,event_type,event_date,is_recurring,notes```\\n"
            "```John,birthday,2024-12-25,1,Best friend```\\n\\n"
            "Send a file to get started!"
        )
        await query.edit_message_text(text, parse_mode="Markdown")
        return ConversationHandler.END

    elif data == "delete_menu":
        reminders = get_user_reminders(user_id)
        if not reminders:
            await query.edit_message_text("📭 No events to delete!")
            return ConversationHandler.END
        keyboard = [[InlineKeyboardButton(f"🗑️ #{r['id']} — {r['name']}", callback_data=f"del_{r['id']}")] for r in reminders]
        keyboard.append([InlineKeyboardButton("🔙 Back", callback_data="back")])
        await query.edit_message_text("Select an event to delete:", reply_markup=InlineKeyboardMarkup(keyboard))

    elif data.startswith("del_"):
        rid = int(data.replace("del_", ""))
        if delete_reminder(rid, user_id):
            await query.edit_message_text(f"✅ Event #{rid} deleted!")
        else:
            await query.edit_message_text("❌ Event not found.")
        return ConversationHandler.END

    elif data == "help":
        text = "Use /add to create events, /list to view, /upcoming for next 7 days, or send a file to import!"
        await query.edit_message_text(text)
        return ConversationHandler.END

    elif data == "back":
        keyboard = [
            [InlineKeyboardButton("➕ Add Event", callback_data="add")],
            [InlineKeyboardButton("📋 My Events", callback_data="list")],
            [InlineKeyboardButton("🔔 Upcoming", callback_data="upcoming")],
            [InlineKeyboardButton("📥 Import", callback_data="import_menu")],
            [InlineKeyboardButton("📤 Export", callback_data="export_menu")],
            [InlineKeyboardButton("🗑️ Delete", callback_data="delete_menu")],
            [InlineKeyboardButton("ℹ️ Help", callback_data="help")],
        ]
        await query.edit_message_text("*Main Menu:*", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
        return ConversationHandler.END

# ─── Conversation Handlers ─────────────────────────────────
async def add_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start add event conversation."""
    keyboard = [
        [InlineKeyboardButton("🎂 Birthday", callback_data="type_birthday")],
        [InlineKeyboardButton("💍 Anniversary", callback_data="type_anniversary")],
        [InlineKeyboardButton("🎄 Holiday", callback_data="type_holiday")],
        [InlineKeyboardButton("📋 Custom", callback_data="type_custom")],
    ]
    await update.message.reply_text("📅 *Add New Event*\n\nWhat type?", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    return "SELECT_TYPE"

async def received_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Store name, ask for date."""
    context.user_data["event_name"] = update.message.text.strip()
    await update.message.reply_text("📆 Enter date in *YYYY-MM-DD* format:\nExample: `1995-08-15`", parse_mode="Markdown")
    return "ENTER_DATE"

async def received_date(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Validate date, ask recurring."""
    date_str = update.message.text.strip()
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        context.user_data["event_date"] = date_str
    except ValueError:
        await update.message.reply_text("❌ Invalid! Use *YYYY-MM-DD*\nExample: `2024-12-25`", parse_mode="Markdown")
        return "ENTER_DATE"
    keyboard = [
        [InlineKeyboardButton("🔄 Yes, repeat yearly", callback_data="recur_yes")],
        [InlineKeyboardButton("📅 No, one-time", callback_data="recur_no")],
    ]
    await update.message.reply_text(f"📅 Date: *{date_str}*\n\nRepeat every year?", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    return "ENTER_RECURRING"

async def received_recurring(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Save reminder to database."""
    query = update.callback_query
    await query.answer()
    is_recurring = 1 if query.data == "recur_yes" else 0
    user_id = query.from_user.id
    chat_id = query.message.chat_id
    rid = add_reminder(user_id, chat_id, context.user_data["event_name"], context.user_data["event_type"], context.user_data["event_date"], is_recurring)
    recur_text = "🔄 Repeats yearly" if is_recurring else "📅 One-time"
    emojis = {"birthday": "🎂", "anniversary": "💍", "holiday": "🎄", "custom": "📋"}
    await query.edit_message_text(
        f"✅ *Event Created!*\n\n{emojis.get(context.user_data['event_type'],'📅')} *{context.user_data['event_name']}*\n"
        f"📆 {context.user_data['event_date']}\n{recur_text}\n🆔 `#{rid}`\n\n"
        f"🔔 I'll notify you at {CHECK_TIME} IST on the event day!",
        parse_mode="Markdown"
    )
    context.user_data.clear()
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel conversation."""
    await update.message.reply_text("❌ Cancelled.")
    context.user_data.clear()
    return ConversationHandler.END

# ─── File Import Handler ────────────────────────────────────
async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle imported JSON/CSV files."""
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
    """Handle /list command."""
    reminders = get_user_reminders(update.effective_user.id)
    if not reminders:
        await update.message.reply_text("📭 No events yet.")
        return
    text = "📋 *Your Events:*\\n\\n"
    for rem in reminders:
        recur = "🔄" if rem["is_recurring"] else "📅"
        text += f"`#{rem['id']}` {recur} *{rem['name']}* — {rem['event_date']}\\n"
    await update.message.reply_text(text, parse_mode="Markdown")

async def upcoming_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /upcoming command."""
    upcoming = get_upcoming_reminders(update.effective_user.id, 7)
    if not upcoming:
        await update.message.reply_text("🔔 No events in next 7 days!")
        return
    text = "🔔 *Next 7 Days:*\\n\\n"
    for rem in sorted(upcoming, key=lambda x: x["days_until"]):
        text += f"*{rem['name']}* — {rem['event_date']} ({rem['days_until']}d)\\n"
    await update.message.reply_text(text, parse_mode="Markdown")

async def today_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /today command."""
    today_r = [r for r in get_todays_reminders() if r["user_id"] == update.effective_user.id]
    if not today_r:
        await update.message.reply_text("📅 No events today!")
        return
    text = "🎉 *Today's Events:*\\n\\n"
    for rem in today_r:
        event_date = datetime.strptime(rem["event_date"], "%Y-%m-%d")
        today = datetime.now(IST)
        age = today.year - event_date.year if rem["is_recurring"] else None
        age_text = f" 🎂 Turning {age}!" if age and rem["event_type"] == "birthday" else ""
        text += f"🎂 *{rem['name']}* ({rem['event_type']}){age_text}\\n"
    await update.message.reply_text(text, parse_mode="Markdown")

async def delete_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /delete <id> command."""
    if not context.args:
        await update.message.reply_text("Usage: /delete <event_id>")
        return
    rid = int(context.args[0])
    if delete_reminder(rid, update.effective_user.id):
        await update.message.reply_text(f"✅ Event #{rid} deleted!")
    else:
        await update.message.reply_text("❌ Event not found.")

async def export_json_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /export command — sends JSON file."""
    data = export_user_reminders_json(update.effective_user.id)
    if not data or data == "[]":
        await update.message.reply_text("📭 No events to export!")
        return
    bio = io.BytesIO(data.encode("utf-8"))
    bio.name = "reminders.json"
    await update.message.reply_document(document=InputFile(bio), caption="📄 Your events (JSON)")

# ─── Scheduled Job ──────────────────────────────────────────
async def send_daily_reminders(context: ContextTypes.DEFAULT_TYPE):
    """Daily job: send reminders for today's events (IST timezone)."""
    logger.info("Running daily reminder check...")
    for rem in get_todays_reminders():
        try:
            event_date = datetime.strptime(rem["event_date"], "%Y-%m-%d")
            today = datetime.now(IST)
            age = today.year - event_date.year if rem["is_recurring"] else None
            age_text = f" 🎂 Turning {age}!" if age and rem["event_type"] == "birthday" else ""
            emojis = {"birthday": "🎂", "anniversary": "💍", "holiday": "🎄", "custom": "📅"}
            await context.bot.send_message(
                chat_id=rem["chat_id"],
                text=f"🔔 *Reminder!*\n\n{emojis.get(rem['event_type'],'📅')} *{rem['name']}*'s {rem['event_type']} is today!{age_text}",
                parse_mode="Markdown"
            )
        except Exception as e:
            logger.error("Failed to send reminder: %s", e)

# ─── Main ──────────────────────────────────────────────────
def main():
    """Start the bot."""
    import threading
    from http.server import HTTPServer, BaseHTTPRequestHandler
    
    logger.info("Starting ReminderBot...")
    init_db()

    app = Application.builder().token(BOT_TOKEN).build()

    # Conversation handler for adding events
    add_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(handle_callback, pattern="^add$"), CommandHandler("add", add_cmd)],
        states={
            "SELECT_TYPE": [CallbackQueryHandler(handle_callback, pattern="^type_")],
            "ENTER_NAME": [MessageHandler(filters.TEXT & ~filters.COMMAND, received_name)],
            "ENTER_DATE": [MessageHandler(filters.TEXT & ~filters.COMMAND, received_date)],
            "ENTER_RECURRING": [CallbackQueryHandler(received_recurring, pattern="^recur_")],
        },
        fallbacks=[CallbackQueryHandler(handle_callback, pattern="^back$"), CommandHandler("cancel", cancel)],
    )

    # Register all handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(add_conv)
    app.add_handler(CommandHandler("list", list_cmd))
    app.add_handler(CommandHandler("upcoming", upcoming_cmd))
    app.add_handler(CommandHandler("today", today_cmd))
    app.add_handler(CommandHandler("delete", delete_cmd))
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
    logger.info("Daily check scheduled at %s IST", CHECK_TIME)

    # Start bot polling in a background thread
    bot_thread = threading.Thread(target=lambda: app.run_polling(allowed_updates=Update.ALL_TYPES), daemon=True)
    bot_thread.start()
    logger.info("Bot polling started in background thread")

    # Start HTTP health check server for Railway
    class HealthHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ReminderBot is running!")
        def log_message(self, format, *args):
            pass  # Suppress HTTP request logs
    
    port = int(os.getenv("PORT", "8080"))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    logger.info("Health check server started on port %s", port)
    server.serve_forever()

if __name__ == "__main__":
    main()


if __name__ == "__main__":
    main()
