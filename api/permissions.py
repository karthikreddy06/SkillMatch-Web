"""
Custom DRF Permissions for SkillMatch.
Enforces strict role boundaries and object-level ownership.
"""

from rest_framework import permissions


class IsAuthenticatedUser(permissions.BasePermission):
    """Allows access only to authenticated users derived from verified JWT."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsCandidate(permissions.BasePermission):
    """Allows access only to authenticated job seekers."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_seeker', False)
        )


class IsEmployer(permissions.BasePermission):
    """Allows access only to authenticated employers."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_employer', False)
        )


class IsProfileOwner(permissions.BasePermission):
    """Object-level permission allowing users to edit only their own profile."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and str(obj.id) == str(request.user.id))


class IsJobOwner(permissions.BasePermission):
    """Object-level permission allowing only the employer who created the job to modify/delete it."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and str(obj.employer_id) == str(request.user.id)
        )


class IsApplicationParticipant(permissions.BasePermission):
    """
    Object-level permission ensuring only the applicant or the job's employer
    can view or interact with an application or its messages.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        user_id = str(request.user.id)
        applicant_id = str(getattr(obj, 'applicant_id', None))
        employer_id = str(getattr(getattr(obj, 'job', None), 'employer_id', None))
        return user_id == applicant_id or user_id == employer_id


class IsEmployerOfApplication(permissions.BasePermission):
    """
    Object-level permission ensuring only the hiring employer
    can change application status or schedule interviews.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        user_id = str(request.user.id)
        employer_id = str(getattr(getattr(obj, 'job', None), 'employer_id', None))
        return user_id == employer_id
