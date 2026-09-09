import time
import requests
import jwt
from datetime import datetime, timezone
from django.conf import settings
from rest_framework import authentication, exceptions
from jwt import PyJWKSet
from .models import Profiles

SUPABASE_URL = getattr(settings, 'SUPABASE_URL', 'https://yqdzwruwcgsigxmofftt.supabase.co').rstrip('/')
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

_JWKS_CACHE = {"jwks": None, "fetched_at": 0}
_CACHE_TTL = 3600  # 1 hour TTL for JWKS public key set


def get_supabase_jwk(kid: str):
    """Fetch and cache Supabase JWKS public keys, finding the JWK matching the given key ID (kid)."""
    now = time.time()
    jwk_set = _JWKS_CACHE["jwks"]

    if not jwk_set or (now - _JWKS_CACHE["fetched_at"] > _CACHE_TTL):
        try:
            res = requests.get(JWKS_URL, timeout=5)
            if res.status_code == 200:
                jwk_set = PyJWKSet.from_dict(res.json())
                _JWKS_CACHE["jwks"] = jwk_set
                _JWKS_CACHE["fetched_at"] = now
        except Exception as e:
            if not jwk_set:
                raise exceptions.AuthenticationFailed(f'Could not fetch Supabase JWKS public key: {str(e)}')

    if jwk_set and jwk_set.keys:
        for jwk in jwk_set.keys:
            if jwk.key_id == kid:
                return jwk.key

    # If kid not found in cached JWKS, force refresh once
    try:
        res = requests.get(JWKS_URL, timeout=5)
        if res.status_code == 200:
            jwk_set = PyJWKSet.from_dict(res.json())
            _JWKS_CACHE["jwks"] = jwk_set
            _JWKS_CACHE["fetched_at"] = now
            for jwk in jwk_set.keys:
                if jwk.key_id == kid:
                    return jwk.key
    except Exception:
        pass

    return None


class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Cryptographic Supabase JWT Authentication.
    Supports asymmetric signing (ES256/RS256 via JWKS) and legacy symmetric signing (HS256).
    Derives user identity exclusively from verified JWT bearer tokens.
    Never trusts request headers or query parameters for identity.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]

        try:
            unverified_header = jwt.get_unverified_header(token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Invalid JWT header: {str(e)}')

        alg = unverified_header.get('alg', 'HS256')
        kid = unverified_header.get('kid')

        try:
            if alg in ['ES256', 'RS256']:
                if not kid:
                    raise exceptions.AuthenticationFailed('Asymmetric JWT missing key ID (kid)')
                public_key = get_supabase_jwk(kid)
                if not public_key:
                    raise exceptions.AuthenticationFailed(f'No matching JWK public key found for kid: {kid}')

                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=[alg],
                    audience=['authenticated', 'anon'],
                    options={"verify_exp": True, "verify_signature": True, "verify_aud": False}
                )

            elif alg in ['HS256', 'HS384', 'HS512']:
                jwt_secret = getattr(settings, 'SUPABASE_JWT_SECRET', '') or getattr(settings, 'SECRET_KEY', '') or ''

                if not jwt_secret:
                    raise exceptions.AuthenticationFailed('SUPABASE_JWT_SECRET is not configured')

                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=[alg],
                    audience=['authenticated', 'anon'],
                    options={"verify_exp": True, "verify_signature": True, "verify_aud": False}
                )

            else:
                raise exceptions.AuthenticationFailed(f'Unsupported JWT algorithm: {alg}')

            # Validate expiration explicitly
            exp = payload.get('exp')
            if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
                raise exceptions.AuthenticationFailed('Token has expired')

            # Extract subject (Supabase user UUID)
            user_id = payload.get('sub')
            if not user_id:
                raise exceptions.AuthenticationFailed('Invalid token: missing subject (sub)')

            # Fetch matching profile from database
            profile = Profiles.objects.filter(id=user_id).first()
            if not profile:
                email = payload.get('email', '')
                user_metadata = payload.get('user_metadata', {})
                role = user_metadata.get('role', 'seeker')
                full_name = user_metadata.get('full_name', '')
                profile = Profiles(id=user_id, email=email, role=role, full_name=full_name)

            return (profile, token)

        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            raise exceptions.AuthenticationFailed(f'Invalid JWT token: {str(e)}')
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Authentication error: {str(e)}')


def generate_dev_token(profile: Profiles) -> str:
    """
    Generates a valid signed JWT for a profile (available only in DEBUG mode for test accounts).
    """
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(profile.id),
        'email': profile.email or '',
        'role': 'authenticated',
        'user_metadata': {
            'role': profile.role,
            'full_name': profile.full_name or profile.company_name or '',
        },
        'iat': int(now.timestamp()),
        'exp': int(now.timestamp()) + (86400 * 7),  # 7 days
        'iss': 'skillmatch-auth',
    }
    secret = getattr(settings, 'SUPABASE_JWT_SECRET', '') or getattr(settings, 'SECRET_KEY', 'default-dev-secret')
    return jwt.encode(payload, secret, algorithm='HS256')
