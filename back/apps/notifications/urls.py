from django.urls import path
from .views import HistoriqueEmailsView, TesterEmailView

urlpatterns = [
    path('historique/',  HistoriqueEmailsView.as_view(), name='historique-emails'),
    path('tester/',      TesterEmailView.as_view(),      name='tester-email'),
]