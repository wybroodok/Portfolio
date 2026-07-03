"""LogiqAI — FastAPI backend.

Async, framework-light. Lightweight username accounts (each gets a unique id),
and audits are stored per-user so the Analytics view stays scoped to its owner.
One real analysis endpoint (`/api/analyze`) sends a file to the AI and returns a
fully structured, owned `AuditRecord`; if the AI is unavailable it returns 503
(no mock fallback). A BackgroundTask simulates persistence.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ai_service import AIUnavailableError, analyze, has_api_key
from models import AuditRecord, RegisterRequest, User

UNAVAILABLE_MSG = "The audit service is temporarily unavailable. Please try again later."

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("logiqai")

app = FastAPI(
    title="LogiqAI",
    description="AI-powered audit service for code, spend, and résumés.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".json", ".csv", ".txt", ".pdf", ".md", ".py", ".js", ".ts"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB

# In-memory "database" (imitation persistence).
_USERS: dict[str, User] = {}                 # user_id -> User
_USERS_BY_NAME: dict[str, str] = {}          # lowercased username -> user_id
_AUDITS: dict[str, list[AuditRecord]] = {}   # user_id -> [records], newest first


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _persist(record: AuditRecord) -> None:
    """Stand-in for a DB write; runs after the response is returned."""
    _AUDITS.setdefault(record.user_id, []).insert(0, record)
    logger.info(
        "Persisted audit %s for user %s (%s)",
        record.id, record.user_id, record.filename,
    )


def _decode(raw: bytes) -> str:
    try:
        return raw.decode("utf-8", errors="ignore")
    except Exception:
        return raw.decode("latin-1", errors="ignore")


@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "ai_enabled": has_api_key(),
    }


@app.post("/api/register", response_model=User)
async def register(body: RegisterRequest) -> User:
    """Register (or re-enter) by username. Idempotent: an existing name returns
    its existing account, so a returning user keeps their audit history."""
    name = body.username.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Username cannot be empty.")

    existing_id = _USERS_BY_NAME.get(name.lower())
    if existing_id:
        return _USERS[existing_id]

    user = User(id=str(uuid.uuid4()), username=name, created_at=_now())
    _USERS[user.id] = user
    _USERS_BY_NAME[name.lower()] = user.id
    _AUDITS.setdefault(user.id, [])
    logger.info("Registered user %s (%s)", user.id, user.username)
    return user


@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str) -> User:
    """Used on reload to validate a saved (localStorage) session."""
    user = _USERS.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@app.post("/api/analyze", response_model=AuditRecord)
async def analyze_endpoint(
    background_tasks: BackgroundTasks,
    user_id: str = Form(...),
    file: UploadFile = File(...),
) -> AuditRecord:
    if user_id not in _USERS:
        raise HTTPException(status_code=401, detail="Unknown user. Please register.")

    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Читаем не больше лимита + 1 байт: так огромная загрузка не попадёт целиком
    # в память до проверки размера (защита от memory-DoS).
    raw = await file.read(MAX_BYTES + 1)
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 5 MB limit.")

    content = _decode(raw)
    try:
        result = await analyze(filename, content)
    except AIUnavailableError:
        # No mock fallback — surface a clean "temporarily unavailable" instead.
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MSG)

    record = AuditRecord(
        id=str(uuid.uuid4()),
        user_id=user_id,
        filename=filename,
        created_at=_now(),
        result=result,
    )
    background_tasks.add_task(_persist, record)
    return record


@app.get("/api/users/{user_id}/audits", response_model=list[AuditRecord])
async def list_user_audits(user_id: str) -> list[AuditRecord]:
    """This user's audit history (newest first) — the source for the Analytics
    view, so one user's analytics never mix with another's."""
    if user_id not in _USERS:
        raise HTTPException(status_code=404, detail="User not found.")
    return _AUDITS.get(user_id, [])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
