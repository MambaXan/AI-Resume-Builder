from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class ResumeBase(BaseModel):
    title: str

class ResumeCreate(ResumeBase):
    pass

class UserForResume(BaseModel):
    email: str
    id: int

    class Config:
        from_attributes = True

class Resume(ResumeBase):
    id: int
    user_id: int
    owner: UserForResume

    class Config:
        from_attributes = True



class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    resumes: List[Resume] = []

    class Config:
        from_attributes = True

class ResumeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)