# ═══════════════════════════════════════════════════════════
# Telegram Reminder Bot — Docker Image
# For: Railway.app / Any Docker-compatible host
# ═══════════════════════════════════════════════════════════

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY bot.py .
COPY .env.example .env

# Data directory for SQLite (persist across deploys if using Railway volumes)
VOLUME ["/app/data"]

# Run the bot
CMD ["python", "bot.py"]
