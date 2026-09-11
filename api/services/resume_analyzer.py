"""
SkillMatch Deterministic AI Resume & ATS Analyzer Service.
Parses unstructured resume text using intelligent natural language heuristics,
industry skill taxonomies, section extractors, and quantifiable impact scoring.
Integrates with matcher.py for job-aware recommendations with zero external AI dependencies.
"""

import re
import datetime
from typing import Dict, Any, List, Set, Optional, Tuple

from .matcher import calculate_match_score

# =============================================================================
# SKILL TAXONOMY & NORMALIZATION DICTIONARY
# =============================================================================

SKILL_NORMALIZATION_MAP: Dict[str, str] = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'py': 'Python',
    'python': 'Python',
    'react': 'React',
    'reactjs': 'React',
    'react.js': 'React',
    'react native': 'React Native',
    'next': 'Next.js',
    'nextjs': 'Next.js',
    'next.js': 'Next.js',
    'vue': 'Vue.js',
    'vuejs': 'Vue.js',
    'vue.js': 'Vue.js',
    'angular': 'Angular',
    'angularjs': 'Angular',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'express': 'Express.js',
    'expressjs': 'Express.js',
    'django': 'Django',
    'fastapi': 'FastAPI',
    'flask': 'Flask',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'mongodb': 'MongoDB',
    'mongo': 'MongoDB',
    'redis': 'Redis',
    'sqlite': 'SQLite',
    'aws': 'AWS',
    'amazon web services': 'AWS',
    'gcp': 'Google Cloud (GCP)',
    'google cloud': 'Google Cloud (GCP)',
    'azure': 'Microsoft Azure',
    'k8s': 'Kubernetes',
    'kubernetes': 'Kubernetes',
    'docker': 'Docker',
    'ci/cd': 'CI/CD',
    'cicd': 'CI/CD',
    'git': 'Git',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'graphql': 'GraphQL',
    'rest': 'REST APIs',
    'rest api': 'REST APIs',
    'restful': 'REST APIs',
    'tailwind': 'Tailwind CSS',
    'tailwindcss': 'Tailwind CSS',
    'html': 'HTML5',
    'html5': 'HTML5',
    'css': 'CSS3',
    'css3': 'CSS3',
    'sass': 'SASS/SCSS',
    'scss': 'SASS/SCSS',
    'redux': 'Redux',
    'zustand': 'Zustand',
    'linux': 'Linux',
    'bash': 'Bash/Shell',
    'shell': 'Bash/Shell',
    'sql': 'SQL',
    'nosql': 'NoSQL',
    'terraform': 'Terraform',
    'ansible': 'Ansible',
    'kafka': 'Apache Kafka',
    'rabbitmq': 'RabbitMQ',
    'nginx': 'Nginx',
    'c++': 'C++',
    'cpp': 'C++',
    'c#': 'C#',
    'csharp': 'C#',
    'golang': 'Go',
    'go': 'Go',
    'rust': 'Rust',
    'java': 'Java',
    'spring': 'Spring Boot',
    'spring boot': 'Spring Boot',
    'pytorch': 'PyTorch',
    'tensorflow': 'TensorFlow',
    'scikit-learn': 'Scikit-Learn',
    'pandas': 'Pandas',
    'numpy': 'NumPy',
    'power bi': 'Power BI',
    'tableau': 'Tableau',
    'figma': 'Figma',
    'ui/ux': 'UI/UX Design',
    'jira': 'Jira',
    'agile': 'Agile Methodologies',
    'scrum': 'Scrum',
}

# Broader category recognition sets
KNOWN_TECH_SKILLS = {
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'next.js', 'django', 'fastapi', 'flask', 'node.js', 'express.js', 'spring boot',
    'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'dynamodb', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'git', 'linux', 'bash',
    'html5', 'css3', 'tailwind css', 'redux', 'graphql', 'rest apis', 'microservices', 'kafka', 'rabbitmq',
    'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'data analysis', 'pandas', 'numpy',
    'pandas', 'power bi', 'tableau', 'figma', 'ui/ux design', 'unit testing', 'jest', 'cypress', 'selenium',
    'cybersecurity', 'penetration testing', 'devops', 'sysadmin', 'solidity', 'blockchain',
}

KNOWN_SOFT_SKILLS = {
    'communication', 'leadership', 'problem solving', 'teamwork', 'collaboration',
    'critical thinking', 'time management', 'adaptability', 'mentorship', 'stakeholder management',
    'agile', 'scrum', 'conflict resolution', 'cross-functional collaboration', 'analytical thinking',
}

ACTION_VERBS = {
    'developed', 'designed', 'built', 'implemented', 'spearheaded', 'orchestrated',
    'engineered', 'created', 'optimized', 'reduced', 'increased', 'boosted', 'scaled',
    'architected', 'accelerated', 'automated', 'streamlined', 'delivered', 'managed',
    'led', 'collaborated', 'integrated', 'refactored', 'resolved', 'deployed', 'maintained',
    'launched', 'published', 'configured', 'transformed', 'audited', 'enhanced', 'pioneered',
}

ROLE_KEYWORDS = [
    'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
    'Mobile Developer', 'iOS Developer', 'Android Developer', 'DevOps Engineer',
    'Cloud Architect', 'Data Scientist', 'Data Analyst', 'Data Engineer',
    'Machine Learning Engineer', 'AI Engineer', 'System Administrator', 'QA Engineer',
    'Test Automation Engineer', 'Product Manager', 'Project Manager', 'Scrum Master',
    'UI/UX Designer', 'Product Designer', 'Security Analyst', 'Database Administrator',
    'Technical Lead', 'Engineering Manager', 'Site Reliability Engineer', 'Solutions Architect',
]

DEGREE_PATTERNS = [
    (r'\b(ph\.?d|doctorate)\b', 'Doctor of Philosophy (Ph.D)'),
    (r'\b(m\.?tech|master of technology)\b', 'Master of Technology (M.Tech)'),
    (r'\b(m\.?s|master of science)\b', 'Master of Science (M.S.)'),
    (r'\b(m\.?c\.?a|master of computer applications)\b', 'Master of Computer Applications (MCA)'),
    (r'\b(m\.?b\.?a|master of business administration)\b', 'Master of Business Administration (MBA)'),
    (r'\b(b\.?tech|bachelor of technology)\b', 'Bachelor of Technology (B.Tech)'),
    (r'\b(b\.?e|bachelor of engineering)\b', 'Bachelor of Engineering (B.E.)'),
    (r'\b(b\.?s|bachelor of science)\b', 'Bachelor of Science (B.S.)'),
    (r'\b(b\.?c\.?a|bachelor of computer applications)\b', 'Bachelor of Computer Applications (BCA)'),
    (r'\b(bachelor|master|degree|diploma)\b', 'Bachelor Degree'),
]

MAJOR_PATTERNS = [
    'Computer Science', 'Information Technology', 'Software Engineering',
    'Electrical Engineering', 'Mechanical Engineering', 'Data Science',
    'Artificial Intelligence', 'Electronics and Communication', 'Cyber Security',
    'Information Systems', 'Business Administration',
]

CERTIFICATION_PATTERNS = [
    'AWS Certified Solutions Architect', 'AWS Certified Developer', 'AWS Certified Cloud Practitioner',
    'Azure Fundamentals', 'Azure Solutions Architect', 'Google Cloud Certified Professional',
    'Certified Kubernetes Administrator (CKA)', 'Certified Scrum Master (CSM)',
    'Project Management Professional (PMP)', 'Cisco Certified Network Associate (CCNA)',
    'CompTIA Security+', 'CompTIA Network+', 'HashiCorp Certified Terraform Associate',
]


# =============================================================================
# HELPER EXTRACTORS
# =============================================================================

def extract_contact_info(text: str) -> Dict[str, Any]:
    """Extract contact information: email, phone, links, and approximate name."""
    # Email
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', text)
    email = email_match.group(0) if email_match else None

    # Phone (handles international format, standard 10 digits, with optional brackets/dashes)
    phone_match = re.search(r'(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}\b', text)
    phone = phone_match.group(0).strip() if phone_match else None
    # Validate minimum digits
    if phone and len(re.sub(r'\D', '', phone)) < 7:
        phone = None

    # Links
    linkedin = None
    github = None
    portfolio = None

    for line in text.split('\n')[:30]:
        if 'linkedin.com' in line.lower() and not linkedin:
            m = re.search(r'(https?://[^\s]+|linkedin\.com/in/[^\s,]+)', line, re.I)
            if m: linkedin = m.group(0)
        if 'github.com' in line.lower() and not github:
            m = re.search(r'(https?://[^\s]+|github\.com/[^\s,]+)', line, re.I)
            if m: github = m.group(0)

    # Name detection: look at the first 5 non-empty lines
    detected_name = None
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for l in lines[:5]:
        # Skip if contains email or url or is clearly a header
        if '@' in l or 'http' in l or 'curriculum' in l.lower() or 'resume' in l.lower():
            continue
        words = l.split()
        if 1 <= len(words) <= 4 and all(w[0].isupper() for w in words if w and w[0].isalpha()):
            detected_name = l
            break

    # Location hints
    detected_location = None
    location_keywords = ['Bangalore', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Chennai',
                         'Noida', 'Gurgaon', 'Kolkata', 'Kochi', 'Remote', 'India', 'California', 'New York', 'London']
    for loc in location_keywords:
        if re.search(r'\b' + re.escape(loc) + r'\b', text, re.I):
            detected_location = loc
            break

    return {
        'name': detected_name,
        'email': email,
        'phone': phone,
        'linkedin': linkedin,
        'github': github,
        'location': detected_location,
    }


def extract_skills_from_text(text: str) -> Tuple[List[str], Dict[str, List[str]]]:
    """Scan resume text for recognized skills and return normalized list & categorization."""
    text_lower = text.lower()
    detected_skills_set: Set[str] = set()

    categorized: Dict[str, List[str]] = {
        'languages': [],
        'frameworks': [],
        'databases': [],
        'cloud_devops': [],
        'tools_other': [],
        'soft_skills': [],
    }

    # Match normalized dictionary keys
    for raw_skill, normalized_name in SKILL_NORMALIZATION_MAP.items():
        # Word boundary regex with punctuation tolerance
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(raw_skill) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, text_lower):
            detected_skills_set.add(normalized_name)

    # Categorize detected skills
    for skill in detected_skills_set:
        s_lower = skill.lower()
        if s_lower in {'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql'}:
            categorized['languages'].append(skill)
        elif s_lower in {'react', 'next.js', 'angular', 'vue.js', 'django', 'fastapi', 'flask', 'node.js', 'express.js', 'spring boot', 'redux', 'tailwind css'}:
            categorized['frameworks'].append(skill)
        elif s_lower in {'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'nosql'}:
            categorized['databases'].append(skill)
        elif s_lower in {'aws', 'google cloud (gcp)', 'microsoft azure', 'docker', 'kubernetes', 'ci/cd', 'git', 'linux', 'terraform', 'nginx'}:
            categorized['cloud_devops'].append(skill)
        elif s_lower in KNOWN_SOFT_SKILLS or any(s in s_lower for s in ['communication', 'leadership', 'management', 'teamwork']):
            categorized['soft_skills'].append(skill)
        else:
            categorized['tools_other'].append(skill)

    sorted_skills = sorted(list(detected_skills_set))
    return sorted_skills, categorized


def extract_experience_insights(text: str) -> Dict[str, Any]:
    """Extract years of experience, current/past roles, and seniority."""
    years_detected = 0

    # 1. Search for explicit "X+ years of experience"
    exp_year_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience', text, re.I)
    if exp_year_matches:
        try:
            years_detected = max(float(y) for y in exp_year_matches)
        except Exception:
            years_detected = 0

    # 2. Isolate work experience section to avoid summing college/education dates or certification dates
    exp_sec_match = re.search(
        r'(?:^|\n)\s*(?:work\s+experience|professional\s+experience|employment\s+history|experience)\s*(?:\n|:|\-\-|\—)',
        text,
        re.I
    )
    if exp_sec_match:
        after_header = text[exp_sec_match.end():]
        next_sec_match = re.search(
            r'(?:^|\n)\s*(?:education|academics|qualifications|projects?|key projects?|certifications?|skills|technical skills)\s*(?:\n|:|\-\-|\—)',
            after_header,
            re.I
        )
        exp_text = after_header[:next_sec_match.start()] if next_sec_match else after_header[:2500]
    else:
        # If no explicit Work Experience heading, exclude Education and Certifications sections from date calculation
        non_exp_match = re.search(
            r'(?:^|\n)\s*(?:education|academics|qualifications|certifications?)\s*(?:\n|:|\-\-|\—)',
            text,
            re.I
        )
        exp_text = text[:non_exp_match.start()] if non_exp_match else text

    # Date span extraction specifically from experience text (e.g. 2021 - 2024, 2021 - Present)
    year_spans = re.findall(r'\b(20\d\d|19\d\d)\s*(?:-|–|to)\s*(20\d\d|present|current)\b', exp_text, re.I)
    calculated_years = 0
    current_year = datetime.datetime.now().year

    for start_str, end_str in year_spans:
        try:
            start_y = int(start_str)
            end_y = current_year if end_str.lower() in ('present', 'current') else int(end_str)
            span = max(0, end_y - start_y)
            if 0 < span < 40:
                calculated_years += span
        except Exception:
            pass

    if years_detected > 0 and calculated_years > 0:
        final_years = years_detected if abs(years_detected - calculated_years) <= 2 else max(years_detected, calculated_years)
    else:
        final_years = max(years_detected, calculated_years)

    final_years = round(min(final_years, 35), 1)
    if final_years.is_integer():
        final_years = int(final_years)

    # Detect Roles: search experience text first; if empty, search summary/whole text
    detected_roles = []
    for role in ROLE_KEYWORDS:
        if re.search(r'\b' + re.escape(role) + r'\b', exp_text, re.I):
            detected_roles.append(role)

    if not detected_roles:
        for role in ROLE_KEYWORDS:
            if re.search(r'\b' + re.escape(role) + r'\b', text, re.I):
                m = re.search(r'(?:certified|certification)\s+[^\n]*\b' + re.escape(role) + r'\b', text, re.I)
                if not m:
                    detected_roles.append(role)

    # Determine Seniority based on years and job titles (excluding certification mentions)
    exp_and_headline = exp_text + " " + text[:500]
    is_explicit_senior = any(kw in exp_and_headline.lower() for kw in ['senior', 'lead', 'principal', 'staff engineer', 'engineering manager', 'tech lead'])
    if final_years >= 6 or is_explicit_senior:
        seniority = 'Senior'
    elif final_years >= 2 or any(kw in exp_and_headline.lower() for kw in ['mid-level', 'intermediate', 'experienced']):
        seniority = 'Mid-Level'
    else:
        seniority = 'Entry-Level'

    return {
        'years': final_years,
        'seniority': seniority,
        'detected_roles': detected_roles[:4],
        'primary_headline': detected_roles[0] if detected_roles else (f"{seniority} Professional" if seniority else "Specialist")
    }


def extract_education_insights(text: str) -> List[str]:
    """Identify degrees, diplomas, and educational background."""
    detected_degrees = []
    text_lower = text.lower()

    for pattern, label in DEGREE_PATTERNS:
        if re.search(pattern, text_lower):
            # If we already have a specific degree, don't add the generic fallback
            if label == 'Bachelor Degree' and any('bachelor' in d.lower() or 'b.tech' in d.lower() or 'b.e' in d.lower() for d in detected_degrees):
                continue

            # Try to associate with a major
            major_found = None
            for major in MAJOR_PATTERNS:
                if major.lower() in text_lower:
                    major_found = major
                    break
            if major_found:
                deg_str = f"{label} in {major_found}"
            else:
                deg_str = label

            if deg_str not in detected_degrees:
                detected_degrees.append(deg_str)

    return detected_degrees[:3]


def extract_project_insights(text: str) -> Dict[str, Any]:
    """Detect presence of projects, quantifiable metrics, and impact statements."""
    has_project_section = bool(re.search(r'\b(projects?|personal projects?|key projects?|academic projects?)\b', text, re.I))

    # Search for measurable metrics: percentages, throughput, scale numbers, currency
    impact_matches = re.findall(
        r'(\b(?:increased?|increasing|reduced?|reducing|boosted?|boosting|improved?|improving|optimized?|optimizing|scaled?|scaling|accelerated?|accelerating|delivered?|delivering|saved?|saving|cut|cutting)\b[^\n\.\;]{1,80}?(?:by\s+)?(?:\d+%(?:\s+(?:increase|reduction|improvement|boost))?|\$\d+[\d,]*|\d+[kKmMbB]?\+?\s*(?:users|requests|qps|queries|customers|latency|time|events|costs?)))',
        text,
        re.I
    )

    clean_impacts = [m.strip() for m in impact_matches if len(m.strip()) > 10][:4]

    # Estimate project count based on project section bullets/titles
    est_project_count = 0
    if has_project_section:
        proj_sec = re.split(r'\bprojects?\b', text, flags=re.I)
        if len(proj_sec) > 1:
            snippet = proj_sec[1][:1500]
            next_sec = re.split(r'\b(?:education|certifications?|skills|work experience)\b', snippet, flags=re.I)
            proj_content = next_sec[0] if next_sec else snippet
            bullets = re.findall(r'(?:^|\n)\s*(?:[\*\-\•\–]|\d+[\.\)])\s*([A-Z][^\n]+)', proj_content)
            paragraphs = [p.strip() for p in proj_content.split('\n') if len(p.strip()) > 5]
            if len(bullets) >= 2:
                est_project_count = max(len(bullets) // 2, 2)
            elif len(bullets) == 1:
                est_project_count = 1
            elif len(paragraphs) >= 2:
                est_project_count = max(len(paragraphs) // 2, 1)
            else:
                est_project_count = 1

    return {
        'has_project_section': has_project_section,
        'project_count': est_project_count,
        'impact_statements': clean_impacts,
        'has_quantifiable_metrics': len(clean_impacts) > 0,
    }


def extract_certifications(text: str) -> List[str]:
    """Detect certifications recognized in the industry."""
    detected = []
    for cert in CERTIFICATION_PATTERNS:
        if re.search(r'\b' + re.escape(cert) + r'\b', text, re.I):
            detected.append(cert)
        else:
            # Short acronym match
            acronym = re.search(r'\(([^)]+)\)', cert)
            if acronym and re.search(r'\b' + re.escape(acronym.group(1)) + r'\b', text):
                detected.append(cert)

    # General pattern for "Certified <Something>"
    general_cert_matches = re.findall(r'\b(Certified\s+[A-Za-z0-9\+]{3,25}(?:\s+[A-Za-z0-9\+]{2,20}){0,3})\b', text)
    for c in general_cert_matches:
        c_clean = c.strip()
        if '\n' not in c_clean and len(c_clean) < 40 and c_clean not in detected and not any(c_clean in d for d in detected):
            detected.append(c_clean)

    return list(dict.fromkeys(detected))[:5]


# =============================================================================
# ATS SCORING & AUDIT ENGINE
# =============================================================================

def analyze_resume_text(
    raw_text: str,
    candidate_profile: Optional[Any] = None,
    active_jobs: Optional[List[Any]] = None
) -> Dict[str, Any]:
    """
    Complete ATS and skill analysis of resume text.
    Produces a 0-100 score, section breakdowns, strengths, recommendations,
    and job recommendations using existing matcher.py.
    """
    if not raw_text or len(raw_text.strip()) < 30:
        return {
            'resume_score': 0,
            'overall_score': 0,
            'breakdown': {
                'profile_completeness': 0,
                'skills': 0,
                'experience': 0,
                'projects': 0,
                'education': 0,
                'keywords': 0,
            },
            'extracted_skills': [],
            'experience_years': 0,
            'experience_level': 'Not specified',
            'detected_roles': [],
            'education': [],
            'certifications': [],
            'project_count': 0,
            'strengths': [],
            'weaknesses': ['Resume text is empty or too short to analyze.'],
            'missing_sections': ['All sections missing'],
            'improvement_suggestions': ['Please upload a full resume document with work experience and skills.'],
            'matching_jobs': [],
            'extracted_profile_updates': {},
        }

    # 1. Component Extraction
    contacts = extract_contact_info(raw_text)
    extracted_skills, skills_categorized = extract_skills_from_text(raw_text)
    exp_insights = extract_experience_insights(raw_text)
    edu_insights = extract_education_insights(raw_text)
    proj_insights = extract_project_insights(raw_text)
    certs_insights = extract_certifications(raw_text)

    # Action verbs check
    words_in_text = re.findall(r'\b[a-zA-Z]{3,}\b', raw_text.lower())
    found_verbs = [w for w in set(words_in_text) if w in ACTION_VERBS]

    # Section headers detection
    has_summary = bool(re.search(r'\b(summary|objective|profile|about me)\b', raw_text, re.I))
    has_skills_sec = bool(re.search(r'\b(skills|technical skills|competencies|technologies)\b', raw_text, re.I))
    has_exp_sec = bool(re.search(r'\b(experience|employment|work history|professional background)\b', raw_text, re.I))
    has_edu_sec = bool(re.search(r'\b(education|academics|qualifications)\b', raw_text, re.I))
    has_proj_sec = proj_insights['has_project_section']
    has_cert_sec = bool(re.search(r'\b(certifications|certificates|licenses)\b', raw_text, re.I))

    # =========================================================================
    # 2. TRANSPARENT COMPONENT SCORING (0 to 100 per component)
    # =========================================================================

    # Profile Completeness (15% weight)
    # Name (+25), Email (+30), Phone (+25), Location (+10), Link (+10)
    p_comp = 0
    if contacts['name']: p_comp += 25
    if contacts['email']: p_comp += 30
    if contacts['phone']: p_comp += 25
    if contacts['location']: p_comp += 10
    if contacts['linkedin'] or contacts['github']: p_comp += 10
    score_profile = min(p_comp, 100)

    # Skills Score (25% weight)
    # Number of skills + breadth across frameworks, databases, cloud
    s_count = len(extracted_skills)
    s_score = min(s_count * 7, 70)  # 10 skills = 70 base
    categories_represented = sum(1 for cat, items in skills_categorized.items() if items)
    s_score += min(categories_represented * 6, 30)  # +6 per category up to 30
    score_skills = min(max(s_score, 10), 100)

    # Experience Score (25% weight)
    # Section presence, role titles, action verb density
    exp_score = 40 if has_exp_sec else 15
    if exp_insights['years'] > 0: exp_score += 20
    if exp_insights['detected_roles']: exp_score += 15
    if len(found_verbs) >= 5: exp_score += 25
    elif len(found_verbs) >= 2: exp_score += 15
    score_experience = min(exp_score, 100)

    # Projects Score (15% weight)
    proj_score = 30 if has_proj_sec else 10
    if proj_insights['has_quantifiable_metrics']: proj_score += 45
    elif proj_insights['project_count'] > 0: proj_score += 25
    if len(found_verbs) >= 3: proj_score += 25
    score_projects = min(proj_score, 100)

    # Education Score (10% weight)
    edu_score = 40 if has_edu_sec else 15
    if edu_insights: edu_score += 45
    if certs_insights: edu_score += 15
    score_education = min(edu_score, 100)

    # Keywords & Formatting Score (10% weight)
    # Length appropriate (300-1800 words), good action verbs, low repetition
    word_count = len(words_in_text)
    kw_score = 40
    if 250 <= word_count <= 2000: kw_score += 30
    elif word_count > 150: kw_score += 15
    if len(found_verbs) >= 6: kw_score += 30
    elif len(found_verbs) >= 3: kw_score += 15
    score_keywords = min(kw_score, 100)

    # Weighted Overall Score
    overall_score = round(
        (score_profile * 0.15) +
        (score_skills * 0.25) +
        (score_experience * 0.25) +
        (score_projects * 0.15) +
        (score_education * 0.10) +
        (score_keywords * 0.10)
    )
    overall_score = max(min(overall_score, 100), 5)

    # =========================================================================
    # 3. STRENGTHS & IMPROVEMENT RECOMMENDATIONS
    # =========================================================================
    strengths: List[str] = []
    improvements: List[str] = []
    missing_sections: List[str] = []

    # Strengths
    if s_count >= 8:
        strengths.append(f"Strong skill representation with {s_count} recognized industry skills.")
    if len(found_verbs) >= 5:
        strengths.append(f"Action-driven language with impactful verbs (e.g. {', '.join(found_verbs[:3])}).")
    if proj_insights['has_quantifiable_metrics']:
        strengths.append("Contains measurable business outcomes and quantifiable impact metrics.")
    if contacts['linkedin'] or contacts['github']:
        strengths.append("Professional profile links (LinkedIn/GitHub) are clearly accessible.")
    if edu_insights:
        strengths.append(f"Clear educational credentials: {edu_insights[0]}.")
    if certs_insights:
        strengths.append(f"Verified certifications detected ({len(certs_insights)} credentials).")

    if not strengths:
        strengths.append("Document structure is readable and ready for keyword expansion.")

    # Missing Sections
    if not has_summary: missing_sections.append("Professional Summary / About")
    if not has_skills_sec: missing_sections.append("Dedicated Skills Section")
    if not has_exp_sec: missing_sections.append("Work Experience")
    if not has_proj_sec: missing_sections.append("Projects & Case Studies")
    if not has_edu_sec: missing_sections.append("Education & Qualifications")
    if not has_cert_sec and not certs_insights: missing_sections.append("Certifications & Badges")

    # Improvements
    if not proj_insights['has_quantifiable_metrics']:
        improvements.append("Add measurable achievements (e.g. 'improved performance by 30%', 'managed team of 5').")
    if not contacts['phone']:
        improvements.append("Ensure your phone number is clearly formatted for recruiter contact.")
    if not contacts['location']:
        improvements.append("Include your target city or 'Remote' preference to improve local job matching.")
    if s_count < 6:
        improvements.append("List more technical tools, databases, and core domain frameworks to pass ATS filters.")
    if len(found_verbs) < 4:
        improvements.append("Begin bullet points with dynamic action verbs like 'Engineered', 'Orchestrated', 'Optimized'.")
    if not certs_insights and not has_cert_sec:
        improvements.append("Consider adding recognized cloud or industry certifications to boost credibility.")
    if word_count < 200:
        improvements.append("Expand on your job responsibilities and project details to provide sufficient ATS keyword depth.")

    if not improvements:
        improvements.append("Keep your resume updated with your most recent projects and version upgrades.")

    # =========================================================================
    # 4. JOB-AWARE MATCHING USING EXISTING MATCHER.PY
    # =========================================================================
    matching_jobs_list: List[Dict[str, Any]] = []

    if active_jobs:
        # Construct synthetic profile representation reflecting extracted resume data
        # merged with any pre-existing candidate profile attributes
        synthetic_profile = {
            'skills': extracted_skills if extracted_skills else (getattr(candidate_profile, 'skills', []) or []),
            'headline': exp_insights['primary_headline'],
            'experience_level': exp_insights['seniority'],
            'experience_years': exp_insights['years'],
            'preferred_shift': getattr(candidate_profile, 'preferred_shift', '') or '',
            'preferred_job_type': getattr(candidate_profile, 'preferred_job_type', '') or '',
            'location': contacts['location'] or getattr(candidate_profile, 'location', '') or '',
            'latitude': getattr(candidate_profile, 'latitude', None),
            'longitude': getattr(candidate_profile, 'longitude', None),
            'preferred_distance': getattr(candidate_profile, 'preferred_distance', None),
        }

        scored = []
        for job in active_jobs:
            m_res = calculate_match_score(job, synthetic_profile)
            scored.append({
                'id': str(getattr(job, 'id', '') or (job.get('id') if isinstance(job, dict) else '')),
                'title': getattr(job, 'title', '') or (job.get('title') if isinstance(job, dict) else ''),
                'company_name': getattr(job, 'company_name', '') or (job.get('company_name') if isinstance(job, dict) else '') or 'Company',
                'location': getattr(job, 'location', '') or (job.get('location') if isinstance(job, dict) else '') or 'India',
                'salary_range': getattr(job, 'salary_range', '') or (job.get('salary_range') if isinstance(job, dict) else '') or 'Competitive',
                'job_type': getattr(job, 'job_type', '') or (job.get('job_type') if isinstance(job, dict) else '') or 'Full-time',
                'match_score': m_res['score'],
                'matched_skills': m_res['matched_skills'],
                'missing_skills': m_res['missing_skills'],
                'distance_km': m_res['breakdown'].get('distance_km'),
            })

        # Rank by match_score descending
        scored.sort(key=lambda j: j['match_score'], reverse=True)
        matching_jobs_list = scored[:5]

    # =========================================================================
    # 5. SAFE PROFILE SYNC CANDIDATES (Does NOT auto-overwrite)
    # =========================================================================
    extracted_profile_updates = {}
    if extracted_skills:
        extracted_profile_updates['skills'] = extracted_skills
    if exp_insights['years'] > 0:
        extracted_profile_updates['experience_years'] = exp_insights['years']
    if exp_insights['seniority']:
        extracted_profile_updates['experience_level'] = exp_insights['seniority']
    if exp_insights['primary_headline']:
        extracted_profile_updates['headline'] = exp_insights['primary_headline']
    if contacts['phone']:
        extracted_profile_updates['phone'] = contacts['phone']
    if contacts['location']:
        extracted_profile_updates['location'] = contacts['location']

    return {
        'resume_score': overall_score,
        'overall_score': overall_score,
        'breakdown': {
            'profile_completeness': score_profile,
            'skills': score_skills,
            'experience': score_experience,
            'projects': score_projects,
            'education': score_education,
            'keywords': score_keywords,
        },
        'skills': extracted_skills,
        'skills_categorized': skills_categorized,
        'experience': exp_insights,
        'education': edu_insights,
        'certifications': certs_insights,
        'projects': proj_insights,
        'detected_roles': exp_insights['detected_roles'],
        'strengths': strengths,
        'weaknesses': improvements,
        'improvements': improvements,
        'missing_sections': missing_sections,
        'improvement_suggestions': improvements,
        'matching_jobs': matching_jobs_list,
        'extracted_profile_updates': extracted_profile_updates,
    }
