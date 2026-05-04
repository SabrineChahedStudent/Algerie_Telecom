"""
ALGÉRIE TÉLÉCOM — URLs principales
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [

    # Django Admin (création des comptes admin)
    path('admin/', admin.site.urls),

    # Auth JWT
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Apps
    path('api/users/',         include('apps.users.urls')),
    path('api/centres/',       include('apps.centres.urls')),
    path('api/tickets/',       include('apps.tickets.urls')),
    path('api/chat/',          include('apps.chat.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/rapports/',      include('apps.rapports.urls')),
    path('api/n8n/',           include('apps.tickets.n8n_urls')),
]