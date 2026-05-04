from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Message
from .serializers import MessageSerializer, EnvoyerMessageSerializer
from apps.tickets.models import Ticket


def get_expediteur_type(user):
    """Retourne le type d'expéditeur selon le rôle"""
    role_map = {
        'client':          'client',
        'agent':           'agent',
        'agent_technique': 'agent_technique',
        'agent_annexe':    'agent_annexe',
        'admin':           'agent',
    }
    return role_map.get(user.role, 'systeme')


def verifier_acces_ticket(user, ticket):
    """Vérifie si l'utilisateur a accès à la discussion du ticket"""
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


# ============================================================
# MESSAGES D'UN TICKET (API REST)
# ============================================================
class MessagesTicketView(APIView):
    permission_classes = [IsAuthenticated]

    def get_ticket(self, ticket_id):
        try:
            return Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, ticket_id):
        """Récupérer tous les messages d'un ticket"""
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if not verifier_acces_ticket(request.user, ticket):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        messages = ticket.messages.all().order_by('created_at')

        # Marquer les messages comme lus
        if request.user.role == 'client':
            messages.filter(lu_par_client=False).exclude(
                expediteur_type='client'
            ).update(lu_par_client=True)
        elif request.user.role in ['agent', 'agent_technique', 'agent_annexe']:
            messages.filter(lu_par_agent=False).exclude(
                expediteur_type__in=['agent', 'agent_technique', 'agent_annexe']
            ).update(lu_par_agent=True)

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, ticket_id):
        """Envoyer un message dans un ticket (avec fichier optionnel)"""
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if not verifier_acces_ticket(request.user, ticket):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        if ticket.statut in ['ferme', 'rejete']:
            return Response(
                {'error': 'Impossible d\'envoyer un message sur un ticket fermé ou rejeté'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EnvoyerMessageSerializer(data=request.data)
        if serializer.is_valid():
            expediteur_type = get_expediteur_type(request.user)

            # Handle file upload if present
            piece_jointe = None
            fichier = request.FILES.get('fichier') or serializer.validated_data.get('fichier')
            if fichier:
                from apps.tickets.models import PieceJointe
                piece_jointe = PieceJointe.objects.create(
                    ticket=ticket,
                    uploaded_by=request.user,
                    nom_fichier=fichier.name,
                    type_mime=fichier.content_type or 'application/octet-stream',
                    taille_octets=fichier.size,
                    contenu=fichier.read(),
                )

            contenu = serializer.validated_data.get('contenu', '').strip()
            if not contenu and piece_jointe:
                contenu = f"📎 {piece_jointe.nom_fichier}"

            # Filtrer les mots inappropriés
            from apps.chat.profanity_filter import censurer_message
            contenu, was_censored = censurer_message(contenu)

            message = Message.objects.create(
                ticket=ticket,
                expediteur=request.user,
                expediteur_type=expediteur_type,
                contenu=contenu,
                piece_jointe=piece_jointe,
                lu_par_client=(request.user.role == 'client'),
                lu_par_agent=(request.user.role != 'client'),
            )
            
            # Changer le statut du ticket si un agent répond
            if request.user.role != 'client' and ticket.statut in ['soumis', 'ouvert']:
                ticket.statut = 'en_cours'
                ticket.save()

            # Relais email : si ticket source=email et email_actif, notifier n8n
            if (request.user.role != 'client' and 
                ticket.source == 'email' and 
                ticket.email_actif and 
                ticket.email_source):
                try:
                    import requests as http_requests
                    from django.conf import settings as django_settings
                    webhook_url = django_settings.N8N_WEBHOOK_URL + 'agent-reply'
                    http_requests.post(webhook_url, json={
                        'ticket_id': str(ticket.id),
                        'numero_ticket': ticket.numero_ticket,
                        'email_destination': ticket.email_source,
                        'agent_nom': f"{request.user.prenom} {request.user.nom}",
                        'contenu': serializer.validated_data['contenu'],
                    }, timeout=5)
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).warning(f"Webhook n8n échoué: {e}")
                message.via_email = True
                message.save(update_fields=['via_email'])

            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# MESSAGES NON LUS
# ============================================================
class MessagesNonLusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Nombre de messages non lus pour l'utilisateur connecté"""
        if request.user.role == 'client':
            count = Message.objects.filter(
                ticket__client=request.user,
                lu_par_client=False,
            ).exclude(expediteur_type='client').count()
        else:
            count = Message.objects.filter(
                ticket__agent=request.user,
                lu_par_agent=False,
            ).exclude(expediteur_type__in=['agent', 'agent_technique', 'agent_annexe']).count()

        return Response({'messages_non_lus': count})


# ============================================================
# RÉSUMÉ IA DE LA DISCUSSION (pour agents technique/annexe)
# ============================================================
class ResumeIAView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        """Génère un résumé intelligent de la discussion d'un ticket"""
        try:
            ticket = Ticket.objects.select_related('client', 'agent', 'type_service').get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if not verifier_acces_ticket(request.user, ticket):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        messages = ticket.messages.all().order_by('created_at')
        escalades = ticket.escalades.all().order_by('-created_at')

        # Construire le résumé
        client_name = f"{ticket.client.prenom} {ticket.client.nom}" if ticket.client else "Inconnu"
        agent_name = f"{ticket.agent.prenom} {ticket.agent.nom}" if ticket.agent else "Non assigné"
        service = ticket.type_service.libelle if ticket.type_service else "Non spécifié"

        # Statistiques de la conversation
        total_msgs = messages.count()
        client_msgs = messages.filter(expediteur_type='client').count()
        agent_msgs = total_msgs - client_msgs

        # Timeline résumée (Informations réduites, le reste est dans la barre)
        timeline = []

        # Résumé des escalades
        for esc in escalades:
            source = f"{esc.agent_source.prenom} {esc.agent_source.nom}" if esc.agent_source else "Inconnu"
            timeline.append(f"🔺 Escalade {esc.type_escalade} par {source} — Motif : {esc.motif}")

        # Extraire les messages clés (premier, dernier du client, dernier de l'agent)
        key_messages = []
        if messages.exists():
            first_msg = messages.first()
            key_messages.append({
                'role': first_msg.expediteur_type,
                'contenu': first_msg.contenu[:200],
                'date': first_msg.created_at.strftime('%d/%m %H:%M'),
                'label': 'Premier message'
            })

            last_client_msg = messages.filter(expediteur_type='client').last()
            if last_client_msg and last_client_msg.id != first_msg.id:
                key_messages.append({
                    'role': 'client',
                    'contenu': last_client_msg.contenu[:200],
                    'date': last_client_msg.created_at.strftime('%d/%m %H:%M'),
                    'label': 'Dernier message client'
                })

            last_agent_msg = messages.exclude(expediteur_type='client').last()
            if last_agent_msg:
                key_messages.append({
                    'role': last_agent_msg.expediteur_type,
                    'contenu': last_agent_msg.contenu[:200],
                    'date': last_agent_msg.created_at.strftime('%d/%m %H:%M'),
                    'label': 'Dernière réponse agent'
                })

        # Génération du résumé textuel (Laissé vide pour l'intégration de l'API externe)
        summary_text = ""

        return Response({
            'resume': summary_text,
            'timeline': timeline,
            'messages_cles': key_messages,
            'stats': {
                'total_messages': total_msgs,
                'messages_client': client_msgs,
                'messages_agent': agent_msgs,
                'duree_jours': (timezone.now() - ticket.created_at).days if ticket.created_at else 0,
            }
        })