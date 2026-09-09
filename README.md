# SkillMatch

SkillMatch is a modern, AI-powered job matching platform designed to connect job seekers with relevant employment opportunities based on skills, location, and preference analytics. Built with a sleek React frontend and robust Django REST Framework backend powered by Supabase PostgreSQL database, SkillMatch offers end-to-end management for candidates and employers alike.

## Features

- **AI-Powered Skill/Job Matching**: Intelligent match score calculation comparing candidate skills against job requirements.
- **Location-Based Job Discovery**: Interactive map visualization and distance-based filtering using native geolocation and distance metrics.
- **Candidate Profiles**: Comprehensive profile management including skills inventory, work history, education, and resume upload.
- **Employer Job Posting**: Dedicated employer portal for posting jobs, managing applicants, and configuring candidate requirements.
- **Application Tracking**: End-to-end pipeline management for tracking job application status.
- **Saved Jobs**: Bookmarking and saved job management for candidates.
- **Real-time Messaging**: Direct communication channel between recruiters and candidates.
- **Interview Scheduling**: Integrated workflow for scheduling and managing candidate interview slots.
- **Resume Upload**: Secure resume document handling and attachment.
- **Location & Directions**: Embedded map directions between user location and job locations.
- **Role-Based Dashboards**: Customized interfaces and access control for both Candidate and Employer accounts.

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & Lucide Icons
- **Mapping**: Leaflet / React-Leaflet

### Backend
- **Framework**: Django 5.1 & Django REST Framework (DRF)
- **Database ORM**: Django ORM (configured with unmanaged existing schema models)
- **CORS & Auth**: django-cors-headers, PyJWT, Supabase Auth

### Database
- **Engine**: Supabase PostgreSQL

### Authentication
- **Provider**: Supabase Auth / JWT authentication

---

## Project Structure

```
SkillMatch-Web/
├── api/                    # Django Backend Application
├── config/                 # Django Project Configuration & Settings
├── frontend/               # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Dashboards, Job Discovery, Profile, etc.)
│   │   ├── services/       # API and Supabase Client Integrations
│   │   ├── types/          # TypeScript Type Definitions
│   │   └── App.tsx         # Main Frontend Application Shell & Routing
│   ├── package.json        # Frontend Dependencies
│   └── vite.config.ts      # Vite Build Configuration
├── .env.example            # Environment Variable Template (No secrets included)
├── .gitignore              # Git Ignore Specifications
├── manage.py               # Django Management CLI Script
├── requirements.txt        # Python Backend Dependencies
└── README.md               # Documentation
```

---

## Local Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Git

### 1. Repository Setup
```bash
git clone <repository-url>
cd SkillMatch-Web
```

### 2. Backend Setup
```bash
# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy template and fill in your Supabase & database details
cp .env.example .env

# Run Django development server
python manage.py runserver
```
The backend server will start at `http://127.0.0.1:8000/`.

### 3. Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Run frontend development server
npm run dev
```
The frontend application will be accessible at `http://localhost:5173/`.

### Environment Variables (.env)
Refer to `.env.example` for required variables:
```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
SUPABASE_URL=https://<your-supabase-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
SECRET_KEY=<your-django-secret-key>
```
*Note: Never commit `.env` containing actual production credentials to source control.*

---

## Production Deployment

Frontend and backend components are decoupled and intended to be deployed separately:
- **Frontend**: Deploy to platforms like Vercel, Netlify, or Cloudflare Pages.
- **Backend**: Deploy to services like Render, Railway, AWS, or Heroku.
- **Database**: Managed by Supabase PostgreSQL.

Ensure environment variables (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SECRET_KEY`, and `CORS_ALLOWED_ORIGINS`) are set in your deployment environment settings.
