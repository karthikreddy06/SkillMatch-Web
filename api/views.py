import os
import requests
import datetime
import math
from django.conf import settings
from django.db.models import Q, Count
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Profiles, Jobs, Applications, Messages, SavedJobs, RecentlyViewed
from .serializers import (
    ProfileSerializer,
    JobSerializer,
    ApplicationSerializer,
    MessageSerializer,
    SavedJobSerializer,
    RecentlyViewedSerializer,
)
from .services.matcher import calculate_match_score
from .authentication import generate_dev_token

SUPABASE_URL = (getattr(settings, 'SUPABASE_URL', None) or 'https://yqdzwruwcgsigxmofftt.supabase.co').rstrip('/')
SUPABASE_KEY = getattr(settings, 'SUPABASE_ANON_KEY', None) or 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZHp3cnV3Y2dzaWd4bW9mZnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NzE2OTYsImV4cCI6MjA4NDI0NzY5Nn0.2U5GoONA3URwqmqeN3U9plWm6ajAtxmG4bKZxPK4NMI'


def build_job_serialization_context(request, jobs_qs):
    """
    Pre-fetch contextual maps (applicant counts, saved status, applied status)
    in bulk queries to avoid N+1 queries during job list serialization.
    """
    context = {'request': request}
    jobs_list = list(jobs_qs)
    job_ids = [job.id for job in jobs_list]
    if not job_ids:
        return context

    # 1. Bulk count applicants
    counts = dict(
        Applications.objects.filter(job_id__in=job_ids)
        .values('job_id')
        .annotate(total=Count('id'))
        .values_list('job_id', 'total')
    )
    context['applicant_counts'] = {str(k): v for k, v in counts.items()}

    # 2. Bulk query saved and applied job IDs for authenticated user
    if request and hasattr(request, 'user') and request.user and request.user.is_authenticated:
        user_id = request.user.id
        saved_set = set(
            str(jid) for jid in SavedJobs.objects.filter(user_id=user_id, job_id__in=job_ids)
            .values_list('job_id', flat=True)
        )
        applied_set = set(
            str(jid) for jid in Applications.objects.filter(applicant_id=user_id, job_id__in=job_ids)
            .values_list('job_id', flat=True)
        )
        context['saved_job_ids'] = saved_set
        context['applied_job_ids'] = applied_set

    return context


# =============================================================================
# HEALTH CHECK
# =============================================================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    Health check endpoint verifying connection to Supabase PostgreSQL database.
    """
    try:
        profile_count = Profiles.objects.count()
        job_count = Jobs.objects.count()
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'supabase_project': SUPABASE_URL,
            'stats': {
                'profiles': profile_count,
                'jobs': job_count
            }
        })
    except Exception as e:
        return Response({'status': 'unhealthy', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# AUTHENTICATION VIEWS
# =============================================================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def auth_login(request):
    """
    Authenticate user via Supabase Auth and return session + profile.
    """
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        res = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            json={'email': email, 'password': password},
            timeout=10
        )
        data = res.json()

        if res.status_code != 200:
            err_msg = data.get('error_description') or data.get('msg') or 'Login failed'
            if 'Email not confirmed' in err_msg:
                return Response({
                    'error': 'Email not confirmed. Please verify your email via the link sent to your inbox before signing in.',
                    'email_not_confirmed': True
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': err_msg}, status=res.status_code)

        user_id = data.get('user', {}).get('id')
        profile = Profiles.objects.filter(id=user_id).first()
        profile_data = ProfileSerializer(profile).data if profile else None

        return Response({
            'session': {
                'access_token': data.get('access_token'),
                'refresh_token': data.get('refresh_token'),
                'expires_in': data.get('expires_in'),
            },
            'user': data.get('user'),
            'profile': profile_data
        })
    except Exception as e:
        return Response({'error': f'Auth service error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def auth_register(request):
    """
    Register new user in Supabase Auth and initialize profile.
    Follows exact sequence:
    1. Validate input and verify email uniqueness
    2. Supabase Auth creates user
    3. Extract exact auth user UUID
    4. Create/update profiles row with that same UUID
    5. Preserve email-verification behavior and return proper response to frontend
    """
    email = (request.data.get('email') or '').strip()
    password = request.data.get('password') or ''
    role = (request.data.get('role') or 'seeker').lower()
    full_name = (request.data.get('full_name') or '').strip()
    company_name = (request.data.get('company_name') or '').strip()

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if role not in ['seeker', 'employer']:
        return Response({'error': 'Invalid role. Must be seeker or employer.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Prevent duplicate registrations that cause dummy UUID returns from GoTrue
    if Profiles.objects.filter(email__iexact=email).exists():
        return Response({'error': 'An account with this email already exists. Please sign in.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, confirmed_at FROM auth.users WHERE lower(email) = lower(%s) LIMIT 1;", [email])
            auth_user_row = cursor.fetchone()
            if auth_user_row and auth_user_row[1] is not None:
                return Response({'error': 'An account with this email already exists. Please sign in.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        pass

    try:
        user_metadata = {
            'role': role,
            'full_name': full_name or company_name,
        }
        # 2. Supabase Auth creates the user
        res = requests.post(
            f"{SUPABASE_URL}/auth/v1/signup",
            headers={
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'email': email,
                'password': password,
                'data': user_metadata,
                'options': {
                    'emailRedirectTo': getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                }
            },
            timeout=10
        )
        data = res.json()

        if res.status_code not in [200, 201]:
            err_msg = data.get('msg') or data.get('error_description') or data.get('message') or 'Registration failed'
            if res.status_code == 429 or 'rate limit' in err_msg.lower() or 'too many' in err_msg.lower():
                return Response({
                    'error': 'Too many verification emails were requested. Please wait and try again later.',
                    'rate_limited': True
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            return Response({'error': err_msg}, status=res.status_code)

        # Detect duplicate email if Supabase returned obfuscated response with empty identities
        identities = data.get('identities') if isinstance(data.get('identities'), list) else (
            data.get('user', {}).get('identities') if isinstance(data.get('user'), dict) else None
        )
        if identities is not None and len(identities) == 0:
            return Response({'error': 'An account with this email already exists. Please sign in.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Use the exact returned auth user UUID
        auth_user = data.get('user') if isinstance(data.get('user'), dict) else data
        auth_user_id = auth_user.get('id') if isinstance(auth_user, dict) else None

        if not auth_user_id:
            return Response({'error': 'Supabase auth did not return a valid user ID.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 4. Create/update profiles row with that same UUID
        # Note: The Supabase trigger handle_new_user may already have inserted (id, email, full_name, role)
        profile = Profiles.objects.filter(id=auth_user_id).first()
        if not profile:
            profile = Profiles.objects.create(
                id=auth_user_id,
                email=email,
                role=role,
                full_name=full_name or company_name,
                company_name=company_name if role == 'employer' else None
            )
        else:
            updated_fields = []
            if role == 'employer' and company_name and profile.company_name != company_name:
                profile.company_name = company_name
                updated_fields.append('company_name')
            if full_name and profile.full_name != full_name:
                profile.full_name = full_name
                updated_fields.append('full_name')
            if updated_fields:
                profile.save(update_fields=updated_fields)

        profile_data = ProfileSerializer(profile).data

        # 5. Preserve email-verification behavior
        session_data = data.get('session')
        access_token = data.get('access_token') or (session_data.get('access_token') if isinstance(session_data, dict) else None)

        if not access_token:
            # Email verification is required by Supabase Auth
            return Response({
                'success': True,
                'message': 'Account created. Please check your email to verify your account.',
                'email_verification_required': True,
                'session': None,
                'user': auth_user,
                'profile': profile_data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': True,
                'message': 'Registration successful!',
                'email_verification_required': False,
                'session': {
                    'access_token': access_token,
                    'refresh_token': data.get('refresh_token') or (session_data.get('refresh_token') if isinstance(session_data, dict) else None),
                },
                'user': auth_user,
                'profile': profile_data
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': f'Registration error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def auth_me(request):
    """
    Return current authenticated user profile derived strictly from JWT.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    serializer = ProfileSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
def auth_password(request):
    """Update the current user's Supabase Auth password."""
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    password = request.data.get('password', '')
    if not isinstance(password, str) or len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

    access_token = str(request.auth or '')
    if not access_token:
        return Response({'error': 'A valid session is required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        res = requests.put(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                'apikey': SUPABASE_KEY,
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            },
            json={'password': password},
            timeout=10,
        )
        if res.status_code not in [200, 201]:
            try:
                data = res.json()
                error = data.get('msg') or data.get('message') or data.get('error_description') or 'Password update failed'
            except Exception:
                error = 'Password update failed'
            return Response({'error': error}, status=res.status_code)
        return Response({'message': 'Password updated successfully'})
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def auth_demo_token(request):
    """
    Development endpoint (only active in DEBUG mode) to issue valid JWTs for existing test profiles.
    Disabled in production.
    """
    if not getattr(settings, 'DEBUG', False):
        return Response({'error': 'Demo auth is disabled in production'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)

    profile = Profiles.objects.filter(id=user_id).first()
    if not profile:
        return Response({'error': 'Demo profile not found'}, status=status.HTTP_404_NOT_FOUND)

    token = generate_dev_token(profile)
    return Response({
        'session': {
            'access_token': token,
            'expires_in': 86400 * 7,
        },
        'profile': ProfileSerializer(profile).data
    })


# =============================================================================
# PROFILES & STORAGE VIEWS
# =============================================================================

@api_view(['GET', 'PATCH'])
def profile_detail(request, pk):
    """
    Retrieve any profile (GET) or update own profile (PATCH).
    Enforces that users can only edit their own profile.
    """
    profile = Profiles.objects.filter(id=pk).first()
    if not profile:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        # Strict authorization check
        if str(request.user.id) != str(pk):
            return Response({'error': 'Forbidden: You can only edit your own profile'}, status=status.HTTP_403_FORBIDDEN)

        # Disallow tampering with primary key or role
        data = request.data.copy()
        data.pop('id', None)
        data.pop('role', None)

        serializer = ProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request):
    """
    Upload avatar image to Supabase storage bucket 'avatars'.
    Validates file size (max 2MB), extension, and content type.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    # Size check (2MB max)
    if file_obj.size > 2 * 1024 * 1024:
        return Response({'error': 'File size exceeds maximum limit of 2MB'}, status=status.HTTP_400_BAD_REQUEST)

    allowed_exts = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
    allowed_types = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}

    parts = file_obj.name.lower().split('.')
    ext = parts[-1] if len(parts) > 1 else ''

    if ext not in allowed_exts or any(bad in parts for bad in ['php', 'exe', 'html', 'svg', 'js', 'sh']):
        return Response({'error': 'Invalid file format. Allowed image formats: JPEG, PNG, WEBP, GIF'}, status=status.HTTP_400_BAD_REQUEST)

    content_type = file_obj.content_type or 'image/jpeg'
    if content_type not in allowed_types:
        return Response({'error': 'Invalid file content type. Allowed: JPEG, PNG, WEBP, GIF'}, status=status.HTTP_400_BAD_REQUEST)

    user_id = str(request.user.id)
    timestamp = int(datetime.datetime.now().timestamp() * 1000)
    filename = f"{user_id}/{timestamp}.{ext}"

    auth_header = request.headers.get('Authorization') or (f"Bearer {request.auth}" if getattr(request, 'auth', None) else f"Bearer {SUPABASE_KEY}")

    service_role_key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', '')
    if service_role_key:
        storage_auth = f"Bearer {service_role_key}"
        storage_apikey = service_role_key
    else:
        storage_auth = auth_header
        storage_apikey = SUPABASE_KEY

    try:
        res = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/avatars/{filename}",
            headers={
                'apikey': storage_apikey,
                'Authorization': storage_auth,
                'Content-Type': content_type,
                'x-upsert': 'true',
            },
            data=file_obj.read(),
            timeout=15
        )
        if res.status_code in [200, 201]:
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/avatars/{filename}"
            Profiles.objects.filter(id=user_id).update(avatar_url=public_url, updated_at=timezone.now())
            updated_profile = Profiles.objects.filter(id=user_id).first()
            profile_data = ProfileSerializer(updated_profile).data if updated_profile else None
            return Response({'avatar_url': public_url, 'profile': profile_data})

        err_msg = 'Storage upload failed'
        try:
            err_json = res.json()
            err_msg = err_json.get('message') or err_json.get('error') or err_msg
        except Exception:
            err_msg = res.text or err_msg
        if 'signature verification failed' in err_msg:
            err_msg += ' (Demo accounts use locally signed development tokens which cannot authenticate directly with remote Supabase Storage. Please sign in with a registered Supabase account)'
        return Response({'error': f'Storage upload failed: {err_msg}'}, status=res.status_code)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_resume(request):
    """
    Upload resume document to Supabase storage bucket 'resumes'.
    Validates file size (max 5MB), file extension (PDF, DOC, DOCX), and content type.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    # Size check (5MB max)
    if file_obj.size > 5 * 1024 * 1024:
        return Response({'error': 'File size exceeds maximum limit of 5MB'}, status=status.HTTP_400_BAD_REQUEST)

    allowed_exts = {'pdf', 'doc', 'docx'}
    parts = file_obj.name.lower().split('.')
    ext = parts[-1] if len(parts) > 1 else ''

    if ext not in allowed_exts or any(bad in parts for bad in ['exe', 'php', 'html', 'svg', 'js', 'sh', 'bat']):
        return Response({'error': 'Invalid file format. Allowed document formats: PDF, DOC, DOCX'}, status=status.HTTP_400_BAD_REQUEST)

    mime_map = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword'
    }
    content_type = mime_map.get(ext, file_obj.content_type or 'application/octet-stream')

    user_id = str(request.user.id)
    timestamp = int(datetime.datetime.now().timestamp() * 1000)
    filename = f"{user_id}/{timestamp}.{ext}"

    mime_map = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword'
    }
    content_type = mime_map.get(ext, file_obj.content_type or 'application/octet-stream')

    auth_header = request.headers.get('Authorization') or (f"Bearer {request.auth}" if getattr(request, 'auth', None) else f"Bearer {SUPABASE_KEY}")

    service_role_key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', '')
    if service_role_key:
        storage_auth = f"Bearer {service_role_key}"
        storage_apikey = service_role_key
    else:
        storage_auth = auth_header
        storage_apikey = SUPABASE_KEY

    try:
        res = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/resumes/{filename}",
            headers={
                'apikey': storage_apikey,
                'Authorization': storage_auth,
                'Content-Type': content_type,
                'x-upsert': 'true',
            },
            data=file_obj.read(),
            timeout=15
        )
        if res.status_code in [200, 201]:
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/resumes/{filename}"
            Profiles.objects.filter(id=user_id).update(resume_url=public_url, updated_at=timezone.now())
            updated_profile = Profiles.objects.filter(id=user_id).first()
            profile_data = ProfileSerializer(updated_profile).data if updated_profile else None
            return Response({
                'success': True,
                'resume_url': public_url,
                'filename': file_obj.name,
                'profile': profile_data
            })

        err_msg = 'Storage upload failed'
        try:
            err_json = res.json()
            err_msg = err_json.get('message') or err_json.get('error') or err_msg
        except Exception:
            err_msg = res.text or err_msg
        if 'signature verification failed' in err_msg:
            err_msg += ' (Demo accounts use locally signed development tokens which cannot authenticate directly with remote Supabase Storage. Please sign in with a registered Supabase account)'
        return Response({'error': f'Storage upload failed: {err_msg}', 'details': res.text}, status=res.status_code)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# JOBS & DISCOVERY VIEWS
# =============================================================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def job_list_create(request):
    """
    List jobs with server-side pagination & filtering, or create a new job opening (Employer only).
    """
    if request.method == 'GET':
        queryset = Jobs.objects.all().select_related('employer').order_by('-created_at')

        status_param = request.query_params.get('status')
        queryset = queryset.filter(status=status_param) if status_param else queryset.filter(status='active')

        employer_id = request.query_params.get('employer_id')
        if employer_id:
            queryset = queryset.filter(employer_id=employer_id)

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(company_name__icontains=search) |
                Q(location__icontains=search)
            )

        location = request.query_params.get('location', '').strip()
        if location:
            queryset = queryset.filter(location__icontains=location)

        job_type = request.query_params.get('job_type')
        if job_type:
            queryset = queryset.filter(job_type__iexact=job_type)

        shift = request.query_params.get('shift')
        if shift:
            queryset = queryset.filter(shift_preference__icontains=shift)

        flexible = request.query_params.get('flexible')
        if flexible and flexible.lower() == 'true':
            queryset = queryset.filter(is_flexible=True)

        # Server-side pagination
        try:
            page = max(int(request.query_params.get('page', 1)), 1)
        except ValueError:
            page = 1

        try:
            page_size = min(max(int(request.query_params.get('page_size', 20)), 1), 50)
        except ValueError:
            page_size = 20

        total_count = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        paged_jobs = list(queryset[start:end])

        context = build_job_serialization_context(request, paged_jobs)
        serializer = JobSerializer(paged_jobs, many=True, context=context)
        
        # Attach deterministic match score if authenticated candidate
        if request.user and request.user.is_authenticated and request.user.is_seeker:
            results = []
            for j_data in serializer.data:
                match_res = calculate_match_score(j_data, request.user)
                j_data['match_score'] = match_res['score']
                j_data['match'] = f"{match_res['score']}%"
                results.append(j_data)
        else:
            results = serializer.data

        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': math.ceil(total_count / page_size) if total_count > 0 else 1,
            'results': results
        })

    elif request.method == 'POST':
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        if not request.user.is_employer:
            return Response({'error': 'Forbidden: Only employers can post job requisitions'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        # Derive employer_id strictly from JWT
        data['employer'] = str(request.user.id)
        if not data.get('company_name'):
            data['company_name'] = request.user.company_name or request.user.full_name or 'Hiring Organization'

        serializer = JobSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            job = serializer.save()
            return Response(JobSerializer(job, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.AllowAny])
def job_detail(request, pk):
    """
    Retrieve job (GET) or update/delete job (PATCH/DELETE, Job Owner only).
    """
    job = Jobs.objects.filter(id=pk).select_related('employer').first()
    if not job:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        context = build_job_serialization_context(request, [job])
        job_data = JobSerializer(job, context=context).data
        if request.user and request.user.is_authenticated and request.user.is_seeker:
            match_res = calculate_match_score(job, request.user)
            job_data['match_score'] = match_res['score']
            job_data['match'] = f"{match_res['score']}%"
            job_data['match_breakdown'] = match_res['breakdown']
        return Response(job_data)

    elif request.method in ['PATCH', 'DELETE']:
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        # Ownership authorization check
        if str(job.employer_id) != str(request.user.id):
            return Response({'error': 'Forbidden: You can only modify your own job listings'}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'PATCH':
            data = request.data.copy()
            data.pop('employer', None)  # Prevent transferring ownership
            serializer = JobSerializer(job, data=data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            job.status = 'closed'
            job.save()
            return Response({'message': 'Job status set to closed'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def job_recommendations(request):
    """
    Deterministic AI Skill-Matching & Recommendation Feed.
    Ranks active jobs based on candidate profile skills, experience, and shift preferences.
    """
    profile = None
    if request.user and request.user.is_authenticated:
        profile = request.user
    else:
        # Check if user_id was requested for preview
        preview_user_id = request.query_params.get('user_id')
        if preview_user_id:
            profile = Profiles.objects.filter(id=preview_user_id).first()

    # Exclude jobs candidate already applied to
    applied_ids = set()
    if profile:
        applied_ids = set(Applications.objects.filter(applicant_id=profile.id).values_list('job_id', flat=True))

    radius_param = request.query_params.get('radius')
    all_india = request.query_params.get('all_india', '').lower() == 'true'
    try:
        radius_km = None if all_india else float(radius_param or getattr(profile, 'preferred_distance', None) or 25)
    except (TypeError, ValueError):
        radius_km = 25

    jobs = list(Jobs.objects.filter(status='active').exclude(id__in=applied_ids).select_related('employer'))
    context = build_job_serialization_context(request, jobs)

    scored_jobs = []
    for job in jobs:
        job_data = JobSerializer(job, context=context).data
        if profile:
            match_res = calculate_match_score(job, profile)
            distance_km = match_res['breakdown'].get('distance_km')
            has_coordinates = all(value is not None for value in [profile.latitude, profile.longitude, job.latitude, job.longitude])
            is_remote = 'remote' in (job.job_type or '').lower() or 'remote' in (job.location or '').lower()
            if radius_km is not None and not is_remote and (not has_coordinates or distance_km is None or distance_km > radius_km):
                continue
            job_data['match_score'] = match_res['score']
            job_data['match'] = f"{match_res['score']}%"
            job_data['match_breakdown'] = match_res['breakdown']
            job_data['distance_km'] = distance_km
        else:
            job_data['match_score'] = None
            job_data['match'] = None

        scored_jobs.append(job_data)

    scored_jobs.sort(key=lambda x: (x.get('match_score') is not None, x.get('match_score') or 0), reverse=True)
    return Response(scored_jobs)


# =============================================================================
# APPLICATIONS & ATS VIEWS
# =============================================================================

@api_view(['GET', 'POST'])
def application_list_create(request):
    """
    List candidate's own applications (GET) or submit an application (POST).
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        if not request.user.is_seeker:
            return Response({'error': 'Only candidates can view their application portfolio here'}, status=status.HTTP_403_FORBIDDEN)

        # Strictly filter by authenticated candidate ID
        apps = list(Applications.objects.filter(applicant_id=request.user.id).select_related('job', 'applicant', 'job__employer').order_by('-created_at'))
        job_objs = [app.job for app in apps if app.job]
        context = build_job_serialization_context(request, job_objs)
        serializer = ApplicationSerializer(apps, many=True, context=context)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_seeker:
            return Response({'error': 'Forbidden: Only job seekers can apply for jobs'}, status=status.HTTP_403_FORBIDDEN)

        job_id = request.data.get('job_id')
        cover_letter = request.data.get('cover_letter', '').strip()

        if not job_id:
            return Response({'error': 'job_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        job = Jobs.objects.filter(id=job_id).first()
        if not job:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

        if job.status != 'active':
            return Response({'error': 'This job opening is no longer accepting applications'}, status=status.HTTP_400_BAD_REQUEST)

        # Derive applicant identity exclusively from JWT
        applicant_id = request.user.id

        # Duplicate application prevention
        existing = Applications.objects.filter(job_id=job_id, applicant_id=applicant_id).first()
        if existing:
            return Response({
                'message': 'You have already applied to this opening',
                'application': ApplicationSerializer(existing).data
            }, status=status.HTTP_200_OK)

        # Calculate deterministic match score
        match_res = calculate_match_score(job, request.user)

        app = Applications.objects.create(
            job=job,
            applicant=request.user,
            user_id=applicant_id,  # Populate both applicant_id and user_id for legacy compatibility
            cover_letter=cover_letter,
            match_score=match_res['score'],
            status='pending',
            applied_at=timezone.now()
        )
        return Response(ApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def employer_applicants(request):
    """
    Get applicants for employer's jobs.
    Enforces that employers can only view candidates for their own posted jobs.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if not request.user.is_employer:
        return Response({'error': 'Forbidden: Employer privileges required'}, status=status.HTTP_403_FORBIDDEN)

    employer_id = request.user.id
    job_id = request.query_params.get('job_id')
    status_filter = request.query_params.get('status')

    apps_query = list(Applications.objects.filter(job__employer_id=employer_id).select_related('job', 'applicant', 'job__employer').order_by('-created_at'))

    if job_id:
        apps_query = [app for app in apps_query if str(app.job_id) == str(job_id)]
    if status_filter and status_filter != 'all':
        apps_query = [app for app in apps_query if app.status == status_filter]

    job_objs = [app.job for app in apps_query if app.job]
    context = build_job_serialization_context(request, job_objs)
    serializer = ApplicationSerializer(apps_query, many=True, context=context)
    return Response(serializer.data)


@api_view(['PATCH'])
def update_application_status(request, pk):
    """
    Update application status: 'pending', 'shortlisted', 'interview', 'rejected', 'offered'.
    Enforces that only the job's employer can update candidate status.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    app = Applications.objects.select_related('job').filter(id=pk).first()
    if not app:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

    # Ownership check
    if str(app.job.employer_id) != str(request.user.id):
        return Response({'error': 'Forbidden: You can only update candidates for your own jobs'}, status=status.HTTP_403_FORBIDDEN)

    new_status = request.data.get('status', '').lower().strip()
    valid_statuses = ['pending', 'shortlisted', 'interview', 'rejected', 'offered']
    if new_status not in valid_statuses:
        return Response({'error': f'Invalid status. Allowed values: {", ".join(valid_statuses)}'}, status=status.HTTP_400_BAD_REQUEST)

    app.status = new_status
    app.save()

    return Response(ApplicationSerializer(app).data)


@api_view(['POST'])
def schedule_interview(request, pk):
    """
    Schedule an interview: updates application status to 'interview' and posts a message.
    Enforces that only the employer who owns the job can schedule interviews.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    app = Applications.objects.select_related('job', 'applicant').filter(id=pk).first()
    if not app:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

    if str(app.job.employer_id) != str(request.user.id):
        return Response({'error': 'Forbidden: You can only schedule interviews for your own candidates'}, status=status.HTTP_403_FORBIDDEN)

    date = request.data.get('date', '').strip()
    time_str = request.data.get('time', '').strip()
    interview_type = request.data.get('type', 'Video Call').strip()
    notes = request.data.get('notes', '').strip()

    if not date or not time_str:
        return Response({'error': 'Date and time are required to schedule an interview'}, status=status.HTTP_400_BAD_REQUEST)

    app.status = 'interview'
    app.save()

    content = (
        f"📅 Interview Invitation: {interview_type} scheduled for {date} at {time_str}. "
        f"{('Instructions: ' + notes) if notes else ''}"
    )
    
    msg = Messages.objects.create(
        application=app,
        sender_id=request.user.id,
        content=content,
        created_at=timezone.now()
    )

    return Response({
        'application': ApplicationSerializer(app).data,
        'message': MessageSerializer(msg).data
    })


# =============================================================================
# MESSAGING & CHAT VIEWS
# =============================================================================

@api_view(['GET', 'POST'])
def application_messages(request, application_id):
    """
    Get or send messages for a job application.
    Enforces that only the applicant or the job's employer can access the conversation.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    app = Applications.objects.select_related('job').filter(id=application_id).first()
    if not app:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

    user_id = str(request.user.id)
    applicant_id = str(app.applicant_id)
    employer_id = str(app.job.employer_id)

    # Participant authorization check
    if user_id != applicant_id and user_id != employer_id:
        return Response({'error': 'Forbidden: You are not an authorized participant in this conversation'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        messages = Messages.objects.filter(application_id=application_id).order_by('created_at')
        # Mark counterparty messages as read
        Messages.objects.filter(application_id=application_id, read=False).exclude(sender_id=request.user.id).update(read=True)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message content cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Sender ID locked strictly to JWT
        msg = Messages.objects.create(
            application=app,
            sender_id=request.user.id,
            content=content,
            created_at=timezone.now()
        )
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def chat_inbox(request):
    """
    List conversation inbox for the authenticated user (Candidate or Employer).
    Optimized to fetch all inbox items in bulk queries.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    user_id = request.user.id
    is_employer = request.user.is_employer

    if is_employer:
        apps = list(Applications.objects.filter(job__employer_id=user_id).select_related('job', 'applicant', 'job__employer'))
    else:
        apps = list(Applications.objects.filter(applicant_id=user_id).select_related('job', 'applicant', 'job__employer'))

    if not apps:
        return Response([])

    app_ids = [app.id for app in apps]

    # Pre-fetch unread counts in 1 bulk query
    unread_counts = dict(
        Messages.objects.filter(application_id__in=app_ids, read=False)
        .exclude(sender_id=user_id)
        .values('application_id')
        .annotate(total=Count('id'))
        .values_list('application_id', 'total')
    )

    # Pre-fetch latest message for each application in 1 bulk query
    latest_messages = {}
    msgs = Messages.objects.filter(application_id__in=app_ids).order_by('application_id', '-created_at')
    for msg in msgs:
        app_str = str(msg.application_id)
        if app_str not in latest_messages:
            latest_messages[app_str] = msg

    inbox = []
    for app in apps:
        app_id_str = str(app.id)
        last_msg = latest_messages.get(app_id_str)
        unread_count = unread_counts.get(app.id, 0)

        other_party = app.applicant if is_employer else app.job.employer
        contact_name = 'User'
        contact_avatar = None
        if other_party:
            contact_name = other_party.full_name or other_party.company_name or other_party.email or 'User'
            contact_avatar = other_party.avatar_url

        inbox.append({
            'application_id': app.id,
            'job_id': app.job.id,
            'job_title': app.job.title,
            'company_name': app.job.company_name,
            'status': app.status,
            'contact_name': contact_name,
            'contact_avatar': contact_avatar,
            'contact_id': other_party.id if other_party else None,
            'last_message': last_msg.content if last_msg else 'No messages yet',
            'last_message_time': last_msg.created_at if last_msg else app.created_at,
            'unread_count': unread_count
        })

    inbox.sort(key=lambda x: str(x['last_message_time']), reverse=True)
    return Response(inbox)


@api_view(['GET'])
def unread_message_count(request):
    """Return the current user's unread inbound message count."""
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    user_id = request.user.id
    if request.user.is_employer:
        conversation_ids = Applications.objects.filter(job__employer_id=user_id).values_list('id', flat=True)
    else:
        conversation_ids = Applications.objects.filter(applicant_id=user_id).values_list('id', flat=True)

    count = Messages.objects.filter(
        application_id__in=conversation_ids,
        read=False,
    ).exclude(sender_id=user_id).count()
    return Response({'unread_count': count})


# =============================================================================
# INTERACTIONS (SAVED JOBS & RECENTLY VIEWED)
# =============================================================================

@api_view(['POST', 'DELETE'])
def toggle_save_job(request, job_id):
    """
    Bookmark or remove bookmark for a job. Locked strictly to authenticated user.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    job = Jobs.objects.filter(id=job_id).first()
    if not job:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        saved, created = SavedJobs.objects.get_or_create(user=request.user, job=job)
        return Response({
            'saved': True,
            'id': str(saved.id),
            'job_id': str(job.id)
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    elif request.method == 'DELETE':
        SavedJobs.objects.filter(user=request.user, job=job).delete()
        return Response({
            'saved': False,
            'job_id': str(job.id)
        })


@api_view(['GET'])
def list_saved_jobs(request):
    """
    List bookmarked jobs for authenticated user with complete job details and AI match score.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    saved = list(SavedJobs.objects.filter(user=request.user).select_related('job', 'job__employer'))
    job_objs = [item.job for item in saved if item.job]
    context = build_job_serialization_context(request, job_objs)

    results = []
    for item in saved:
        item_data = SavedJobSerializer(item, context=context).data
        if item.job and request.user.is_seeker:
            match_res = calculate_match_score(item.job, request.user)
            distance_km = match_res['breakdown'].get('distance_km')
            if isinstance(item_data.get('job'), dict):
                item_data['job']['match_score'] = match_res['score']
                item_data['job']['match'] = f"{match_res['score']}%"
                item_data['job']['match_breakdown'] = match_res['breakdown']
                item_data['job']['distance_km'] = distance_km
        results.append(item_data)
    return Response(results)


@api_view(['POST'])
def record_job_view(request, job_id):
    """
    Record job viewing history for authenticated user.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    job = Jobs.objects.filter(id=job_id).first()
    if not job:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    RecentlyViewed.objects.update_or_create(
        user_id=request.user.id,
        job=job,
        defaults={'viewed_at': timezone.now()}
    )
    return Response({'recorded': True})


@api_view(['GET'])
def list_recently_viewed(request):
    """
    List recently viewed jobs for authenticated user.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    recent = RecentlyViewed.objects.filter(user_id=request.user.id).select_related('job')[:20]
    serializer = RecentlyViewedSerializer(recent, many=True, context={'request': request})
    return Response(serializer.data)


# =============================================================================
# EMPLOYER DASHBOARD ANALYTICS
# =============================================================================

@api_view(['GET'])
def employer_dashboard_stats(request):
    """
    Aggregate metrics for employer dashboard. Locked strictly to authenticated employer.
    Optimized to compute statistics in bulk queries.
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if not request.user.is_employer:
        return Response({'error': 'Forbidden: Employer privileges required'}, status=status.HTTP_403_FORBIDDEN)

    employer_id = request.user.id
    employer_jobs = list(
        Jobs.objects.filter(employer_id=employer_id).annotate(total_applicants_count=Count('applications'))
    )
    active_jobs_count = sum(1 for j in employer_jobs if j.status == 'active')

    job_ids = [j.id for j in employer_jobs]
    total_applicants = sum(getattr(j, 'total_applicants_count', 0) for j in employer_jobs)

    one_day_ago = timezone.now() - datetime.timedelta(days=1)
    new_today = Applications.objects.filter(job_id__in=job_ids, created_at__gte=one_day_ago).count() if job_ids else 0
    shortlisted_count = Applications.objects.filter(job_id__in=job_ids, status='shortlisted').count() if job_ids else 0
    interview_count = Applications.objects.filter(job_id__in=job_ids, status='interview').count() if job_ids else 0

    new_today_per_job = dict(
        Applications.objects.filter(job_id__in=job_ids, created_at__gte=one_day_ago)
        .values('job_id')
        .annotate(total=Count('id'))
        .values_list('job_id', 'total')
    ) if job_ids else {}

    jobs_summary = []
    for job in employer_jobs:
        jobs_summary.append({
            'id': job.id,
            'title': job.title,
            'status': job.status,
            'created_at': job.created_at,
            'location': job.location,
            'salary_range': job.salary_range,
            'applicants_count': getattr(job, 'total_applicants_count', 0),
            'new_today_count': new_today_per_job.get(job.id, 0),
        })

    return Response({
        'stats': {
            'active_jobs': active_jobs_count,
            'total_applicants': total_applicants,
            'new_today': new_today,
            'shortlisted': shortlisted_count,
            'interview': interview_count
        },
        'jobs': jobs_summary
    })
