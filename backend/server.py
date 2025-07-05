from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
import pymongo
import os
import hashlib
import jwt
import uuid
from bson import ObjectId

# Environment variables
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = 'HS256'

app = FastAPI(title="Daily Wellness API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
try:
    client = pymongo.MongoClient(MONGO_URL)
    db = client.wellness_db
    users_collection = db.users
    moods_collection = db.moods
    challenges_collection = db.challenges
    progress_collection = db.progress
    
    # Create indexes
    users_collection.create_index("username", unique=True)
    users_collection.create_index("email", unique=True)
    moods_collection.create_index([("user_id", 1), ("date", -1)])
    challenges_collection.create_index([("user_id", 1), ("challenge_id", 1)])
    progress_collection.create_index([("user_id", 1), ("challenge_id", 1)])
    
    print("✅ Connected to MongoDB successfully")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")

# Security
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class MoodEntry(BaseModel):
    mood: int
    date: str

class ChallengeStart(BaseModel):
    challengeId: int

class ChallengeComplete(BaseModel):
    challengeId: int

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: str

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    return hash_password(password) == hashed_password

def create_jwt_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user_id = verify_jwt_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

# API Routes
@app.get("/")
async def root():
    return {"message": "Daily Wellness API is running! 🌟"}

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    try:
        # Check if user already exists
        if users_collection.find_one({"username": user_data.username}):
            raise HTTPException(
                status_code=400,
                detail="Username already exists"
            )
        
        if users_collection.find_one({"email": user_data.email}):
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        user = {
            "_id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "password": hash_password(user_data.password),
            "created_at": datetime.utcnow().isoformat()
        }
        
        users_collection.insert_one(user)
        
        return {"message": "User created successfully", "user_id": user_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    try:
        # Find user
        user = users_collection.find_one({"username": user_data.username})
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )
        
        # Verify password
        if not verify_password(user_data.password, user["password"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )
        
        # Create JWT token
        token = create_jwt_token(user["_id"])
        
        return {
            "token": token,
            "user": {
                "id": user["_id"],
                "username": user["username"],
                "email": user["email"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "created_at": current_user["created_at"]
    }

@app.post("/api/mood/save")
async def save_mood(mood_data: MoodEntry, current_user: dict = Depends(get_current_user)):
    try:
        mood_entry = {
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "mood": mood_data.mood,
            "date": mood_data.date,
            "created_at": datetime.utcnow().isoformat()
        }
        
        moods_collection.insert_one(mood_entry)
        return {"message": "Mood saved successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save mood: {str(e)}")

@app.get("/api/mood/history")
async def get_mood_history(current_user: dict = Depends(get_current_user)):
    try:
        moods = list(moods_collection.find(
            {"user_id": current_user["_id"]},
            {"_id": 0, "user_id": 0}
        ).sort("date", -1).limit(30))
        
        return moods
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get mood history: {str(e)}")

@app.post("/api/challenge/start")
async def start_challenge(challenge_data: ChallengeStart, current_user: dict = Depends(get_current_user)):
    try:
        challenge_entry = {
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "challenge_id": challenge_data.challengeId,
            "started_at": datetime.utcnow().isoformat(),
            "status": "started"
        }
        
        challenges_collection.insert_one(challenge_entry)
        return {"message": "Challenge started successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start challenge: {str(e)}")

@app.post("/api/challenge/complete")
async def complete_challenge(challenge_data: ChallengeComplete, current_user: dict = Depends(get_current_user)):
    try:
        # Update challenge status
        result = challenges_collection.update_one(
            {
                "user_id": current_user["_id"],
                "challenge_id": challenge_data.challengeId,
                "status": "started"
            },
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Challenge not found or already completed")
        
        # Update progress
        progress_entry = {
            "_id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "challenge_id": challenge_data.challengeId,
            "completed_at": datetime.utcnow().isoformat(),
            "points": 10  # Award points for completion
        }
        
        progress_collection.insert_one(progress_entry)
        
        return {"message": "Challenge completed successfully", "points_earned": 10}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete challenge: {str(e)}")

@app.get("/api/progress")
async def get_user_progress(current_user: dict = Depends(get_current_user)):
    try:
        # Get completed challenges
        completed_challenges = list(progress_collection.find(
            {"user_id": current_user["_id"]},
            {"_id": 0, "user_id": 0}
        ).sort("completed_at", -1))
        
        # Calculate total points
        total_points = sum(challenge.get("points", 0) for challenge in completed_challenges)
        
        # Get current challenges
        current_challenges = list(challenges_collection.find(
            {"user_id": current_user["_id"], "status": "started"},
            {"_id": 0, "user_id": 0}
        ))
        
        return {
            "total_points": total_points,
            "completed_challenges": len(completed_challenges),
            "current_challenges": current_challenges,
            "recent_completions": completed_challenges[:5]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")

@app.get("/api/health")
async def health_check():
    try:
        # Test database connection
        client.admin.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/api/stats")
async def get_app_stats(current_user: dict = Depends(get_current_user)):
    try:
        # Get user's mood entries count
        mood_count = moods_collection.count_documents({"user_id": current_user["_id"]})
        
        # Get user's completed challenges count
        completed_count = progress_collection.count_documents({"user_id": current_user["_id"]})
        
        # Get user's current streak (consecutive days with mood entries)
        recent_moods = list(moods_collection.find(
            {"user_id": current_user["_id"]},
            {"date": 1}
        ).sort("date", -1).limit(30))
        
        streak = 0
        if recent_moods:
            # Calculate streak logic here
            dates = [datetime.fromisoformat(mood["date"]).date() for mood in recent_moods]
            current_date = datetime.now().date()
            
            for i, date in enumerate(dates):
                if date == current_date - timedelta(days=i):
                    streak += 1
                else:
                    break
        
        return {
            "mood_entries": mood_count,
            "completed_challenges": completed_count,
            "current_streak": streak,
            "member_since": current_user["created_at"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)