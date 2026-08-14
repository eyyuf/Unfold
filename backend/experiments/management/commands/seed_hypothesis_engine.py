import os

from django.core.management.base import BaseCommand
from accounts.models import User
from experiments.models import Experiment, ExperimentTrait, ExperimentTraitWeight
from insights.models import PatternDefinition


class Command(BaseCommand):
    help = "Seeds experiment traits, weights, and pattern definitions. Optionally creates an admin from environment variables."

    def handle(self, *args, **kwargs):
        admin_email = os.environ.get("UNFOLD_ADMIN_EMAIL")
        admin_password = os.environ.get("UNFOLD_ADMIN_PASSWORD")
        if admin_email and admin_password:
            admin_user, _created = User.objects.get_or_create(
                email=admin_email,
                defaults={"is_staff": True, "is_superuser": True, "display_name": "Admin"},
            )
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.set_password(admin_password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Environment-configured admin ready: {admin_email}"))
        elif admin_email or admin_password:
            self.stdout.write(self.style.WARNING("Admin creation skipped: set both UNFOLD_ADMIN_EMAIL and UNFOLD_ADMIN_PASSWORD."))
        traits_data = [
            ("creative", "Creative", "Creative activities repeatedly produce positive signals for you."),
            ("technical", "Technical", "Technical & analytical tasks suit your problem-solving style."),
            ("social", "Social", "Connecting and interacting with others boosts your energy."),
            ("solitary", "Solitary", "Working independently allows you to focus deeply."),
            ("collaborative", "Collaborative", "Co-creating in team settings resonates with you."),
            ("teaching", "Teaching", "Explaining concepts to others produces positive signals."),
            ("learning", "Learning", "Absorbing new knowledge and skills drives your curiosity."),
            ("tangible_output", "Tangible Output", "You seem especially engaged when you create something with a visible final result."),
            ("abstract_problem_solving", "Abstract Problem Solving", "Solving conceptual & logic problems fits your thinking style."),
            ("leadership", "Leadership", "Guiding and directing activities resonates with you."),
            ("service", "Service", "Helping and serving others provides a strong sense of meaning."),
            ("physical", "Physical", "Physical activity and movement enhance your energy."),
            ("outdoors", "Outdoors", "Activities taking place in nature produce positive signals."),
            ("planning", "Planning", "Organizing and structuring plans fits your approach."),
            ("storytelling", "Storytelling", "Crafting narratives and sharing ideas engages you."),
            ("visual_creation", "Visual Creation", "Creating visual art or imagery brings strong satisfaction."),
            ("writing", "Writing", "Expressing ideas through writing aligns well with your flow."),
            ("speaking", "Speaking", "Verbal communication and presentation fit your strengths."),
            ("building", "Building", "Constructing or coding structures gives you a sense of accomplishment."),
            ("exploration", "Exploration", "Exploring new ideas or places sparks your curiosity."),
            ("autonomy", "Autonomy", "Having freedom and control over your workflow produces positive energy."),
            ("structured", "Structured", "Clear guidelines and structured routines help you stay consistent."),
        ]

        created_traits = {}
        for slug, name, pos_text in traits_data:
            trait, created = ExperimentTrait.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": f"Trait representing {name.lower()} activities.",
                    "positive_hypothesis_text": pos_text,
                    "negative_hypothesis_text": f"{name} activities have not consistently produced positive signals yet.",
                    "is_active": True,
                },
            )
            created_traits[slug] = trait
            action = "Created" if created else "Existing"
            self.stdout.write(f"{action} trait: {name}")

        # Trait weights for starter experiments
        experiment_weights = {
            "photography-walk": {
                "creative": 5, "visual_creation": 5, "outdoors": 4, "tangible_output": 4, "exploration": 4, "solitary": 3
            },
            "write-one-page": {
                "creative": 5, "writing": 5, "solitary": 4, "tangible_output": 4, "autonomy": 4, "storytelling": 3
            },
            "teach-someone": {
                "teaching": 5, "service": 4, "social": 4, "speaking": 4, "learning": 3, "leadership": 2
            },
            "code-a-small-project": {
                "technical": 5, "abstract_problem_solving": 5, "learning": 4, "solitary": 4, "building": 2, "structured": 3
            },
            "morning-nature-walk": {
                "outdoors": 5, "physical": 3, "exploration": 4, "solitary": 4, "autonomy": 4
            },
            "strength-training": {
                "physical": 5, "structured": 4, "autonomy": 3, "learning": 2
            },
        }

        for exp_slug, weights in experiment_weights.items():
            try:
                exp = Experiment.objects.get(slug=exp_slug)
            except Experiment.DoesNotExist:
                # Try matching by partial slug
                exp = Experiment.objects.filter(slug__icontains=exp_slug.split("-")[0]).first()
                if not exp:
                    continue

            for trait_slug, weight_val in weights.items():
                if trait_slug in created_traits:
                    ExperimentTraitWeight.objects.update_or_create(
                        experiment=exp,
                        trait=created_traits[trait_slug],
                        defaults={"weight": weight_val},
                    )
            self.stdout.write(self.style.SUCCESS(f"Assigned trait weights to experiment '{exp.title}'"))

        # Seed PatternDefinitions
        pattern_configs = [
            {
                "slug": "creative-visible-output",
                "title": "Creating Visible Results",
                "description": "Combination pattern of creative expression with concrete tangible output.",
                "traits": ["creative", "tangible_output"],
                "positive_text": "You consistently respond well to activities where you create something you can see, review, or share.",
            },
            {
                "slug": "independent-problem-solving",
                "title": "Independent Problem Solving",
                "description": "Combination pattern of autonomous solitary work and technical/abstract problem solving.",
                "traits": ["solitary", "abstract_problem_solving"],
                "positive_text": "You work best when tackling complex problems autonomously without frequent interruptions.",
            },
        ]

        for pconf in pattern_configs:
            pat, _created = PatternDefinition.objects.get_or_create(
                slug=pconf["slug"],
                defaults={
                    "title": pconf["title"],
                    "description": pconf["description"],
                    "positive_text": pconf["positive_text"],
                    "min_experiments": 2,
                    "min_fit_score": 70,
                    "is_active": True,
                },
            )
            matching_traits = [created_traits[ts] for ts in pconf["traits"] if ts in created_traits]
            pat.traits.set(matching_traits)
            self.stdout.write(self.style.SUCCESS(f"Seeded pattern definition: '{pat.title}'"))

        self.stdout.write(self.style.SUCCESS("Hypothesis engine seed completed successfully!"))
