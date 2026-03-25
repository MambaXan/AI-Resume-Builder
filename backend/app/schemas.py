from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class ExperienceBase(BaseModel):
    company: str
    position: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class ExperienceCreate(ExperienceBase):
    pass

class Experience(ExperienceBase):
    id: int
    resume_id: int

    class Config:
        from_attributes = True

class SkillBase(BaseModel):
    name: str
    level: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int
    resume_id: int

    class Config:
        from_attributes = True

class ResumeBase(BaseModel):
    title: str = "Untitled Resume"
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class ResumeCreate(ResumeBase):
    title: str = Field(..., min_length=1, max_length=100)

class Resume(ResumeBase):
    id: int
    user_id: int
    experiences: List[Experience] = []
    skills: List[Skill] = []

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    resumes: List[Resume] = []

    class Config:
        from_attributes = True