"""
ALGÉRIE TÉLÉCOM — ASGI Config (HTTP + WebSocket avec auth JWT)
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from apps.chat.middleware import JWTAuthMiddleware
from apps.chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    # Requêtes HTTP classiques
    'http': django_asgi_app,

    # Connexions WebSocket (chat temps réel) — auth JWT via query string
    'websocket': JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})