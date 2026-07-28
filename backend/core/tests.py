from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from experiments.models import Category, Experiment


class ApiFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        category = Category.objects.create(name="Creative", slug="creative", color="#8B5CF6")
        self.experiment = Experiment.objects.create(
            category=category, title="Photography Walk", slug="photography-walk",
            description="Notice the world through a camera.", duration_days=7,
            minutes_per_day=20, published=True,
        )

    def test_public_experiment_library(self):
        response = self.client.get("/api/v1/experiments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["slug"], "photography-walk")

    def test_authenticated_user_can_start_experiment_and_check_in(self):
        user = User.objects.create_user("person@example.com", "a-secure-password")
        self.client.force_authenticate(user)
        started = self.client.post("/api/v1/experiments/photography-walk/start/", {}, format="json")
        self.assertEqual(started.status_code, 201)
        checkin = self.client.post(
            f"/api/v1/user-experiments/{started.data['id']}/checkins/",
            {"day": 1, "energy": 4, "curiosity": 5, "meaning": 3, "difficulty": 2},
            format="json",
        )
        self.assertEqual(checkin.status_code, 200)
        self.assertEqual(checkin.data["curiosity"], 5)

    def test_registration_creates_session_and_csrf_cookie(self):
        self.client.get("/api/v1/auth/csrf/")
        response = self.client.post(
            "/api/v1/auth/register/",
            {"email": "new@example.com", "password": "a-secure-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email="new@example.com").exists())
        self.assertIn("_auth_user_id", self.client.session)

# Create your tests here.
