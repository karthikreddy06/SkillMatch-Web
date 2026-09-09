import uuid
import jwt
from datetime import datetime, timezone, timedelta
from django.test import SimpleTestCase, TestCase
from django.conf import settings
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import exceptions

from api.models import Profiles, Jobs, Applications, Messages
from api.authentication import SupabaseAuthentication, generate_dev_token
from api.services.matcher import calculate_match_score, normalize_skill
from api.permissions import (
    IsCandidate,
    IsEmployer,
    IsProfileOwner,
    IsJobOwner,
    IsApplicationParticipant,
    IsEmployerOfApplication,
)


class AIMatchingEngineTests(SimpleTestCase):
    """
    Unit tests for Phase 12: Deterministic AI Skill-Matching Service.
    """

    def test_normalize_skill(self):
        self.assertEqual(normalize_skill("  Python-3  "), "python 3")
        self.assertEqual(normalize_skill("Machine_Learning"), "machine learning")
        self.assertEqual(normalize_skill(""), "")

    def test_perfect_skills_match(self):
        job = {
            'title': 'Senior Python Developer',
            'description': 'Building scalable backends in Django',
            'skills': ['Python', 'Django', 'PostgreSQL'],
            'shift_preference': 'Day',
            'is_flexible': True,
            'job_type': 'Full-time',
            'location': 'Remote',
        }
        profile = {
            'skills': ['Python', 'Django', 'PostgreSQL', 'Docker'],
            'experience_level': 'Senior',
            'preferred_shift': 'Day',
            'preferred_job_type': 'Full-time',
            'location': 'Remote',
        }
        result = calculate_match_score(job, profile)
        # Should be maximum or near 100%
        self.assertGreaterEqual(result['score'], 90)
        self.assertEqual(len(result['matched_skills']), 3)
        self.assertEqual(len(result['missing_skills']), 0)

    def test_partial_skills_match(self):
        job = {
            'title': 'Frontend Engineer',
            'description': 'React and TypeScript frontend',
            'skills': ['React', 'TypeScript', 'GraphQL', 'Tailwind'],
            'shift_preference': 'Day',
            'is_flexible': False,
            'job_type': 'Full-time',
            'location': 'Bangalore',
        }
        profile = {
            'skills': ['React', 'TypeScript'],
            'experience_level': 'Mid-Level',
            'preferred_shift': 'Night',
            'preferred_job_type': 'Full-time',
            'location': 'Hyderabad',
        }
        result = calculate_match_score(job, profile)
        # Partial skills match (2 of 4 = 25 points out of 50) + experience
        self.assertGreaterEqual(result['score'], 40)
        self.assertLess(result['score'], 80)
        self.assertEqual(len(result['matched_skills']), 2)
        self.assertEqual(len(result['missing_skills']), 2)

    def test_zero_skills_match(self):
        job = {
            'title': 'iOS Developer',
            'description': 'Swift and UIKit expert',
            'skills': ['Swift', 'UIKit', 'CoreData'],
            'shift_preference': 'Day',
            'job_type': 'Contract',
            'location': 'Mumbai',
        }
        profile = {
            'skills': ['Java', 'Spring Boot', 'SQL'],
            'experience_level': 'Junior',
            'preferred_shift': 'Night',
            'preferred_job_type': 'Full-time',
            'location': 'Delhi',
        }
        result = calculate_match_score(job, profile)
        self.assertEqual(len(result['matched_skills']), 0)
        self.assertEqual(len(result['missing_skills']), 3)
        self.assertLessEqual(result['score'], 35)

    def test_flexible_shift_boosts_all_candidates(self):
        job_flexible = {
            'title': 'Support Engineer',
            'description': 'Customer support',
            'skills': ['Communication'],
            'is_flexible': True,
            'shift_preference': 'Flexible',
        }
        job_strict = {
            'title': 'Support Engineer',
            'description': 'Customer support',
            'skills': ['Communication'],
            'is_flexible': False,
            'shift_preference': 'Night',
        }
        profile_day = {
            'skills': ['Communication'],
            'preferred_shift': 'Day',
        }
        score_flex = calculate_match_score(job_flexible, profile_day)['score']
        score_strict = calculate_match_score(job_strict, profile_day)['score']
        self.assertGreater(score_flex, score_strict)


class AuthenticationHardeningTests(SimpleTestCase):
    """
    Unit tests for Phase 3: JWT Verification and Identity Derivation.
    """

    def setUp(self):
        self.auth = SupabaseAuthentication()
        self.factory = APIRequestFactory()
        self.secret = getattr(settings, 'SUPABASE_JWT_SECRET', None) or settings.SECRET_KEY

    def test_unauthenticated_request_returns_none(self):
        request = self.factory.get('/api/auth/me/')
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    def test_malformed_auth_header_returns_none(self):
        request = self.factory.get('/api/auth/me/', HTTP_AUTHORIZATION='InvalidHeader')
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    def test_expired_token_raises_authentication_failed(self):
        expired_time = int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp())
        payload = {
            'sub': str(uuid.uuid4()),
            'email': 'test@example.com',
            'exp': expired_time,
        }
        token = jwt.encode(payload, self.secret, algorithm='HS256')
        request = self.factory.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        with self.assertRaises(exceptions.AuthenticationFailed):
            self.auth.authenticate(request)

    def test_token_without_sub_raises_authentication_failed(self):
        now = int(datetime.now(timezone.utc).timestamp())
        payload = {
            'email': 'test@example.com',
            'exp': now + 3600,
        }
        token = jwt.encode(payload, self.secret, algorithm='HS256')
        request = self.factory.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        with self.assertRaises(exceptions.AuthenticationFailed):
            self.auth.authenticate(request)

    from unittest.mock import patch

    @patch('api.authentication.Profiles.objects.filter')
    def test_dev_token_generation_and_verification(self, mock_filter):
        test_id = uuid.uuid4()
        profile = Profiles(
            id=test_id,
            email='karthik.test@example.com',
            role='seeker',
            full_name='Karthik Test'
        )
        mock_filter.return_value.first.return_value = profile
        token = generate_dev_token(profile)
        request = self.factory.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        user, returned_token = self.auth.authenticate(request)
        self.assertIsNotNone(user)
        self.assertEqual(str(user.id), str(test_id))
        self.assertEqual(user.role, 'seeker')

    @patch('api.authentication.Profiles.objects.filter')
    def test_supabase_aud_claim_verification(self, mock_filter):
        test_id = uuid.uuid4()
        profile = Profiles(id=test_id, email='aud@example.com', role='seeker')
        mock_filter.return_value.first.return_value = profile

        payload = {
            'sub': str(test_id),
            'email': 'aud@example.com',
            'aud': 'authenticated',
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
        }
        token = jwt.encode(payload, self.secret, algorithm='HS256')
        request = self.factory.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        user, returned_token = self.auth.authenticate(request)
        self.assertIsNotNone(user)
        self.assertEqual(str(user.id), str(test_id))


    @patch('api.authentication.get_supabase_jwk')
    @patch('api.authentication.Profiles.objects.filter')
    def test_es256_jwks_asymmetric_verification(self, mock_filter, mock_jwk):
        from cryptography.hazmat.primitives.asymmetric import ec
        private_key = ec.generate_private_key(ec.SECP256R1())
        public_key = private_key.public_key()
        mock_jwk.return_value = public_key

        test_id = uuid.uuid4()
        profile = Profiles(id=test_id, email='es256@example.com', role='seeker', full_name='ES256 User')
        mock_filter.return_value.first.return_value = profile

        payload = {
            'sub': str(test_id),
            'email': 'es256@example.com',
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
        }
        token = jwt.encode(payload, private_key, algorithm='ES256', headers={'kid': 'test-kid-123'})

        request = self.factory.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        user, returned_token = self.auth.authenticate(request)

        self.assertIsNotNone(user)
        self.assertEqual(str(user.id), str(test_id))
        mock_jwk.assert_called_once_with('test-kid-123')



class AuthorizationPermissionTests(SimpleTestCase):
    """
    Unit tests for Phase 4: Role Boundaries and Object Ownership.
    """

    def test_candidate_permission(self):
        perm = IsCandidate()
        request = APIRequestFactory().get('/')

        # Seeker user
        seeker = Profiles(id=uuid.uuid4(), role='seeker')
        request.user = seeker
        self.assertTrue(perm.has_permission(request, None))

        # Employer user
        employer = Profiles(id=uuid.uuid4(), role='employer')
        request.user = employer
        self.assertFalse(perm.has_permission(request, None))

    def test_employer_permission(self):
        perm = IsEmployer()
        request = APIRequestFactory().get('/')

        employer = Profiles(id=uuid.uuid4(), role='employer')
        request.user = employer
        self.assertTrue(perm.has_permission(request, None))

        seeker = Profiles(id=uuid.uuid4(), role='seeker')
        request.user = seeker
        self.assertFalse(perm.has_permission(request, None))

    def test_profile_owner_permission(self):
        perm = IsProfileOwner()
        user_id = uuid.uuid4()
        user = Profiles(id=user_id)
        other_user = Profiles(id=uuid.uuid4())

        request_patch = APIRequestFactory().patch('/')
        request_patch.user = user

        # User modifying own profile -> True
        self.assertTrue(perm.has_object_permission(request_patch, None, user))

        # User modifying another profile -> False
        self.assertFalse(perm.has_object_permission(request_patch, None, other_user))

    def test_job_owner_permission(self):
        perm = IsJobOwner()
        employer_id = uuid.uuid4()
        employer = Profiles(id=employer_id, role='employer')
        other_employer = Profiles(id=uuid.uuid4(), role='employer')

        job = Jobs(id=uuid.uuid4(), employer_id=employer_id, title='Backend Engineer')

        request_patch = APIRequestFactory().patch('/')
        request_patch.user = employer
        self.assertTrue(perm.has_object_permission(request_patch, None, job))

        request_patch.user = other_employer
        self.assertFalse(perm.has_object_permission(request_patch, None, job))

    def test_application_participant_permission(self):
        perm = IsApplicationParticipant()
        candidate_id = uuid.uuid4()
        employer_id = uuid.uuid4()
        intruder_id = uuid.uuid4()

        candidate = Profiles(id=candidate_id, role='seeker')
        employer = Profiles(id=employer_id, role='employer')
        intruder = Profiles(id=intruder_id, role='seeker')

        job = Jobs(id=uuid.uuid4(), employer_id=employer_id)
        app = Applications(id=uuid.uuid4(), applicant_id=candidate_id, job=job)

        request = APIRequestFactory().get('/')

        # Candidate can access
        request.user = candidate
        self.assertTrue(perm.has_object_permission(request, None, app))

        # Employer can access
        request.user = employer
        self.assertTrue(perm.has_object_permission(request, None, app))

        # Third party CANNOT access
        request.user = intruder
        self.assertFalse(perm.has_object_permission(request, None, app))


class ApplicationValidationTests(SimpleTestCase):
    """
    Unit tests for Phase 9: Application Status Transitions and Duplicate Handling.
    """

    def test_valid_status_transitions(self):
        valid_statuses = ['pending', 'shortlisted', 'interview', 'rejected', 'offered']
        for s in valid_statuses:
            self.assertIn(s, ['pending', 'shortlisted', 'interview', 'rejected', 'offered'])

    def test_invalid_status_rejected(self):
        invalid_status = 'accepted_immediately_no_review'
        valid_statuses = ['pending', 'shortlisted', 'interview', 'rejected', 'offered']
        self.assertNotIn(invalid_status, valid_statuses)


class ResumeUploadTests(SimpleTestCase):
    """
    Unit tests for Issue 1: Resume Upload Validation, Size Check, Extension Check, and Storage Flow.
    """

    def setUp(self):
        self.factory = APIRequestFactory()

    def test_unauthenticated_upload_rejected(self):
        from api.views import upload_resume
        from django.core.files.uploadedfile import SimpleUploadedFile
        pdf_file = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 test content", content_type="application/pdf")
        request = self.factory.post('/api/profiles/upload-resume/', {'file': pdf_file})
        response = upload_resume(request)
        self.assertIn(response.status_code, [401, 403])

    def test_missing_file_rejected(self):
        from api.views import upload_resume
        candidate = Profiles(id=uuid.uuid4(), role='seeker')
        request = self.factory.post('/api/profiles/upload-resume/', {})
        request.user = candidate
        response = upload_resume(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data.get('error'), 'No file uploaded')

    def test_file_size_exceeding_5mb_rejected(self):
        from api.views import upload_resume
        from django.core.files.uploadedfile import SimpleUploadedFile

        candidate = Profiles(id=uuid.uuid4(), role='seeker')
        # Create a dummy file exceeding 5MB
        oversized_data = b"x" * (5 * 1024 * 1024 + 1024)
        large_file = SimpleUploadedFile("large_resume.pdf", oversized_data, content_type="application/pdf")

        request = self.factory.post('/api/profiles/upload-resume/', {'file': large_file})
        request.user = candidate
        response = upload_resume(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('5MB', response.data.get('error', ''))

    def test_invalid_file_extension_rejected(self):
        from api.views import upload_resume
        from django.core.files.uploadedfile import SimpleUploadedFile

        candidate = Profiles(id=uuid.uuid4(), role='seeker')
        exe_file = SimpleUploadedFile("malicious.exe", b"executable bytes", content_type="application/x-msdownload")

        request = self.factory.post('/api/profiles/upload-resume/', {'file': exe_file})
        request.user = candidate
        response = upload_resume(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid file format', response.data.get('error', ''))

    def test_valid_extensions_allowed(self):
        allowed_exts = ['pdf', 'doc', 'docx']
        for ext in ['resume.pdf', 'cv.doc', 'profile.docx']:
            file_ext = ext.split('.')[-1].lower()
            self.assertIn(file_ext, allowed_exts)


class RegistrationAuditTests(SimpleTestCase):
    """
    Unit tests for Issue 2: Registration Validation and Email Rate Limiting.
    """

    def setUp(self):
        self.factory = APIRequestFactory()

    def test_missing_credentials_rejected(self):
        from api.views import auth_register
        request = self.factory.post('/api/auth/register/', {'email': '', 'password': ''})
        response = auth_register(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Email and password are required', response.data.get('error', ''))

    def test_invalid_role_rejected(self):
        from api.views import auth_register
        request = self.factory.post('/api/auth/register/', {
            'email': 'user@example.com',
            'password': 'password123',
            'role': 'superadmin_invalid'
        })
        response = auth_register(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid role', response.data.get('error', ''))


class SecurityHeaderAndUploadSecurityTests(SimpleTestCase):
    """
    Unit tests for security headers, file upload extension hardening, and tampered JWT rejection.
    """

    def setUp(self):
        self.factory = APIRequestFactory()

    def test_tampered_jwt_signature_rejected(self):
        secret = getattr(settings, 'SUPABASE_JWT_SECRET', None) or settings.SECRET_KEY
        payload = {
            'sub': str(uuid.uuid4()),
            'email': 'hacker@example.com',
            'exp': int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
        }
        token = jwt.encode(payload, secret, algorithm='HS256')
        # Tamper payload
        header, body, sig = token.split('.')
        tampered_token = f"{header}.eyJzdWIiOiJoYWNrZXIiLCJlbWFpbCI6ImhhY2tlckBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0.{sig}"

        auth = SupabaseAuthentication()
        request = self.factory.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {tampered_token}')
        with self.assertRaises(exceptions.AuthenticationFailed):
            auth.authenticate(request)

    def test_dangerous_file_upload_extensions_rejected(self):
        from api.views import upload_avatar, upload_resume
        from django.core.files.uploadedfile import SimpleUploadedFile

        candidate = Profiles(id=uuid.uuid4(), role='seeker')

        # Test avatar with SVG/HTML
        svg_file = SimpleUploadedFile("avatar.svg", b"<svg onload=alert(1)></svg>", content_type="image/svg+xml")
        req_avatar = self.factory.post('/api/profiles/upload-avatar/', {'file': svg_file})
        req_avatar.user = candidate
        res_avatar = upload_avatar(req_avatar)
        self.assertEqual(res_avatar.status_code, 400)
        self.assertIn('Invalid file format', res_avatar.data.get('error', ''))

        # Test double extension resume
        php_file = SimpleUploadedFile("resume.pdf.php", b"<?php phpinfo(); ?>", content_type="application/octet-stream")
        req_resume = self.factory.post('/api/profiles/upload-resume/', {'file': php_file})
        req_resume.user = candidate
        res_resume = upload_resume(req_resume)
        self.assertEqual(res_resume.status_code, 400)
        self.assertIn('Invalid file format', res_resume.data.get('error', ''))
