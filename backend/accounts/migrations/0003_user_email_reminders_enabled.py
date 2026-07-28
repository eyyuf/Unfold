from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_user_privacy_and_onboarding"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email_reminders_enabled",
            field=models.BooleanField(default=True),
        ),
    ]
