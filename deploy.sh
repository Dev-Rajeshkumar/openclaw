#!/bin/bash
# ═══════════════════════════════════════════════════════════
# FormFlow Reminder Bot — Deployment Script
# Works on: Oracle Cloud Free Tier, AWS Free Tier, any Ubuntu VPS
# ═══════════════════════════════════════════════════════════

set -e

echo "🚀 Deploying ReminderBot..."

# ─── 1. System Updates ─────────────────────────────────────
sudo apt update && sudo apt upgrade -y

# ─── 2. Install Python 3.11+ ───────────────────────────────
sudo apt install -y python3 python3-pip python3-venv git

# ─── 3. Clone the bot from GitHub ──────────────────────────
cd /home/ubuntu
if [ -d "reminder-bot" ]; then
    cd reminder-bot && git pull
else
    git clone -b reminder-bot --single-branch https://github.com/Dev-Rajeshkumar/openclaw.git reminder-bot
    cd reminder-bot
fi

# ─── 4. Set up Python virtual environment ──────────────────
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# ─── 5. Create .env file ───────────────────────────────────
if [ ! -f .env ]; then
    echo "BOT_TOKEN=YOUR_BOT_TOKEN_HERE" > .env
    echo "DB_PATH=/home/ubuntu/reminder-bot/reminders.db" >> .env
    echo "CHECK_TIME=09:00" >> .env
    echo "⚠️  Edit .env with your actual BOT_TOKEN!"
fi

# ─── 6. Set up systemd service (auto-start on boot) ────────
sudo tee /etc/systemd/system/reminder-bot.service > /dev/null << 'SERVICEEOF'
[Unit]
Description=Telegram Reminder Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/reminder-bot
Environment=PATH=/home/ubuntu/reminder-bot/venv/bin:/usr/bin
ExecStart=/home/ubuntu/reminder-bot/venv/bin/python bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

# ─── 7. Enable and start the service ───────────────────────
sudo systemctl daemon-reload
sudo systemctl enable reminder-bot
sudo systemctl start reminder-bot

echo ""
echo "✅ Bot deployed successfully!"
echo ""
echo "📋 Useful commands:"
echo "  sudo systemctl status reminder-bot    # Check status"
echo "  sudo systemctl restart reminder-bot   # Restart"
echo "  sudo journalctl -u reminder-bot -f    # View logs"
echo ""
echo "⚠️  Don't forget to edit .env with your BOT_TOKEN!"
echo "   nano /home/ubuntu/reminder-bot/.env"
