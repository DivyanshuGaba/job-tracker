from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class ApplicationCreate(BaseModel):
    company: str
    role: str
    status: str = "Applied"
    date_applied: str
    job_url: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    id: int
    company: str
    role: str
    status: str
    date_applied: str
    job_url: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    date_applied: Optional[str] = None
    job_url: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    notes: Optional[str] = None