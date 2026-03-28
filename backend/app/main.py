from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, crud, schemas, auth_utils
from .database import engine, SessionLocal
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from .ai_service import generate_job_description

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

print("Connecting to database and creating tables...")
models.Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

models.Base.metadata.drop_all(bind=engine) 
models.Base.metadata.create_all(bind=engine)

app = FastAPI()


class AIRequest(BaseModel):
    position: str
    company: Optional[str] = None


class AIResponse(BaseModel):
    description: str


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY,
                             algorithms=[auth_utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


@app.post("/auth/register", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    return crud.create_user(db=db, user=user)


@app.post("/auth/token")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=form_data.username)

    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401, detail="Incorrect email or password")

    access_token = auth_utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/resumes/", response_model=schemas.Resume, status_code=201)
def create_resume_for_user(
    resume: schemas.ResumeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Creating new resume for authorized user
    """
    return crud.create_user_resume(db=db, resume=resume, user_id=current_user.id)


@app.get("/resumes/", response_model=List[schemas.Resume])
def get_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Получаем список всех резюме текущего пользователя.
    """
    return crud.get_user_resumes(db, user_id=current_user.id)


@app.get("/resumes/{resume_id}", response_model=schemas.Resume)
def read_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = crud.get_resume(
        db=db, resume_id=resume_id, user_id=current_user.id)

    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    return resume


@app.delete("/resumes/{resume_id}")
def delete_user_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    success = crud.delete_resume(
        db, resume_id=resume_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=404, detail="Resume not found or access denied")

    return {"detail": "Resume deleted successfully"}


@app.put("/resumes/{resume_id}")
def update_user_resume(
    resume_id: int,
    resume_update: schemas.ResumeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    updated = crud.update_resume(
        db, resume_id=resume_id, user_id=current_user.id, update_data=resume_update)

    if not updated:
        raise HTTPException(
            status_code=404, detail="Resume not found or access denied")

    return updated


@app.post("/api/generate-description", response_model=AIResponse)
def api_generate_description(request: AIRequest):
    if not request.position:
        raise HTTPException(status_code=400, detail="Position is required")

    generated_text = generate_job_description(
        request.position, request.company)

    return AIResponse(description=generated_text)
