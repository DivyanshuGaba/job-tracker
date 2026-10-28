from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/health/ready")
def ready(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail="Database not reachable")
    return {"status": "ready"}
