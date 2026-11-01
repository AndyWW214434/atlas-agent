"""Accounts for cloud mode, via Supabase Auth.

The browser never holds a token: sign-up and sign-in go through this server, which keeps the Supabase session in
two httpOnly cookies (access token and refresh token) and verifies the access token on every API request.
"""

import asyncio
import os
import time

import httpx
import jwt

from .store import supabase_url

URL = supabase_url()
PUBLISHABLE = (os.environ.get("SUPABASE_PUBLISHABLE_KEY") or "").strip()
ACCESS, REFRESH = "atlas_at", "atlas_rt"
_jwks = jwt.PyJWKClient(f"{URL}/auth/v1/.well-known/jwks.json", cache_keys=True, lifespan=3600) if URL else None
_checked: dict[str, tuple[dict, float]] = {}  # tokens verified by asking Supabase (legacy HS256 projects)


class AuthError(Exception):
    pass


async def _call(method: str, path: str, *, json=None, params=None, token: str | None = None) -> dict:
    headers = {"apikey": PUBLISHABLE}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.request(method, f"{URL}/auth/v1/{path}", json=json, params=params, headers=headers)
    try:
        data = r.json()
    except ValueError:
        data = {}
    if r.status_code >= 400:
        msg = data.get("msg") or data.get("error_description") or data.get("message") or "Sign-in failed."
        raise AuthError(msg)
    return data


async def sign_up(email: str, password: str, redirect_to: str) -> dict:
    return await _call("POST", "signup", json={"email": email, "password": password}, params={"redirect_to": redirect_to})


async def sign_in(email: str, password: str) -> dict:
    return await _call("POST", "token", json={"email": email, "password": password}, params={"grant_type": "password"})


async def refresh(refresh_token: str) -> dict:
    return await _call("POST", "token", json={"refresh_token": refresh_token}, params={"grant_type": "refresh_token"})


async def sign_out(access_token: str):
    try:
        await _call("POST", "logout", token=access_token)
    except (AuthError, httpx.HTTPError):
        pass


async def verify(token: str) -> dict | None:
    """The user ({id, email}) an access token belongs to, or None if it's invalid or expired."""
    if not token:
        return None
    try:
        alg = jwt.get_unverified_header(token).get("alg")
        if alg in ("ES256", "RS256", "EdDSA"):  # current Supabase projects: asymmetric keys, checked locally
            key = (await asyncio.to_thread(_jwks.get_signing_key_from_jwt, token)).key
            claims = jwt.decode(token, key, algorithms=[alg], audience="authenticated")
            return {"id": claims["sub"], "email": claims.get("email", "")}
        claims = jwt.decode(token, options={"verify_signature": False})  # legacy shared secret: ask Supabase
        if claims.get("exp", 0) < time.time():
            return None
        hit = _checked.get(token)
        if hit and hit[1] > time.time():
            return hit[0]
        data = await _call("GET", "user", token=token)
        user = {"id": data["id"], "email": data.get("email", "")}
        if len(_checked) > 5000:
            _checked.clear()
        _checked[token] = (user, min(claims["exp"], time.time() + 300))
        return user
    except (jwt.PyJWTError, AuthError, httpx.HTTPError, KeyError):
        return None


def set_cookies(response, session: dict, secure: bool):
    opts = {"httponly": True, "samesite": "lax", "secure": secure, "path": "/"}
    response.set_cookie(ACCESS, session["access_token"], max_age=int(session.get("expires_in") or 3600), **opts)
    response.set_cookie(REFRESH, session["refresh_token"], max_age=60 * 60 * 24 * 30, **opts)


def clear_cookies(response):
    response.delete_cookie(ACCESS, path="/")
    response.delete_cookie(REFRESH, path="/")


async def session_user(request) -> tuple[dict | None, dict | None]:
    """(user, refreshed session or None) for a request's cookies, refreshing an expired access token."""
    user = await verify(request.cookies.get(ACCESS, ""))
    if user:
        return user, None
    rt = request.cookies.get(REFRESH)
    if not rt:
        return None, None
    try:
        session = await refresh(rt)
    except (AuthError, httpx.HTTPError):
        return None, None
    user = await verify(session.get("access_token", ""))
    return (user, session) if user else (None, None)
