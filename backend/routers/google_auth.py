from datetime import timedelta
import urllib.parse

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import create_access_token
from config import settings
from database import get_db
from models.user import User, UserRole

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google")
async def login_google():
    """Redirects to Google OAuth consent screen."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
async def callback_google(code: str, db: AsyncSession = Depends(get_db)):
    """Handles callback from Google, creates/updates user, sets JWT, redirects to frontend."""
    # 1. Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            },
            headers={"Accept": "application/json"}
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to retrieve token from Google")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No access token provided by Google")

        # 2. Get User Info
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to retrieve user info from Google")
        
        user_info = userinfo_response.json()
        email = user_info.get("email")
        google_id = user_info.get("id")
        picture_url = user_info.get("picture")

        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No email provided by Google")

    # 3. Create or update user
    result = await db.execute(select(User).where((User.email == email) | (User.google_id == google_id)))
    # For safety, link them if found via email
    users = result.scalars().all()
    user = next((u for u in users if u.google_id == google_id), None)
    
    if not user:
        user_by_email = next((u for u in users if u.email == email), None)
        if user_by_email:
            user_by_email.google_id = google_id
            if picture_url:
                user_by_email.picture_url = picture_url
            user = user_by_email
        else:
            user = User(
                email=email,
                role=UserRole.dispatcher,
                hashed_password=None,
                google_id=google_id,
                picture_url=picture_url
            )
            db.add(user)
    
    await db.commit()
    await db.refresh(user)

    # 4. Generate JWT
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(hours=settings.JWT_EXPIRE_HOURS),
    )
    
    # 5. Redirect and drop cookie
    redirect_res = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
    redirect_res.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=86400
    )
    
    return redirect_res
