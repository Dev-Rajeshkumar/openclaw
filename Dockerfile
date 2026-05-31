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

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY bot.py .

# Run the bot
CMD ["python", "bot.py"]
