"""
ALGÉRIE TÉLÉCOM — JWT Authentication Middleware for Django Channels WebSocket.

Extrait le token JWT depuis le query string (?token=xxx)
et attache l'utilisateur authentifié au scope WebSocket.
"""

from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError


@database_sync_to_async
def get_user_from_token(token_string):
    """Décode le JWT access token et retourne l'utilisateur correspondant."""
    from apps.users.models import Utilisateur
    try:
        token = AccessToken(token_string)
        user_id = token['user_id']
        return Utilisateur.objects.get(id=user_id)
    except (TokenError, Utilisateur.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware Channels qui authentifie les connexions WebSocket via JWT.
    
    Usage dans asgi.py :
        JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
    
    Le frontend se connecte avec :
        new WebSocket('ws://host/ws/chat/123/?token=<access_token>')
    """

    async def __call__(self, scope, receive, send):
        # Extraire le token depuis les query params
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token_list = query_params.get('token', [])

        if token_list:
            scope['user'] = await get_user_from_token(token_list[0])
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
