from django.db import migrations


class Migration(migrations.Migration):
    dependencies = []

    operations = [
        migrations.RunSQL(
            sql=[
                "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude double precision",
                "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude double precision",
                "ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS latitude double precision",
                "ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS longitude double precision",
                "ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS address text",
                "ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS city text",
                "ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS state text",
                "ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS postal_code text",
            ],
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
