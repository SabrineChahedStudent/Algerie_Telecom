import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer pour le chat en temps réel.
    Chaque ticket a son propre groupe : ticket_{ticket_id}
    """

    async def connect(self):
        self.ticket_id  = self.scope['url_route']['kwargs']['ticket_id']
        self.room_group = f'ticket_{self.ticket_id}'
        self.user       = self.scope['user']

        # Vérifier que l'utilisateur est authentifié
        if not self.user.is_authenticated:
            await self.close()
            return

        # Vérifier l'accès au ticket
        acces = await self.verifier_acces()
        if not acces:
            await self.close()
            return

        # Rejoindre le groupe du ticket
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # Envoyer confirmation de connexion
        await self.send(text_data=json.dumps({
            'type':    'connexion',
            'message': f'Connecté au ticket {self.ticket_id}',
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        """Reçoit un message du WebSocket et le diffuse au groupe"""
        try:
            data    = json.loads(text_data)
            contenu = data.get('contenu', '').strip()

            if not contenu:
                return

            # Sauvegarder le message en BDD
            message = await self.sauvegarder_message(contenu)

            # Diffuser à tous les membres du groupe (ticket)
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type':             'chat_message',
                    'message_id':       message['id'],
                    'contenu':          contenu,
                    'expediteur_id':    str(self.user.id),
                    'expediteur_nom':   self.user.nom,
                    'expediteur_prenom': self.user.prenom,
                    'expediteur_type':  message['expediteur_type'],
                    'created_at':       message['created_at'],
                }
            )
        except json.JSONDecodeError:
            pass

    async def chat_message(self, event):
        """Envoie le message au WebSocket client"""
        await self.send(text_data=json.dumps({
            'type':             'message',
            'message_id':       event['message_id'],
            'contenu':          event['contenu'],
            'expediteur_id':    event['expediteur_id'],
            'expediteur_nom':   event['expediteur_nom'],
            'expediteur_prenom': event['expediteur_prenom'],
            'expediteur_type':  event['expediteur_type'],
            'created_at':       event['created_at'],
        }))

    # ============================================================
    # Méthodes async BDD
    # ============================================================
    @database_sync_to_async
    def verifier_acces(self):
        from apps.tickets.models import Ticket
        try:
            ticket = Ticket.objects.get(id=self.ticket_id)
            user   = self.user
            if user.role == 'client':
                return ticket.client == user
            elif user.role == 'agent':
                return ticket.agent == user
            elif user.role == 'agent_technique':
                return ticket.agent_technique == user or ticket.statut == 'escalade_technique'
            elif user.role == 'agent_annexe':
                return ticket.agent_annexe == user or ticket.statut == 'escalade_annexe'
            elif user.role == 'admin':
                return ticket.centre == user.centre
            return False
        except Ticket.DoesNotExist:
            return False

    @database_sync_to_async
    def sauvegarder_message(self, contenu):
        from apps.chat.models import Message
        role_map = {
            'client':          'client',
            'agent':           'agent',
            'agent_technique': 'agent_technique',
            'agent_annexe':    'agent_annexe',
            'admin':           'agent',
        }
        expediteur_type = role_map.get(self.user.role, 'systeme')

        from apps.tickets.models import Ticket
        ticket = Ticket.objects.get(id=self.ticket_id)

        message = Message.objects.create(
            ticket=ticket,
            expediteur=self.user,
            expediteur_type=expediteur_type,
            contenu=contenu,
            lu_par_client=(self.user.role == 'client'),
            lu_par_agent=(self.user.role != 'client'),
        )

        if self.user.role != 'client' and ticket.statut in ['soumis', 'ouvert']:
            ticket.statut = 'en_cours'
            ticket.save()

        # Relais email : notifier n8n si applicable
        if (self.user.role != 'client' and 
            ticket.source == 'email' and 
            ticket.email_actif and 
            ticket.email_source):
            try:
                import requests as http_requests
                from django.conf import settings as django_settings
                webhook_url = getattr(django_settings, 'N8N_WEBHOOK_URL', '') + 'agent-reply'
                if webhook_url.startswith('http'):
                    http_requests.post(webhook_url, json={
                        'ticket_id': str(ticket.id),
                        'numero_ticket': ticket.numero_ticket,
                        'email_destination': ticket.email_source,
                        'agent_nom': f"{self.user.prenom} {self.user.nom}",
                        'contenu': contenu,
                    }, timeout=5)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Webhook n8n échoué depuis WS: {e}")
            message.via_email = True
            message.save(update_fields=['via_email'])

        return {
            'id':              message.id,
            'expediteur_type': message.expediteur_type,
            'created_at':      message.created_at.isoformat(),
        }