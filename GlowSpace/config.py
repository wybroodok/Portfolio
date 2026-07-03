from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
ADMIN_IDS: list[int] = [
    int(i) for i in os.getenv("ADMIN_IDS", "").split(",") if i.strip()
]
# Часовой пояс для всего бота. Меняется через .env: TIMEZONE=Asia/Yekaterinburg
TIMEZONE: str = os.getenv("TIMEZONE", "Europe/Moscow")
# URL, на котором хостится webapp (нужен HTTPS для Telegram Mini App)
# Для локальной разработки: ngrok или любой туннель
WEBAPP_URL: str = os.getenv("WEBAPP_URL", "")
API_PORT: int = int(os.getenv("API_PORT", "8000"))
