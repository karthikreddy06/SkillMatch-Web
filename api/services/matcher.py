"""
SkillMatch Deterministic AI Skill-Matching Service.
Calculates transparent, reproducible match scores based on real candidate and job data.
"""

from typing import Dict, Any, List, Set
from math import radians, sin, cos, sqrt, atan2


def normalize_skill(skill: str) -> str:
    """Normalize skill string for case-insensitive semantic matching."""
    if not skill:
        return ""
    return skill.strip().lower().replace("-", " ").replace("_", " ")


def calculate_match_score(job: Any, profile: Any) -> Dict[str, Any]:
    """
    Deterministically scores a candidate profile against a job opening.

    Overall score is weighted from transparent percentages:
    - Skills: 45%
    - Experience: 20%
    - Preferences: 15%
    - Location: 20%

    Returns a dictionary with score, matched_skills, missing_skills, and breakdown.
    """
    if not job or not profile:
        return {
            'score': 0,
            'matched_skills': [],
            'missing_skills': [],
            'breakdown': {
                'skills': 0,
                'experience': 0,
                'shift': 0,
                'job_type': 0,
                'location': 0,
            }
        }

    # Extract attributes whether model instance or dictionary
    job_skills_raw = getattr(job, 'skills', None) or (job.get('skills') if isinstance(job, dict) else []) or []
    job_title = getattr(job, 'title', '') or (job.get('title') if isinstance(job, dict) else '') or ''
    job_desc = getattr(job, 'description', '') or (job.get('description') if isinstance(job, dict) else '') or ''
    job_reqs = getattr(job, 'requirements', None) or (job.get('requirements') if isinstance(job, dict) else []) or []
    job_shift = getattr(job, 'shift_preference', '') or (job.get('shift_preference') if isinstance(job, dict) else '') or ''
    job_flexible = getattr(job, 'is_flexible', False) or (job.get('is_flexible') if isinstance(job, dict) else False) or False
    job_type = getattr(job, 'job_type', '') or (job.get('job_type') if isinstance(job, dict) else '') or ''
    job_location = getattr(job, 'location', '') or (job.get('location') if isinstance(job, dict) else '') or ''
    job_lat = getattr(job, 'latitude', None) if not isinstance(job, dict) else job.get('latitude')
    job_lng = getattr(job, 'longitude', None) if not isinstance(job, dict) else job.get('longitude')

    user_skills_raw = getattr(profile, 'skills', None) or (profile.get('skills') if isinstance(profile, dict) else []) or []
    user_headline = getattr(profile, 'headline', '') or (profile.get('headline') if isinstance(profile, dict) else '') or ''
    user_shift = getattr(profile, 'preferred_shift', '') or (profile.get('preferred_shift') if isinstance(profile, dict) else '') or ''
    user_job_type = getattr(profile, 'preferred_job_type', '') or (profile.get('preferred_job_type') if isinstance(profile, dict) else '') or ''
    user_location = getattr(profile, 'location', '') or (profile.get('location') if isinstance(profile, dict) else '') or ''
    user_exp_level = getattr(profile, 'experience_level', '') or (profile.get('experience_level') if isinstance(profile, dict) else '') or ''
    user_exp_years = getattr(profile, 'experience_years', 0) or (profile.get('experience_years') if isinstance(profile, dict) else 0) or 0
    user_lat = getattr(profile, 'latitude', None) if not isinstance(profile, dict) else profile.get('latitude')
    user_lng = getattr(profile, 'longitude', None) if not isinstance(profile, dict) else profile.get('longitude')
    preferred_distance = getattr(profile, 'preferred_distance', None) if not isinstance(profile, dict) else profile.get('preferred_distance')

    user_skills_norm: Set[str] = {normalize_skill(s) for s in user_skills_raw if s}

    # 1. Skills overlap, normalized to a percentage.
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    skills_percent = 0

    if job_skills_raw:
        for skill in job_skills_raw:
            norm = normalize_skill(skill)
            if not norm:
                continue
            # Exact or substring match
            if any(norm in u or u in norm for u in user_skills_norm):
                matched_skills.append(skill)
            else:
                missing_skills.append(skill)

        overlap_ratio = len(matched_skills) / len(job_skills_raw)
        skills_percent = round(overlap_ratio * 100)
    elif user_skills_norm:
        # If job has no explicit skills array, scan title and description
        searchable_text = f"{job_title} {job_desc} {' '.join(job_reqs)}".lower()
        matched = [s for s in user_skills_raw if normalize_skill(s) in searchable_text]
        matched_skills = matched
        ratio = len(matched) / max(len(user_skills_raw), 1)
        skills_percent = min(round(ratio * 100), 100)

    # 2. Experience alignment, normalized to a percentage.
    experience_percent = 55
    title_and_desc = f"{job_title} {job_desc}".lower()
    user_exp_lower = user_exp_level.lower()

    if user_exp_lower and user_exp_lower in title_and_desc:
        experience_percent = 100
    elif 'senior' in title_and_desc and 'senior' in user_exp_lower:
        experience_percent = 100
    elif 'senior' in title_and_desc and user_exp_years >= 5:
        experience_percent = 92
    elif 'mid' in title_and_desc and ('mid' in user_exp_lower or user_exp_years >= 2):
        experience_percent = 100
    elif 'entry' in title_and_desc or 'trainee' in title_and_desc or 'graduate' in title_and_desc:
        experience_percent = 100 if user_exp_years <= 2 or 'entry' in user_exp_lower else 70
    elif user_headline and (job_title.lower() in user_headline.lower() or user_headline.lower() in job_title.lower()):
        experience_percent = 87

    # 3. Shift and job type preferences form the preference percentage.
    shift_percent = 45
    if job_flexible or 'flexible' in job_shift.lower():
        shift_percent = 100
    elif user_shift and job_shift and user_shift.lower() == job_shift.lower():
        shift_percent = 100
    elif not user_shift:
        shift_percent = 75

    job_type_percent = 50
    if not user_job_type or not job_type:
        job_type_percent = 70
    elif user_job_type.lower() == job_type.lower():
        job_type_percent = 100
    elif 'remote' in job_type.lower() or 'remote' in user_job_type.lower():
        job_type_percent = 90

    # 4. Location percentage is based on actual coordinates only.
    location_percent = None
    distance_km = None
    if 'remote' in job_type.lower() or 'remote' in job_location.lower():
        location_percent = 100
    elif user_lat is not None and user_lng is not None and job_lat is not None and job_lng is not None:
        radius = 6371
        d_lat = radians(float(job_lat) - float(user_lat))
        d_lng = radians(float(job_lng) - float(user_lng))
        a = sin(d_lat / 2) ** 2 + cos(radians(float(user_lat))) * cos(radians(float(job_lat))) * sin(d_lng / 2) ** 2
        distance_km = round(radius * 2 * atan2(sqrt(a), sqrt(1 - a)), 1)
        target_distance = float(preferred_distance or 25)
        location_percent = max(0, round(100 * (1 - min(distance_km / target_distance, 1))))

    preference_percent = round((shift_percent + job_type_percent) / 2)
    weighted_parts = [skills_percent * 0.45, experience_percent * 0.2, preference_percent * 0.15]
    if location_percent is not None:
        weighted_parts.append(location_percent * 0.2)
        total_score = round(sum(weighted_parts))
    else:
        total_score = round(sum(weighted_parts) / 0.8)

    return {
        'score': max(min(total_score, 100), 0),
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'breakdown': {
            'skills': skills_percent,
            'experience': experience_percent,
            'preferences': preference_percent,
            'location': location_percent,
            'distance_km': distance_km,
        }
    }
