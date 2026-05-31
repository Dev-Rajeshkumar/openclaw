# 🤖 Telegram Reminder Bot

Never forget a birthday, anniversary, or special event again.

## Features

- 🎂 **Birthday reminders** — yearly recurring, with age calculation
- 📅 **One-time events** — meetings, holidays, custom events
- 🔔 **Daily notifications** at your configured time (IST)
- 📥 **Import** events from JSON or CSV files
- 📤 **Export** all events as JSON or CSV
- 💾 **SQLite** persistent storage
- 🕐 All times in **IST (Indian Standard Time, UTC+5:30)**

## Quick Start

### 1. Get a Bot Token

1. Open Telegram → Message **@BotFather**
2. Send `/newbot`
3. Name your bot
4. Copy the token (e.g., `123456789:ABCdef...`)

### 2. Deploy (Free)

#### Option A: Railway.app (Easiest - Recommended)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select `Dev-Rajeshkumar/openclaw` → branch `reminder-bot`
4. Go to **Variables** → Add:
   - `BOT_TOKEN` = your bot token from @BotFather
5. Click **Deploy**

Your bot will be live in ~2 minutes! 🎉

#### Option B: Oracle Cloud (Always Free)

1. Create a free Oracle Cloud account
2. Launch an "Always Free" VM (Ubuntu)
3. SSH into the VM and run:

```bash
sudo apt update && sudo apt install -y python3-pip git
git clone -b reminder-bot https://github.com/Dev-Rajeshkumar/openclaw.git
cd openclaw
pip3 install -r requirements.txt
BOT_TOKEN=your_token_here python3 bot.py
```

Use `screen` to run in background:
```bash
screen -S bot
BOT_TOKEN=your_token_here python3 bot.py
# Ctrl+A+D to detach
```

#### Option C: Your Own Server / VPS

```bash
git clone -b reminder-bot https://github.com/Dev-Rajeshkumar/openclaw.git
cd openclaw
pip3 install -r requirements.txt
cp .env.example .env
nano .env  # Set BOT_TOKEN
python3 bot.py
```

### 3. Usage

Open your bot on Telegram and send `/start`

**Commands:**
- `/start` — Main menu with buttons
- `/add` — Add a new event
- `/list` — View all events
- `/upcoming` — Events in next 7 days
- `/today` — Today's events
- `/delete <id>` — Delete an event
- `/export` — Export all events as JSON
- `/help` — Show all commands

**Import/Export:**
- Send a `.json` or `.csv` file to import events
- Use inline buttons or `/export` to export

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | Required |
| `DB_PATH` | SQLite database file path | `reminders.db` |
| `CHECK_TIME` | Daily check time (24h format, IST) | `09:00` |

## Tech Stack

- Python 3.11+
- python-telegram-bot v21
- APScheduler
- pytz (IST timezone)
- SQLite

## License

MIT
