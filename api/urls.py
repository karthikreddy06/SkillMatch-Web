from django.urls import path
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),

    # Auth
    path('auth/login/', views.auth_login, name='auth_login'),
    path('auth/register/', views.auth_register, name='auth_register'),
    path('auth/me/', views.auth_me, name='auth_me'),
    path('auth/password/', views.auth_password, name='auth_password'),
    path('auth/demo-token/', views.auth_demo_token, name='auth_demo_token'),

    # Profiles & Uploads
    path('profiles/<uuid:pk>/', views.profile_detail, name='profile_detail'),
    path('profiles/upload-avatar/', views.upload_avatar, name='upload_avatar'),
    path('profiles/upload-resume/', views.upload_resume, name='upload_resume'),
    path('profiles/analyze-resume/', views.analyze_resume, name='analyze_resume'),

    # Jobs & Recommendations
    path('jobs/', views.job_list_create, name='job_list_create'),
    path('jobs/recommendations/', views.job_recommendations, name='job_recommendations'),
    path('jobs/<uuid:pk>/', views.job_detail, name='job_detail'),

    # Applications & ATS
    path('applications/', views.application_list_create, name='application_list_create'),
    path('applications/employer/', views.employer_applicants, name='employer_applicants'),
    path('applications/<uuid:pk>/status/', views.update_application_status, name='update_application_status'),
    path('applications/<uuid:pk>/schedule-interview/', views.schedule_interview, name='schedule_interview'),

    # Chat & Messaging
    path('messages/<uuid:application_id>/', views.application_messages, name='application_messages'),
    path('chats/inbox/', views.chat_inbox, name='chat_inbox'),
    path('chats/unread-count/', views.unread_message_count, name='unread_message_count'),

    # Interactions
    path('jobs/<uuid:job_id>/save/', views.toggle_save_job, name='toggle_save_job'),
    path('saved-jobs/', views.list_saved_jobs, name='list_saved_jobs'),
    path('jobs/<uuid:job_id>/record-view/', views.record_job_view, name='record_job_view'),
    path('recently-viewed/', views.list_recently_viewed, name='list_recently_viewed'),

    # Employer Analytics
    path('employer/stats/', views.employer_dashboard_stats, name='employer_dashboard_stats'),
]
