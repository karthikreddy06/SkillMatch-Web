from django.core.management.base import BaseCommand
from api.models import Jobs, Profiles


DEMO_JOBS = [
    ('Backend Developer', 'Bengaluru', 'TechNova Labs', 'Software / IT', 'Full-time', 'Day', 'Rs 8-14 LPA', ['Python', 'Django', 'PostgreSQL'], ['Build reliable APIs and backend services for a growing product team.'], ['Health insurance', 'Learning budget']),
    ('Data Analyst', 'Hyderabad', 'InsightWorks', 'Software / IT', 'Full-time', 'Day', 'Rs 6-10 LPA', ['SQL', 'Excel', 'Power BI'], ['Turn business data into clear dashboards and decisions.'], ['Hybrid work', 'Flexible hours']),
    ('Mechanical Technician', 'Chennai', 'SouthWorks Manufacturing', 'Manufacturing', 'Full-time', 'Rotating', 'Rs 25,000-35,000/month', ['Mechanical Repair', 'Preventive Maintenance', 'Safety'], ['Maintain production equipment and support preventive maintenance schedules.'], ['Transport support', 'Meal allowance']),
    ('Sales Executive', 'Mumbai', 'Harbor Retail Group', 'Sales', 'Full-time', 'Day', 'Rs 30,000-45,000/month', ['Sales', 'Customer Relationship', 'Negotiation'], ['Build customer relationships and grow territory sales across Mumbai.'], ['Incentives', 'Phone allowance']),
    ('Delivery Executive', 'Delhi', 'QuickRoute Logistics', 'Delivery', 'Part-time', 'Flexible', 'Rs 18,000-30,000/month', ['Driving', 'Navigation', 'Customer Service'], ['Deliver orders safely and on time with flexible shift options.'], ['Fuel support', 'Weekly payouts']),
    ('Machine Operator', 'Pune', 'Precision AutoParts', 'Manufacturing', 'Full-time', 'Night', 'Rs 22,000-32,000/month', ['Machine Operation', 'Quality Control', 'Safety'], ['Operate CNC and assembly equipment while maintaining quality standards.'], ['Overtime pay', 'Transport support']),
    ('Customer Support Executive', 'Kolkata', 'ConnectFirst Services', 'Customer Service', 'Full-time', 'Rotating', 'Rs 20,000-32,000/month', ['Communication', 'Customer Support', 'CRM'], ['Help customers resolve product and service questions over phone and chat.'], ['Paid training', 'Health insurance']),
    ('Hotel Staff', 'Kochi', 'Coastal Stay Hotels', 'Hospitality', 'Full-time', 'Flexible', 'Rs 18,000-28,000/month', ['Hospitality', 'Guest Service', 'Housekeeping'], ['Support front desk and guest services at a busy city hotel.'], ['Staff meals', 'Accommodation assistance']),
    ('Electrician', 'Ahmedabad', 'BrightBuild Facilities', 'Skilled Trades', 'Full-time', 'Day', 'Rs 25,000-38,000/month', ['Electrical Repair', 'Wiring', 'Maintenance'], ['Install, inspect, and repair electrical systems at commercial sites.'], ['Safety gear', 'Travel allowance']),
    ('Graphic Designer', 'Jaipur', 'Craftline Creative Studio', 'Freelance / Gig', 'Contract', 'Flexible', 'Rs 35,000-60,000/month', ['Graphic Design', 'Figma', 'Adobe Creative Suite'], ['Create campaign visuals and social media assets for local brands.'], ['Remote flexibility', 'Project bonuses']),
    ('Warehouse Associate', 'Lucknow', 'NorthStar Fulfilment', 'Driving / Logistics', 'Full-time', 'Night', 'Rs 19,000-28,000/month', ['Inventory', 'Packing', 'Warehouse Operations'], ['Pick, pack, and stage shipments in a high-volume fulfilment centre.'], ['Transport support', 'Attendance bonus']),
    ('Field Technician', 'Visakhapatnam', 'FieldGrid Energy', 'Skilled Trades', 'Full-time', 'Day', 'Rs 24,000-36,000/month', ['Field Service', 'Troubleshooting', 'Customer Service'], ['Install and service equipment at customer and industrial locations.'], ['Travel allowance', 'Training']),
    ('CNC Operator', 'Coimbatore', 'Kovai Engineering Works', 'Manufacturing', 'Full-time', 'Rotating', 'Rs 24,000-36,000/month', ['CNC', 'Technical Drawing', 'Quality Control'], ['Set up CNC machines and inspect precision components.'], ['Overtime pay', 'Meal allowance']),
    ('Retail Associate', 'Vijayawada', 'Everyday Market', 'Retail', 'Part-time', 'Flexible', 'Rs 16,000-24,000/month', ['Retail Sales', 'Billing', 'Customer Service'], ['Assist shoppers, manage billing, and keep the store floor organised.'], ['Flexible shifts', 'Staff discounts']),
    ('HR Executive', 'Gurugram', 'PeopleFirst Technologies', 'Office / Administration', 'Full-time', 'Day', 'Rs 5-8 LPA', ['Recruitment', 'HR Operations', 'Communication'], ['Coordinate hiring, onboarding, and employee operations for a growing team.'], ['Hybrid work', 'Learning budget']),
    ('Software Engineer', 'Noida', 'CloudBridge Systems', 'Software / IT', 'Full-time', 'Flexible', 'Rs 8-16 LPA', ['JavaScript', 'React', 'REST APIs'], ['Ship accessible product features with a collaborative engineering team.'], ['Remote days', 'Health insurance']),
    ('Accountant', 'Indore', 'Central Ledger Partners', 'Office / Administration', 'Full-time', 'Day', 'Rs 28,000-42,000/month', ['Accounting', 'Tally', 'Excel'], ['Manage invoices, reconciliations, and monthly reporting for clients.'], ['Professional development', 'Paid leave']),
    ('Healthcare Assistant', 'Bhubaneswar', 'CarePoint Clinics', 'Healthcare', 'Full-time', 'Rotating', 'Rs 20,000-30,000/month', ['Patient Care', 'Healthcare', 'Communication'], ['Support patients and clinical staff with compassionate day-to-day care.'], ['Meal allowance', 'Health insurance']),
]


class Command(BaseCommand):
    help = 'Create missing non-destructive demo jobs across Indian cities.'

    def handle(self, *args, **options):
        employer = Profiles.objects.filter(role='employer').order_by('updated_at', 'id').first()
        if not employer:
            self.stderr.write(self.style.ERROR('No employer profile exists. Create an employer account first.'))
            return

        created = 0
        skipped = 0
        for title, location, company, category, job_type, shift, salary, skills, requirements, benefits in DEMO_JOBS:
            _, was_created = Jobs.objects.get_or_create(
                title=title,
                location=location,
                company_name=company,
                defaults={
                    'employer': employer,
                    'description': f'{category} opportunity. {requirements[0]}',
                    'salary_range': salary,
                    'job_type': job_type,
                    'requirements': requirements,
                    'skills': skills,
                    'benefits': benefits,
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
                skipped += 1

        self.stdout.write(self.style.SUCCESS(f'Demo jobs ready: {created} created, {skipped} already existed.'))
