from sqlalchemy.orm import Session
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
    # Убираем лишние вложенные списки, так как база их не съест в таком виде прямо в конструктор
    resume_data = resume.dict(
        exclude={"work_experience", "education", "skills"})

    # Теперь передаем данные в модель, где имена полей совпадают
    db_resume = models.Resume(
        **resume_data,
        full_name=full_name,  # Было name
        user_id=user_id
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume


def get_user_resumes(db: Session, user_id: int):
    return db.query(models.Resume).filter(models.Resume.user_id == user_id).all()


def get_resume(db: Session, resume_id: int, user_id: int):
    return db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == user_id
    ).first()


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
        models.Resume.id == resume_id,
        models.Resume.user_id == user_id
    ).first()

    if db_resume:
        db_resume.title = update_data.title
        db.commit()
        db.refresh(db_resume)
        return db_resume

    return None
