# from pydantic import BaseModel, EmailStr, Field
# from typing import List, Optional


# class ExperienceBase(BaseModel):
#     company: str
#     position: str
#     location: Optional[str] = None
#     start_date: Optional[str] = None
#     end_date: Optional[str] = None
#     description: Optional[str] = None


# class ExperienceCreate(ExperienceBase):
#     pass


# class Experience(ExperienceBase):
#     id: int
#     resume_id: int

#     class Config:
#         from_attributes = True


# class SkillBase(BaseModel):
#     name: str
#     level: Optional[str] = None


# class SkillCreate(SkillBase):
#     pass


# class Skill(SkillBase):
#     id: int
#     resume_id: int

#     class Config:
#         from_attributes = True


# class ResumeBase(BaseModel):
#     title: str = "Untitled Resume"
#     full_name: Optional[str] = None
#     email: Optional[str] = None
#     phone: Optional[str] = None


# class ResumeCreate(BaseModel):
#     title: str
#     full_name: Optional[str] = None
#     email: Optional[str] = None
#     phone: Optional[str] = None
#     location: Optional[str] = None
#     website: Optional[str] = None
#     linkedin: Optional[str] = None
#     summary: Optional[str] = None
#     work_experience: List[ExperienceCreate] = []
#     education: List[ExperienceCreate] = []
#     skills: List[SkillCreate] = []


# class Resume(ResumeCreate):
#     id: int
#     user_id: int
#     experiences: List[Experience] = []
#     skills: List[Skill] = []
#     class Config:
#         from_attributes = True


# class UserBase(BaseModel):
#     email: EmailStr


# class UserCreate(UserBase):
#     password: str


# class User(UserBase):
#     id: int
#     resumes: List[Resume] = []

#     class Config:
#         from_attributes = True
from pydantic import BaseModel, EmailStr
from typing import List, Optional

# Базовая схема для опыта


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

# Базовая схема для навыков


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

# ГЛАВНОЕ: Схема создания резюме (должна совпадать с фронтом!)


class ResumeCreate(BaseModel):
    title: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    summary: Optional[str] = None
    # Проверь, как эти поля называются в твоем JSON на фронте!
    # Если на фронте 'work_experience', то пишем так:
    work_experience: List[ExperienceCreate] = []
    education: List[ExperienceCreate] = []
    skills: List[SkillCreate] = []

# Схема для выдачи данных


class Resume(ResumeCreate):
    id: int
    user_id: int
    # Используем названия связей из models.py
    experiences: List[Experience] = []
    skills: List[Skill] = []

    class Config:
        from_attributes = True

# Схема для образования (теперь поля совпадут с фронтом)


class EducationBase(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None


class EducationCreate(EducationBase):
    pass

# Обнови ResumeCreate


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
    education: List[EducationCreate] = []  # Теперь используем EducationCreate!
    skills: List[SkillCreate] = []
