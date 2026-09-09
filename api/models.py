import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField


class Profiles(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.TextField(blank=True, null=True)
    role = models.TextField(blank=True, null=True)  # 'seeker' or 'employer'
    full_name = models.TextField(blank=True, null=True)
    avatar_url = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    
    # Employer specific fields
    company_name = models.TextField(blank=True, null=True)
    company_website = models.TextField(blank=True, null=True)
    company_size = models.TextField(blank=True, null=True)
    industry = models.TextField(blank=True, null=True)
    about_company = models.TextField(blank=True, null=True)
    tagline = models.TextField(blank=True, null=True)
    website = models.TextField(blank=True, null=True)
    company_location = models.TextField(blank=True, null=True)
    founded_year = models.TextField(blank=True, null=True)
    benefits = ArrayField(models.TextField(), blank=True, default=list)
    culture = ArrayField(models.TextField(), blank=True, default=list)
    
    # Seeker specific fields
    location = models.TextField(blank=True, null=True)
    headline = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    resume_url = models.TextField(blank=True, null=True)
    skills = ArrayField(models.TextField(), blank=True, default=list)
    experience_years = models.IntegerField(blank=True, null=True)
    min_salary = models.IntegerField(blank=True, null=True)
    max_salary = models.IntegerField(blank=True, null=True)
    preferred_distance = models.IntegerField(blank=True, null=True)
    preferred_job_type = models.TextField(blank=True, null=True)
    preferred_shift = models.TextField(blank=True, null=True)
    experience_level = models.TextField(blank=True, null=True)
    phone = models.TextField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'profiles'
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'

    def __str__(self):
        return self.full_name or self.company_name or self.email or str(self.id)

    # Helper properties for DRF User compatibility
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return True

    @property
    def is_employer(self):
        return (self.role or '').lower() == 'employer'

    @property
    def is_seeker(self):
        return (self.role or '').lower() in ['seeker', 'candidate', 'user']


class Jobs(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    employer = models.ForeignKey(
        Profiles,
        on_delete=models.DO_NOTHING,
        db_column='employer_id',
        related_name='posted_jobs'
    )
    title = models.TextField()
    description = models.TextField()
    location = models.TextField(blank=True, null=True)
    salary_range = models.TextField(blank=True, null=True)
    job_type = models.TextField(blank=True, null=True)
    requirements = ArrayField(models.TextField(), blank=True, default=list)
    status = models.TextField(blank=True, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    skills = ArrayField(models.TextField(), blank=True, default=list)
    benefits = ArrayField(models.TextField(), blank=True, default=list)
    hours_per_week = models.TextField(blank=True, null=True)
    shift_preference = models.TextField(blank=True, null=True)
    start_date = models.TextField(blank=True, null=True)
    is_flexible = models.BooleanField(blank=True, default=False)
    company_name = models.TextField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.TextField(blank=True, null=True)
    state = models.TextField(blank=True, null=True)
    postal_code = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'jobs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.company_name or 'Company'})"


class Applications(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    job = models.ForeignKey(
        Jobs,
        on_delete=models.DO_NOTHING,
        db_column='job_id',
        related_name='applications'
    )
    applicant = models.ForeignKey(
        Profiles,
        on_delete=models.DO_NOTHING,
        db_column='applicant_id',
        related_name='applications'
    )
    cover_letter = models.TextField(blank=True, null=True)
    match_score = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    user_id = models.UUIDField(blank=True, null=True)
    status = models.TextField(blank=True, default='pending')  # 'pending', 'shortlisted', 'interview', 'rejected'
    applied_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'applications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.applicant} -> {self.job} [{self.status}]"


class Messages(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    application = models.ForeignKey(
        Applications,
        on_delete=models.CASCADE,
        db_column='application_id',
        related_name='messages',
        blank=True,
        null=True
    )
    sender_id = models.UUIDField(blank=True, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    read = models.BooleanField(blank=True, default=False)

    class Meta:
        managed = False
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Message {self.id} on App {self.application_id}"


class SavedJobs(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(
        Profiles,
        on_delete=models.DO_NOTHING,
        db_column='user_id',
        related_name='saved_jobs'
    )
    job = models.ForeignKey(
        Jobs,
        on_delete=models.DO_NOTHING,
        db_column='job_id',
        related_name='saved_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'saved_jobs'
        unique_together = (('user', 'job'),)
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} saved {self.job}"


class RecentlyViewed(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.UUIDField(blank=True, null=True)
    job = models.ForeignKey(
        Jobs,
        on_delete=models.CASCADE,
        db_column='job_id',
        related_name='recent_views',
        blank=True,
        null=True
    )
    viewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'recently_viewed'
        unique_together = (('user_id', 'job'),)
        ordering = ['-viewed_at']

    def __str__(self):
        return f"User {self.user_id} viewed {self.job_id}"
