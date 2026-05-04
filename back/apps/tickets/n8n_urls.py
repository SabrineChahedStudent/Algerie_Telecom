from django.urls import path
from .n8n_views import (
    CheckEmailView, AuthenticateView, CreateTicketView,
    WebhookReplyView, TypesServiceListView, SavePendingView,
)

urlpatterns = [
    path('check-email/',    CheckEmailView.as_view(),      name='n8n-check-email'),
    path('authenticate/',   AuthenticateView.as_view(),    name='n8n-authenticate'),
    path('create-ticket/',  CreateTicketView.as_view(),    name='n8n-create-ticket'),
    path('webhook/reply/',  WebhookReplyView.as_view(),    name='n8n-webhook-reply'),
    path('types-service/',  TypesServiceListView.as_view(), name='n8n-types-service'),
    path('save-pending/',   SavePendingView.as_view(),     name='n8n-save-pending'),
]
