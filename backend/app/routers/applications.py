from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/stats/summary")
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    apps = db.query(models.Application).filter(
        models.Application.user_id == current_user.id
    ).all()

    total = len(apps)

    by_status = {}
    for app in apps:
        by_status[app.status] = by_status.get(app.status, 0) + 1

    responded = total - by_status.get("Applied", 0)
    response_rate = round((responded / total * 100), 1) if total > 0 else 0

    interviews = by_status.get("Interview", 0)
    interview_rate = round((interviews / total * 100), 1) if total > 0 else 0

    offers = by_status.get("Offer", 0)
    offer_rate = round((offers / total * 100), 1) if total > 0 else 0

    return {
        "total": total,
        "by_status": by_status,
        "response_rate": response_rate,
        "interview_rate": interview_rate,
        "offer_rate": offer_rate,
    }


@router.get("/", response_model=List[schemas.ApplicationOut])
def get_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Application).filter(
        models.Application.user_id == current_user.id
    ).order_by(models.Application.created_at.desc()).all()


@router.post("/", response_model=schemas.ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_app = models.Application(
        **application.model_dump(),
        user_id=current_user.id
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


@router.get("/{id}", response_model=schemas.ApplicationOut)
def get_application(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    app = db.query(models.Application).filter(
        models.Application.id == id,
        models.Application.user_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.put("/{id}", response_model=schemas.ApplicationOut)
def update_application(
    id: int,
    updates: schemas.ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    app = db.query(models.Application).filter(
        models.Application.id == id,
        models.Application.user_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(app, key, value)

    db.commit()
    db.refresh(app)
    return app


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    app = db.query(models.Application).filter(
        models.Application.id == id,
        models.Application.user_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(app)
    db.commit()