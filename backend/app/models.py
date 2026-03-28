from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    resumes = relationship("Resume", back_populates="owner",
                           cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)

    full_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    summary = Column(Text, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="resumes")

    experiences = relationship(
        "Experience", back_populates="resume", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="resume",
                          cascade="all, delete-orphan")


class Experience(Base):
    __tablename__ = "experiences"
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String)
    position = Column(String)
    location = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    resume_id = Column(Integer, ForeignKey("resumes.id"))
    resume = relationship("Resume", back_populates="experiences")


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    level = Column(String, nullable=True)

    resume_id = Column(Integer, ForeignKey("resumes.id"))
    resume = relationship("Resume", back_populates="skills")
