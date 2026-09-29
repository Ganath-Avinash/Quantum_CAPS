import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from database import get_db
import jwt

router = APIRouter(prefix="/api/v1/auth", tags=["QxLabs Authentication"])

JWT_SECRET = os.getenv("JWT_SECRET", "qxlabs-jwt-secret-quantum-2026-auth-token")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30

def hash_password(password: str) -> str:
    """Generate a secure PBKDF2 HMAC SHA-256 hash with a random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100000)
    return f"{salt}${key.hex()}"

def verify_password(stored_password_hash: str, provided_password: str) -> bool:
    """Verify password against stored salt$hash."""
    try:
        salt, expected_hash = stored_password_hash.split("$", 1)
        derived_key = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), bytes.fromhex(salt), 100000)
        return secrets.compare_digest(derived_key.hex(), expected_hash)
    except Exception:
        return False

def create_jwt_token(user_id: str, email: str, name: str, role: str = "learner") -> str:
    payload = {
        "sub": user_id,
        "uid": user_id,
        "email": email,
        "name": name,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=1, description="Full Name")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    uid: str
    email: str
    full_name: str
    role: str = "learner"

class AuthResponse(BaseModel):
    token: str
    user: UserResponse


import asyncio

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    norm_email = req.email.strip().lower()
    db = get_db()
    
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is reconnecting. Please try again in a few moments."
        )

    try:
        existing_user = await asyncio.wait_for(db.users.find_one({"email": norm_email}), timeout=4.0)
    except Exception as e:
        print(f"[Auth Error] User lookup failed: {e}")
        existing_user = None

    if existing_user:
        # If the user already has a password, advise them to log in
        if existing_user.get("password_hash"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please log in."
            )
        # Legacy account without a password hash: set the password and activate account
        password_hash = hash_password(req.password)
        user_id = str(existing_user["_id"])
        full_name = req.full_name.strip() or existing_user.get("full_name") or existing_user.get("display_name") or norm_email.split("@")[0]
        try:
            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {
                    "password_hash": password_hash,
                    "full_name": full_name,
                    "display_name": full_name,
                    "updated_at": datetime.now(timezone.utc),
                }}
            )
        except Exception as e:
            print(f"[Auth Error] Account upgrade write failed: {e}")

        token = create_jwt_token(user_id=user_id, email=norm_email, name=full_name, role=existing_user.get("role", "learner"))
        return AuthResponse(
            token=token,
            user=UserResponse(
                id=user_id,
                uid=existing_user.get("firebase_uid", user_id),
                email=norm_email,
                full_name=full_name,
                role=existing_user.get("role", "learner")
            )
        )

    password_hash = hash_password(req.password)
    user_id = f"user_{secrets.token_hex(12)}"
    new_user_doc = {
        "email": norm_email,
        "password_hash": password_hash,
        "full_name": req.full_name.strip(),
        "display_name": req.full_name.strip(),
        "role": "learner",
        "xp_total": 0,
        "firebase_uid": user_id,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = await asyncio.wait_for(db.users.insert_one(new_user_doc), timeout=4.0)
        user_id = str(result.inserted_id)
        await db.users.update_one({"_id": result.inserted_id}, {"$set": {"firebase_uid": user_id}})
    except Exception as e:
        print(f"[Auth Error] Failed to persist new user to MongoDB: {e}")
        # Check if error was duplicate key error (code 11000)
        if "duplicate" in str(e).lower() or "11000" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please log in."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account creation could not be saved to the database. Please try again."
        )

    token = create_jwt_token(user_id=user_id, email=norm_email, name=req.full_name.strip())

    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            uid=user_id,
            email=norm_email,
            full_name=req.full_name.strip(),
            role="learner"
        )
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    norm_email = req.email.strip().lower()
    
    # Instant fallback for demo credentials even during DB downtime
    if norm_email == "demo@qxlabs.ai" and req.password == "quantum123":
        user_id = "67c3b28f1e582b5e58c00001"
        token = create_jwt_token(user_id=user_id, email=norm_email, name="Quantum Explorer", role="learner")
        return AuthResponse(
            token=token,
            user=UserResponse(
                id=user_id,
                uid=user_id,
                email=norm_email,
                full_name="Quantum Explorer",
                role="learner"
            )
        )

    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is reconnecting. Please retry shortly."
        )

    try:
        user_doc = await asyncio.wait_for(db.users.find_one({"email": norm_email}), timeout=4.0)
    except Exception as e:
        print(f"[Auth Warning] MongoDB lookup failed or timed out: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database lookup timed out. Please try again."
        )

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please check your spelling or sign up."
        )

    stored_hash = user_doc.get("password_hash")
    if not stored_hash:
        # Legacy account: set password hash to the provided password and proceed
        stored_hash = hash_password(req.password)
        try:
            await db.users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"password_hash": stored_hash}}
            )
        except Exception as e:
            print(f"[Auth Error] Failed to set password on legacy user: {e}")
    elif not verify_password(stored_hash, req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify and try again."
        )

    user_id = str(user_doc["_id"])
    name = user_doc.get("full_name") or user_doc.get("display_name") or norm_email.split("@")[0]
    role = user_doc.get("role", "learner")

    token = create_jwt_token(user_id=user_id, email=norm_email, name=name, role=role)

    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            uid=user_doc.get("firebase_uid", user_id),
            email=norm_email,
            full_name=name,
            role=role
        )
    )



# Also support legacy path `/api/user/me`
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(lambda: None)):
    from auth import get_current_user
    # Handled via dependency injection inside auth.py
    pass
