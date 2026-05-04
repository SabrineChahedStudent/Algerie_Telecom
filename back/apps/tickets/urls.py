from django.urls import path
from .views import (TypesServiceView, MesTicketsView, MonTicketDetailView, MesTicketsAgentView, TicketAgentDetailView, TicketsEscaladesView, TousLesTicketsView, AttribuerTicketView, PiecesJointesView, PieceJointeDownloadView, EscaladerTicketView, TicketHistoriqueClientView, ToggleEmailView, HFChatbotView)

urlpatterns = [
    path('types-service/', TypesServiceView.as_view(), name='types-service'),
    path('chat-support/', HFChatbotView.as_view(), name='chat-support'),
    path('mes-tickets/', MesTicketsView.as_view(), name='mes-tickets'),
    path('mes-tickets/<uuid:ticket_id>/', MonTicketDetailView.as_view(), name='mon-ticket-detail'),
    path('agent/mes-tickets/', MesTicketsAgentView.as_view(), name='agent-mes-tickets'),
    path('agent/mes-tickets/<uuid:ticket_id>/', TicketAgentDetailView.as_view(), name='agent-ticket-detail'),
    path('agent/mes-tickets/<uuid:ticket_id>/historique/', TicketHistoriqueClientView.as_view(), name='agent-ticket-historique'),
    path('agent/mes-tickets/<uuid:ticket_id>/escalader/', EscaladerTicketView.as_view(), name='escalader-ticket'),
    path('escalades/', TicketsEscaladesView.as_view(), name='tickets-escalades'),
    path('admin/tous/', TousLesTicketsView.as_view(), name='tous-tickets'),
    path('admin/<uuid:ticket_id>/attribuer/', AttribuerTicketView.as_view(), name='attribuer-ticket'),
    path('<uuid:ticket_id>/pieces-jointes/', PiecesJointesView.as_view(), name='pieces-jointes'),
    path('pieces-jointes/<int:piece_id>/download/', PieceJointeDownloadView.as_view(), name='piece-jointe-download'),
    path('<uuid:ticket_id>/toggle-email/', ToggleEmailView.as_view(), name='toggle-email'),
]