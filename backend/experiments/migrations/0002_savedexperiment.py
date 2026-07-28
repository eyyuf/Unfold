import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("experiments", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SavedExperiment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("experiment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="saved_by", to="experiments.experiment")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="saved_experiments", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "constraints": [
                    models.UniqueConstraint(fields=("user", "experiment"), name="unique_saved_experiment"),
                ],
            },
        ),
    ]
