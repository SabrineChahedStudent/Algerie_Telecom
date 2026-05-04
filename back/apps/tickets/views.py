from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Ticket, TypeService, PieceJointe, Escalade
from .serializers import (TypeServiceSerializer, CreerTicketSerializer, TicketListSerializer, TicketDetailSerializer, MettreAJourTicketSerializer, SatisfactionSerializer, PieceJointeUploadSerializer, CreerEscaladeSerializer, EscaladeSerializer)
from apps.users.permissions import EstClient, EstAgent, EstAgentEscalade, EstAdmin, EstAgentOuPlus


class TypesServiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Auto-heal: Ensure default types exist if database is empty or partially empty
        if TypeService.objects.count() < 6:
            default_types = [
                {'id': 1, 'code': 'ADSL', 'libelle': 'Internet ADSL'},
                {'id': 2, 'code': 'FIBER', 'libelle': 'Internet Fiber'},
                {'id': 3, 'code': 'FIXE', 'libelle': 'Téléphonie Fixe'},
                {'id': 4, 'code': '4GLTE', 'libelle': '4G LTE'},
                {'id': 5, 'code': 'IPTV', 'libelle': 'IPTV'},
                {'id': 6, 'code': 'AUTRE', 'libelle': 'Autre'},
            ]
            for t in default_types:
                TypeService.objects.get_or_create(id=t['id'], defaults={
                    'code': t['code'],
                    'libelle': t['libelle'],
                    'priorite_defaut': 2
                })
                
        types = TypeService.objects.filter(actif=True)
        return Response(TypeServiceSerializer(types, many=True).data)


class MesTicketsView(APIView):
    permission_classes = [IsAuthenticated, EstClient]

    def get(self, request):
        tickets = Ticket.objects.filter(client=request.user).order_by('-created_at')
        return Response(TicketListSerializer(tickets, many=True).data)

    def post(self, request):
        serializer = CreerTicketSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            ticket = serializer.save()
            return Response(TicketDetailSerializer(ticket).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MonTicketDetailView(APIView):
    permission_classes = [IsAuthenticated, EstClient]

    def get_ticket(self, ticket_id, client):
        try:
            return Ticket.objects.get(id=ticket_id, client=client)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, ticket_id):
        ticket = self.get_ticket(ticket_id, request.user)
        if not ticket:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TicketDetailSerializer(ticket).data)

    def post(self, request, ticket_id):
        ticket = self.get_ticket(ticket_id, request.user)
        if not ticket:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)
        if ticket.statut not in ['resolu', 'ferme']:
            return Response({'error': 'Vous ne pouvez noter que les tickets résolus ou fermés'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = SatisfactionSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, ticket_id):
        ticket = self.get_ticket(ticket_id, request.user)
        if not ticket:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)
        if ticket.statut != 'soumis':
            return Response({'error': 'Seuls les tickets non ouverts (soumis) peuvent être supprimés.'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.delete()
        return Response({'message': 'Ticket supprimé avec succès.'}, status=status.HTTP_204_NO_CONTENT)


class MesTicketsAgentView(APIView):
    permission_classes = [IsAuthenticated, EstAgent]

    def get(self, request):
        tickets = Ticket.objects.filter(agent=request.user).order_by('-created_at')
        return Response(TicketListSerializer(tickets, many=True).data)


class TicketAgentDetailView(APIView):
    permission_classes = [IsAuthenticated, EstAgentOuPlus]

    def get_ticket(self, ticket_id, agent):
        try:
            if agent.role == 'agent':
                return Ticket.objects.get(id=ticket_id, agent=agent)
            elif agent.role == 'agent_technique':
                return Ticket.objects.get(id=ticket_id, centre=agent.centre, statut='escalade_technique')
            elif agent.role == 'agent_annexe':
                return Ticket.objects.get(id=ticket_id, centre=agent.centre, statut='escalade_annexe')
            return None
        except Ticket.DoesNotExist:
            return None

    def get(self, request, ticket_id):
        ticket = self.get_ticket(ticket_id, request.user)
        if not ticket:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TicketDetailSerializer(ticket).data)

    def put(self, request, ticket_id):
        ticket = self.get_ticket(ticket_id, request.user)
        if not ticket:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MettreAJourTicketSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(TicketDetailSerializer(ticket).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketsEscaladesView(APIView):
    permission_classes = [IsAuthenticated, EstAgentEscalade]

    def get(self, request):
        if request.user.role == 'agent_technique':
            tickets = Ticket.objects.filter(centre=request.user.centre, statut='escalade_technique').order_by('-created_at')
        else:
            tickets = Ticket.objects.filter(centre=request.user.centre, statut='escalade_annexe').order_by('-created_at')
        return Response(TicketListSerializer(tickets, many=True).data)


class TicketHistoriqueClientView(APIView):
    permission_classes = [IsAuthenticated, EstAgent]

    def get(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id, agent=request.user)
            historique = Ticket.objects.filter(client=ticket.client).exclude(id=ticket.id).order_by('-created_at')
            return Response(TicketListSerializer(historique, many=True).data)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)


class TousLesTicketsView(APIView):
    permission_classes = [IsAuthenticated, EstAdmin]

    def get(self, request):
        tickets = Ticket.objects.filter(centre=request.user.centre).order_by('-created_at')
        statut = request.query_params.get('statut')
        priorite = request.query_params.get('priorite')
        agent_id = request.query_params.get('agent_id')
        service = request.query_params.get('service')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if statut:
            tickets = tickets.filter(statut=statut)
        if priorite:
            tickets = tickets.filter(priorite=priorite)
        if agent_id:
            tickets = tickets.filter(agent__id=agent_id)
        if service:
            tickets = tickets.filter(type_service__libelle__iexact=service)
        if start_date:
            tickets = tickets.filter(created_at__gte=start_date + 'T00:00:00Z')
        if end_date:
            tickets = tickets.filter(created_at__lte=end_date + 'T23:59:59Z')

        return Response(TicketListSerializer(tickets, many=True).data)


class AttribuerTicketView(APIView):
    permission_classes = [IsAuthenticated, EstAdmin]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id, centre=request.user.centre)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)

        agent_id = request.data.get('agent_id')
        if not agent_id:
            return Response({'error': 'agent_id requis'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.users.models import Utilisateur, Role
        try:
            agent = Utilisateur.objects.get(id=agent_id, centre=request.user.centre, role=Role.AGENT, actif=True)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Agent introuvable'}, status=status.HTTP_404_NOT_FOUND)

        from django.utils import timezone
        ticket.agent = agent
        ticket.statut = 'en_cours'
        ticket.pris_en_charge_a = timezone.now()
        ticket.attribution_auto = False
        ticket.save()
        return Response(TicketDetailSerializer(ticket).data)


class PiecesJointesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PieceJointeUploadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(ticket=ticket, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PieceJointeDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, piece_id):
        try:
            piece = PieceJointe.objects.get(id=piece_id)
        except PieceJointe.DoesNotExist:
            return Response({'error': 'Fichier introuvable'}, status=status.HTTP_404_NOT_FOUND)

        from django.http import HttpResponse
        response = HttpResponse(bytes(piece.contenu), content_type=piece.type_mime)
        response['Content-Disposition'] = f'inline; filename="{piece.nom_fichier}"'
        return response


class EscaladerTicketView(APIView):
    permission_classes = [IsAuthenticated, EstAgent]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id, agent=request.user)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CreerEscaladeSerializer(data=request.data, context={'ticket': ticket, 'request': request})
        if serializer.is_valid():
            escalade = serializer.save()
            return Response(EscaladeSerializer(escalade).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ToggleEmailView(APIView):
    """Active/désactive le relais email pour un ticket source=email"""
    permission_classes = [IsAuthenticated, EstAgentOuPlus]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if ticket.source != 'email':
            return Response({'error': 'Ce ticket n\'est pas un ticket email'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.email_actif = not ticket.email_actif
        ticket.save(update_fields=['email_actif'])
        return Response({
            'email_actif': ticket.email_actif,
            'message': f"Relais email {'activé' if ticket.email_actif else 'désactivé'}"
        })

class HFChatbotView(APIView):
    permission_classes = [IsAuthenticated, EstClient]

    def post(self, request):
        from .hf_triage import run_hf_triage
        service_name = request.data.get('service_name', 'Inconnu')
        issue_description = request.data.get('description', '')
        chat_history = request.data.get('history', 'Aucun')
        
        result = run_hf_triage(service_name, issue_description, chat_history)
        return Response(result, status=status.HTTP_200_OK)