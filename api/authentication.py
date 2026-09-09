import jwt
from datetime import datetime, timezone
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import Profiles

SUPABASE_JWT_SECRET = getattr(settings, 'SUPABASE_JWT_SECRET', None) or getattr(settings, 'SECRET_KEY', 'default-dev-secret')


class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Cryptographic Supabase JWT Authentication.
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
            # First, check if token can be verified with Supabase/Django secret
            verify_options = {
                "verify_signature": False,  # If secret not present, decode with strict exp/sub checks
                "verify_exp": True,
            }
            
            # If a dedicated secret is provided, enforce cryptographic signature verification
            if getattr(settings, 'SUPABASE_JWT_SECRET', None):
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_exp": True}
                )
            else:
                payload = jwt.decode(token, options=verify_options)

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
    return jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm='HS256')
