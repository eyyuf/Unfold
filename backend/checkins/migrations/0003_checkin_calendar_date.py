from datetime import timedelta

import django.utils.timezone
from django.db import migrations, models


def backfill_checkin_dates(apps, schema_editor):
    CheckIn = apps.get_model("checkins", "CheckIn")
    for checkin in CheckIn.objects.select_related("user_experiment").iterator():
        checkin.checkin_date = checkin.user_experiment.start_date + timedelta(
            days=checkin.day - 1
        )
        checkin.save(update_fields=["checkin_date"])


class Migration(migrations.Migration):
    dependencies = [
        ("checkins", "0002_remove_checkin_energy_checkin_desire_to_continue_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="checkin",
            name="checkin_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.RunPython(backfill_checkin_dates, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="checkin",
            name="checkin_date",
            field=models.DateField(default=django.utils.timezone.localdate),
        ),
        migrations.AddConstraint(
            model_name="checkin",
            constraint=models.UniqueConstraint(
                fields=("user_experiment", "checkin_date"),
                name="unique_experiment_checkin_date",
            ),
        ),
    ]
