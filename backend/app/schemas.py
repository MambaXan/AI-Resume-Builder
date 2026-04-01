from pydantic import BaseModel, EmailStr
from typing import List, Optional


class ExperienceBase(BaseModel):
    company: str = ""
    position: str = ""
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
    name: str = ""
    level: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class Skill(SkillBase):
    id: int
    resume_id: int

    class Config:
        from_attributes = True


class EducationBase(BaseModel):
    institution: str = ""
    degree: str = ""
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None


class EducationCreate(EducationBase):
    pass



class Education(EducationBase):
    id: int
    resume_id: int

    class Config:
        from_attributes = True


class ResumeCreate(BaseModel):
    title: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    summary: Optional[str] = None
    work_experience: List[ExperienceCreate] = []
    education: List[EducationCreate] = []
    skills: List[SkillCreate] = []


class Resume(BaseModel):
    id: int
    user_id: int
    title: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    summary: Optional[str] = None
    work_experience: List[Experience] = []
    education: List[Education] = []
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
