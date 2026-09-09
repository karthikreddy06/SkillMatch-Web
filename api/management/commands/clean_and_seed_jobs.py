from django.core.management.base import BaseCommand
from django.db.models import Q
from api.models import Applications, Jobs, Profiles, RecentlyViewed, SavedJobs


WORKPLACE_FIXES = {
    'Bengaluru': ('Koramangala, Bengaluru, Karnataka 560034', 'Bengaluru', 'Karnataka', '560034', 12.9352, 77.6245),
    'Hyderabad': ('HITEC City, Hyderabad, Telangana 500081', 'Hyderabad', 'Telangana', '500081', 17.4474, 78.3762),
    'Chennai': ('OMR, Chennai, Tamil Nadu 600096', 'Chennai', 'Tamil Nadu', '600096', 12.9863, 80.2425),
    'Mumbai': ('Bandra Kurla Complex, Mumbai, Maharashtra 400051', 'Mumbai', 'Maharashtra', '400051', 19.0607, 72.8656),
    'Delhi': ('Connaught Place, New Delhi, Delhi 110001', 'Delhi', 'Delhi', '110001', 28.6315, 77.2167),
    'Pune': ('Hinjewadi Phase 1, Pune, Maharashtra 411057', 'Pune', 'Maharashtra', '411057', 18.5913, 73.7389),
    'Kolkata': ('Salt Lake Sector V, Kolkata, West Bengal 700091', 'Kolkata', 'West Bengal', '700091', 22.5726, 88.3639),
    'Kochi': ('Kakkanad, Kochi, Kerala 682030', 'Kochi', 'Kerala', '682030', 10.0159, 76.3419),
    'Ahmedabad': ('SG Highway, Ahmedabad, Gujarat 380054', 'Ahmedabad', 'Gujarat', '380054', 23.0395, 72.5117),
    'Jaipur': ('C Scheme, Jaipur, Rajasthan 302001', 'Jaipur', 'Rajasthan', '302001', 26.9124, 75.7873),
    'Lucknow': ('Gomti Nagar, Lucknow, Uttar Pradesh 226010', 'Lucknow', 'Uttar Pradesh', '226010', 26.8467, 80.9462),
    'Visakhapatnam': ('MVP Colony, Visakhapatnam, Andhra Pradesh 530017', 'Visakhapatnam', 'Andhra Pradesh', '530017', 17.6868, 83.2185),
    'Coimbatore': ('Peelamedu, Coimbatore, Tamil Nadu 641004', 'Coimbatore', 'Tamil Nadu', '641004', 11.0168, 76.9558),
    'Vijayawada': ('Benz Circle, Vijayawada, Andhra Pradesh 520010', 'Vijayawada', 'Andhra Pradesh', '520010', 16.5062, 80.6480),
    'Gurugram': ('Cyber Hub, Gurugram, Haryana 122002', 'Gurugram', 'Haryana', '122002', 28.4595, 77.0266),
    'Noida': ('Sector 62, Noida, Uttar Pradesh 201309', 'Noida', 'Uttar Pradesh', '201309', 28.6270, 77.3760),
    'Indore': ('Vijay Nagar, Indore, Madhya Pradesh 452010', 'Indore', 'Madhya Pradesh', '452010', 22.7533, 75.8937),
    'Bhubaneswar': ('Saheed Nagar, Bhubaneswar, Odisha 751007', 'Bhubaneswar', 'Odisha', '751007', 20.2961, 85.8245),
}

DEMO_JOBS = [
    ('Backend Developer', 'Bengaluru', 'TechNova Labs', 'Software / IT', 'Full-time', 'Day', 'Rs 8-14 LPA', ['Python', 'Django', 'PostgreSQL']),
    ('Data Analyst', 'Hyderabad', 'InsightWorks', 'Software / IT', 'Full-time', 'Day', 'Rs 6-10 LPA', ['SQL', 'Excel', 'Power BI']),
    ('Mechanical Technician', 'Chennai', 'SouthWorks Manufacturing', 'Manufacturing', 'Full-time', 'Rotating', 'Rs 25,000-35,000/month', ['Mechanical Repair', 'Preventive Maintenance', 'Safety']),
    ('Sales Executive', 'Mumbai', 'Harbor Retail Group', 'Sales', 'Full-time', 'Day', 'Rs 30,000-45,000/month', ['Sales', 'Customer Relationship', 'Negotiation']),
    ('Delivery Driver', 'Delhi', 'QuickRoute Logistics', 'Driving / Logistics', 'Part-time', 'Flexible', 'Rs 18,000-30,000/month', ['Driving', 'Navigation', 'Customer Service']),
    ('Machine Operator', 'Pune', 'Precision AutoParts', 'Manufacturing', 'Full-time', 'Night', 'Rs 22,000-32,000/month', ['Machine Operation', 'Quality Control', 'Safety']),
    ('Customer Support Executive', 'Kolkata', 'ConnectFirst Services', 'Customer Service', 'Full-time', 'Rotating', 'Rs 20,000-32,000/month', ['Communication', 'Customer Support', 'CRM']),
    ('Hotel Staff', 'Kochi', 'Coastal Stay Hotels', 'Hospitality', 'Full-time', 'Flexible', 'Rs 18,000-28,000/month', ['Hospitality', 'Guest Service', 'Housekeeping']),
    ('Electrician', 'Ahmedabad', 'BrightBuild Facilities', 'Skilled Trades', 'Full-time', 'Day', 'Rs 25,000-38,000/month', ['Electrical Repair', 'Wiring', 'Maintenance']),
    ('Graphic Designer', 'Jaipur', 'Craftline Creative Studio', 'Other', 'Contract', 'Flexible', 'Rs 35,000-60,000/month', ['Graphic Design', 'Figma', 'Adobe Creative Suite']),
    ('Warehouse Associate', 'Lucknow', 'NorthStar Fulfilment', 'Driving / Logistics', 'Full-time', 'Night', 'Rs 19,000-28,000/month', ['Inventory', 'Packing', 'Warehouse Operations']),
    ('Field Technician', 'Visakhapatnam', 'FieldGrid Energy', 'Skilled Trades', 'Full-time', 'Day', 'Rs 24,000-36,000/month', ['Field Service', 'Troubleshooting', 'Customer Service']),
    ('CNC Operator', 'Coimbatore', 'Kovai Engineering Works', 'Manufacturing', 'Full-time', 'Rotating', 'Rs 24,000-36,000/month', ['CNC', 'Technical Drawing', 'Quality Control']),
    ('Retail Associate', 'Vijayawada', 'Everyday Market', 'Retail', 'Part-time', 'Flexible', 'Rs 16,000-24,000/month', ['Retail Sales', 'Billing', 'Customer Service']),
    ('HR Executive', 'Gurugram', 'PeopleFirst Technologies', 'Office / Administration', 'Full-time', 'Day', 'Rs 5-8 LPA', ['Recruitment', 'HR Operations', 'Communication']),
    ('Software Engineer', 'Noida', 'CloudBridge Systems', 'Software / IT', 'Full-time', 'Flexible', 'Rs 8-16 LPA', ['JavaScript', 'React', 'REST APIs']),
    ('Accountant', 'Indore', 'Central Ledger Partners', 'Office / Administration', 'Full-time', 'Day', 'Rs 28,000-42,000/month', ['Accounting', 'Tally', 'Excel']),
    ('Healthcare Assistant', 'Bhubaneswar', 'CarePoint Clinics', 'Healthcare', 'Full-time', 'Rotating', 'Rs 20,000-30,000/month', ['Patient Care', 'Healthcare', 'Communication']),
    ('Office Administrator', 'Bengaluru', 'PeopleDesk Services', 'Office / Administration', 'Full-time', 'Day', 'Rs 28,000-40,000/month', ['Administration', 'Excel', 'Communication']),
    ('Marketing Executive', 'Hyderabad', 'MarketSpring India', 'Marketing', 'Full-time', 'Flexible', 'Rs 35,000-55,000/month', ['Marketing', 'Social Media', 'Analytics']),
    ('Care Assistant', 'Kochi', 'CarePoint Clinics', 'Healthcare', 'Full-time', 'Rotating', 'Rs 20,000-30,000/month', ['Patient Care', 'First Aid', 'Communication']),
    ('Front Desk Executive', 'Mumbai', 'Harbor Stay Hotels', 'Hospitality', 'Full-time', 'Rotating', 'Rs 25,000-38,000/month', ['Front Desk', 'Guest Service', 'Communication']),
    ('Plumber', 'Pune', 'BrightBuild Facilities', 'Skilled Trades', 'Full-time', 'Day', 'Rs 24,000-36,000/month', ['Plumbing', 'Repair', 'Maintenance']),
    ('Security Guard', 'Noida', 'SafeGate Services', 'Other', 'Full-time', 'Night', 'Rs 20,000-28,000/month', ['Security', 'Safety', ' vigilancia']),
    ('Teacher', 'Jaipur', 'LearnBridge Academy', 'Education', 'Full-time', 'Day', 'Rs 30,000-50,000/month', ['Teaching', 'Classroom Management', 'Communication']),
]


class Command(BaseCommand):
    help = 'Safely repair referenced invalid jobs, delete unused invalid jobs, and seed fully located demo jobs.'

    def handle(self, *args, **options):
        employer = Profiles.objects.filter(role='employer').order_by('updated_at', 'id').first()
        if not employer:
            self.stderr.write(self.style.ERROR('No employer profile exists.'))
            return

        repaired = deleted = created = existing = 0
        invalid = Jobs.objects.filter(Q(latitude__isnull=True) | Q(longitude__isnull=True))
        for job in invalid:
            city_key = next((key for key in WORKPLACE_FIXES if key.lower() in (job.location or '').lower()), None)
            application_count = Applications.objects.filter(job=job).count()
            saved_count = SavedJobs.objects.filter(job=job).count()
            viewed_count = RecentlyViewed.objects.filter(job=job).count()
            if application_count or saved_count or viewed_count:
                if city_key:
                    address, city, state, postal_code, latitude, longitude = WORKPLACE_FIXES[city_key]
                    Jobs.objects.filter(id=job.id).update(address=address, city=city, state=state, postal_code=postal_code, latitude=latitude, longitude=longitude, location=address)
                    repaired += 1
                else:
                    self.stderr.write(self.style.WARNING(f'Preserved referenced job without a known location: {job.id}'))
            else:
                job.delete()
                deleted += 1

        for title, city_key, company, category, job_type, shift, salary, skills in DEMO_JOBS:
            address, city, state, postal_code, latitude, longitude = WORKPLACE_FIXES[city_key]
            _, was_created = Jobs.objects.get_or_create(
                title=title,
                company_name=company,
                defaults={
                    'employer': employer,
                    'description': f'{category} opportunity at {company}. Join a team where your skills create visible impact.',
                    'location': address,
                    'address': address,
                    'city': city,
                    'state': state,
                    'postal_code': postal_code,
                    'latitude': latitude,
                    'longitude': longitude,
                    'salary_range': salary,
                    'job_type': job_type,
                    'requirements': [f'Hands-on experience in {skills[0]}', 'Reliable communication and commitment to quality'],
                    'skills': skills,
                    'benefits': ['Training and development', 'Professional support'],
                    'status': 'active',
                    'hours_per_week': '40' if job_type == 'Full-time' else '24',
                    'shift_preference': shift,
                    'is_flexible': shift == 'Flexible',
                    'start_date': 'Immediate',
                },
            )
            if was_created:
                created += 1
            else:
                existing += 1

        self.stdout.write(self.style.SUCCESS(f'Location cleanup complete: {repaired} repaired, {deleted} unused invalid jobs deleted, {created} demo jobs created, {existing} already valid.'))
