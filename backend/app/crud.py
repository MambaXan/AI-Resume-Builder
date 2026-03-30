from sqlalchemy.orm import Session, joinedload
from . import models, schemas, auth_utils


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_p = auth_utils.get_password_hash(user.password)

    db_user = models.User(
        email=user.email,
        hashed_password=hashed_p
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_resumes(db: Session, user_id: int):
    return db.query(models.Resume).filter(models.Resume.user_id == user_id).all()


def create_user_resume(db: Session, resume: schemas.ResumeCreate, user_id: int):
    db_resume = models.Resume(
        **resume.model_dump(exclude={'work_experience', 'education', 'skills'}),
        user_id=user_id
    )
    db.add(db_resume)
    db.flush()

    for exp in resume.work_experience:
        db.add(models.Experience(**exp.model_dump(), resume_id=db_resume.id))

    for edu in resume.education:
        db.add(models.Education(**edu.model_dump(), resume_id=db_resume.id))

    for sk in resume.skills:
        db.add(models.Skill(**sk.model_dump(), resume_id=db_resume.id))

    db.commit()
    db.refresh(db_resume)
    return db_resume


def get_user_resumes(db: Session, user_id: int):
    return db.query(models.Resume).filter(models.Resume.user_id == user_id).all()


def get_resume(db: Session, resume_id: int):
    return db.query(models.Resume)\
        .options(
            joinedload(models.Resume.work_experience),
            joinedload(models.Resume.education),
            joinedload(models.Resume.skills)
    )\
        .filter(models.Resume.id == resume_id)\
        .first()


def delete_resume(db: Session, resume_id: int, user_id: int):
    db_resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == user_id
    ).first()

    if db_resume:
        db.delete(db_resume)
        db.commit()
        return True

    return False


def update_resume(db: Session, resume_id: int, user_id: int, update_data: schemas.ResumeCreate):
    db_resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id, models.Resume.user_id == user_id).first()
    if not db_resume:
        return None

    for key, value in update_data.model_dump(exclude={'work_experience', 'education', 'skills'}).items():
        setattr(db_resume, key, value)

    db.query(models.Experience).filter(
        models.Experience.resume_id == resume_id).delete()
    for exp in update_data.work_experience:
        db.add(models.Experience(**exp.model_dump(), resume_id=resume_id))

    db.query(models.Education).filter(
        models.Education.resume_id == resume_id).delete()
    for edu in update_data.education:
        db.add(models.Education(**edu.model_dump(), resume_id=resume_id))

    db.query(models.Skill).filter(models.Skill.resume_id == resume_id).delete()
    for sk in update_data.skills:
        db.add(models.Skill(**sk.model_dump(), resume_id=resume_id))

    db.commit()
    db.refresh(db_resume)
    return db_resume
