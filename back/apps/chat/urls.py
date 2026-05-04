from django.urls import path
from .views import MessagesTicketView, MessagesNonLusView, ResumeIAView

urlpatterns = [
    # Messages d'un ticket (API REST)
    path('<uuid:ticket_id>/messages/',  MessagesTicketView.as_view(), name='messages-ticket'),

    # Résumé IA d'un ticket
    path('<uuid:ticket_id>/resume-ia/', ResumeIAView.as_view(), name='resume-ia'),

    # Messages non lus
    path('non-lus/',                    MessagesNonLusView.as_view(), name='messages-non-lus'),
]