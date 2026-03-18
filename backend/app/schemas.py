from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional


class ResumeBase(BaseModel):
    title: str = "Untitled Resume"
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    summary: Optional[str] = None
    work_experience: List[dict] = []
    education: List[dict] = []
    skills: List[dict] = []


class ResumeCreate(ResumeBase):
    title: str = Field(..., min_length=1, max_length=100)


class UserForResume(BaseModel):
    email: str
    id: int

    class Config:
        from_attributes = True


class Resume(ResumeBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool = True
    resumes: List[Resume] = []

    class Config:
        from_attributes = True


class ResumeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100,
                       strip_whitespace=True)
