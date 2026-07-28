from django.urls import path
from . import views
urlpatterns = [
    path("auth/csrf/", views.csrf_view),
    path("auth/register/", views.register_view), path("auth/login/", views.login_view),
    path("auth/logout/", views.logout_view), path("auth/me/", views.me_view),
    path("experiments/", views.ExperimentList.as_view()),
    path("experiments/<slug:slug>/", views.ExperimentDetail.as_view()),
    path("experiments/<slug:slug>/start/", views.start_experiment),
    path("user-experiments/active/", views.active_experiment),
    path("user-experiments/<int:pk>/checkins/", views.submit_checkin),
    path("user-experiments/<int:pk>/final-reflection/", views.final_reflection),
    path("user-experiments/<int:pk>/report/", views.experiment_report),
    path("insights/", views.insights_view),
    path("evidence-vault/", views.evidence_vault),
]
