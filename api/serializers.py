from rest_framework import serializers
from .models import Profiles, Jobs, Applications, Messages, SavedJobs, RecentlyViewed


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profiles
        fields = [
            'id', 'email', 'role', 'full_name', 'avatar_url', 'updated_at',
            # Employer fields
            'company_name', 'company_website', 'company_size', 'industry',
            'about_company', 'tagline', 'website', 'company_location',
            'founded_year', 'benefits', 'culture',
            # Seeker fields
            'location', 'latitude', 'longitude', 'headline', 'bio', 'resume_url', 'skills',
            'experience_years', 'min_salary', 'max_salary', 'preferred_distance',
            'preferred_job_type', 'preferred_shift', 'experience_level', 'phone'
        ]
        read_only_fields = ['id', 'email']


class EmployerSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Profiles
        fields = ['id', 'company_name', 'avatar_url', 'industry', 'company_location', 'company_website']


class JobSerializer(serializers.ModelSerializer):
    employer_details = EmployerSummarySerializer(source='employer', read_only=True)
    applicants_count = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()

    class Meta:
        model = Jobs
        fields = [
            'id', 'employer', 'employer_details', 'title', 'description',
            'location', 'salary_range', 'job_type', 'requirements', 'status',
            'created_at', 'skills', 'benefits', 'hours_per_week', 'shift_preference',
            'start_date', 'is_flexible', 'company_name', 'applicants_count',
            'is_saved', 'has_applied', 'latitude', 'longitude', 'address', 'city', 'state', 'postal_code'
        ]
        read_only_fields = ['id', 'created_at']

    def get_applicants_count(self, obj):
        counts_map = self.context.get('applicant_counts')
        if counts_map is not None:
            return counts_map.get(str(obj.id), 0)
        if hasattr(obj, 'precalculated_applicants_count'):
            return obj.precalculated_applicants_count
        return obj.applications.count()

    def get_is_saved(self, obj):
        saved_set = self.context.get('saved_job_ids')
        if saved_set is not None:
            return str(obj.id) in saved_set
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return SavedJobs.objects.filter(job=obj, user=request.user).exists()
        return False

    def get_has_applied(self, obj):
        applied_set = self.context.get('applied_job_ids')
        if applied_set is not None:
            return str(obj.id) in applied_set
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return Applications.objects.filter(job=obj, applicant=request.user).exists()
        return False


class ApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)
    applicant_details = ProfileSerializer(source='applicant', read_only=True)

    class Meta:
        model = Applications
        fields = [
            'id', 'job', 'job_details', 'applicant', 'applicant_details',
            'cover_letter', 'match_score', 'created_at', 'status', 'applied_at'
        ]
        read_only_fields = ['id', 'created_at', 'applied_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Populate nested objects for both job/applicant and job_details/applicant_details
        data['job'] = data.get('job_details')
        data['applicant'] = data.get('applicant_details')
        return data


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Messages
        fields = ['id', 'application', 'sender_id', 'sender_name', 'content', 'created_at', 'read']
        read_only_fields = ['id', 'created_at']

    def get_sender_name(self, obj):
        senders_map = self.context.get('senders_map')
        if senders_map is not None:
            return senders_map.get(str(obj.sender_id), 'User')
        if obj.sender_id:
            profile = Profiles.objects.filter(id=obj.sender_id).first()
            if profile:
                return profile.full_name or profile.company_name or 'User'
        return 'Unknown'


class SavedJobSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)

    class Meta:
        model = SavedJobs
        fields = ['id', 'user', 'job', 'job_details', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        job_data = data.get('job_details')
        data['saved_job_id'] = str(instance.id)
        data['user_id'] = str(instance.user_id) if instance.user_id else None
        data['job_id'] = str(instance.job_id) if instance.job_id else None
        if job_data:
            data['job'] = job_data
            data['job_details'] = job_data
        return data


class RecentlyViewedSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)

    class Meta:
        model = RecentlyViewed
        fields = ['id', 'user_id', 'job', 'job_details', 'viewed_at']
        read_only_fields = ['id', 'viewed_at']
