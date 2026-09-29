import json
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
import jwt
from database import get_db

security = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET", "qxlabs-jwt-secret-quantum-2026-auth-token")
JWT_ALGORITHM = "HS256"

# Optional Firebase fallback (only if credentials exist)
_firebase_initialized = False
def init_firebase_optional():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials
        cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
        if cred_path and os.path.exists(cred_path):
            firebase_admin.initialize_app(credentials.Certificate(cred_path))
            _firebase_initialized = True
    except Exception:
        pass


async def get_verified_user_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Extracts the Bearer token, verifies it against QxLabs JWT secret,
    and returns the decoded claims.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # 0. Instant demo and local sandbox token handling
    if token.startswith("qxlabs-demo-") or token.startswith("qxlabs-local-"):
        return {
            "sub": "demo_user",
            "uid": "demo_user",
            "email": "demo@qxlabs.ai",
            "name": "Quantum Explorer",
            "role": "learner"
        }

    # 1. Attempt native QxLabs JWT verification
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        pass

    # 2. Optional fallback to Firebase token if Firebase Admin is configured
    try:
        init_firebase_optional()
        import firebase_admin
        from firebase_admin import auth as fb_auth
        if firebase_admin._apps:
            fb_decoded = fb_auth.verify_id_token(token, check_revoked=False)
            return {
                "sub": fb_decoded.get("uid"),
                "uid": fb_decoded.get("uid"),
                "email": fb_decoded.get("email", ""),
                "name": fb_decoded.get("name", "Quantum User"),
                "role": "learner"
            }
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Backwards compatibility alias for existing routers
get_verified_firebase_user = get_verified_user_payload


async def get_current_user(payload: dict = Depends(get_verified_user_payload)) -> dict:
    """
    Returns the MongoDB user document for the authenticated user.
    Maintains compatibility with all routers (qroute, bloch, simulation, etc.).
    """
    db = get_db()
    uid = payload.get("uid") or payload.get("sub")
    email = payload.get("email", "")
    name = payload.get("name") or (email.split("@")[0] if email else "Quantum Explorer")
    role = payload.get("role", "learner")

    if db is not None and uid:
        try:
            # Query by ObjectId if valid, else by firebase_uid / email
            query = []
            if ObjectId.is_valid(uid):
                query.append({"_id": ObjectId(uid)})
            query.append({"firebase_uid": uid})
            if email:
                query.append({"email": email})
            
            user_doc = await db.users.find_one({"$or": query})
            if user_doc:
                user_doc["_id"] = str(user_doc["_id"])
                user_doc["firebase_uid"] = user_doc.get("firebase_uid", str(user_doc["_id"]))
                return user_doc

            # Automatically upsert user if not present
            new_user = {
                "firebase_uid": uid,
                "email": email,
                "full_name": name,
                "display_name": name,
                "role": role,
                "xp_total": 0,
            }
            res = await db.users.insert_one(new_user)
            new_user["_id"] = str(res.inserted_id)
            return new_user
        except Exception as e:
            print(f"[Auth Warning] User DB lookup error: {e}")

    # Fallback user dictionary
    return {
        "_id": uid,
        "firebase_uid": uid,
        "email": email,
        "full_name": name,
        "display_name": name,
        "role": role,
        "xp_total": 0,
    }


def require_role(required_role: str):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user.get("role") != required_role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return role_checker


async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Returns the authenticated user document if a valid Bearer token is provided.
    If no token is supplied or the token is expired/invalid, returns a safe guest user dict
    rather than rejecting the request with 401. Useful for interactive learning sandboxes.
    """
    if not credentials or not credentials.credentials:
        return {
            "_id": "guest_user",
            "firebase_uid": "guest_user",
            "email": "guest@qxlabs.ai",
            "full_name": "Quantum Explorer",
            "display_name": "Quantum Explorer",
            "role": "learner",
            "xp_total": 0,
        }
    try:
        payload = await get_verified_user_payload(credentials)
        return await get_current_user(payload)
    except Exception:
        return {
            "_id": "guest_user",
            "firebase_uid": "guest_user",
            "email": "guest@qxlabs.ai",
            "full_name": "Quantum Explorer",
            "display_name": "Quantum Explorer",
            "role": "learner",
            "xp_total": 0,
        }

