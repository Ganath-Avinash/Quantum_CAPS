import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
from database import connect_to_mongo, close_mongo_connection, get_db
from routers.auth_router import hash_password, create_jwt_token

async def seed_demo():
    await connect_to_mongo()
    db = get_db()
    if db is None:
        print("MongoDB not available")
        return
    
    email = "demo@qxlabs.ai"
    user = await db.users.find_one({"email": email})
    pwd_hash = hash_password("quantum123")
    
    if not user:
        res = await db.users.insert_one({
            "email": email,
            "password_hash": pwd_hash,
            "full_name": "Quantum Explorer",
            "display_name": "Quantum Explorer",
            "role": "learner",
            "xp_total": 150
        })
        user_id = str(res.inserted_id)
        await db.users.update_one({"_id": res.inserted_id}, {"$set": {"firebase_uid": user_id}})
        print(f"Created demo user: {email} with ID: {user_id}")
    else:
        user_id = str(user["_id"])
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": pwd_hash, "firebase_uid": user_id}})
        print(f"Updated demo user: {email} with ID: {user_id}")
        
    token = create_jwt_token(user_id=user_id, email=email, name="Quantum Explorer")
    print(f"Minted JWT Token: {token[:25]}...")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_demo())
