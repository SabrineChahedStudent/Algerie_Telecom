from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import CentreDistribution, ParametresCentre
from .serializers import CentreDistributionSerializer, ParametresCentreSerializer
from apps.users.permissions import EstAdmin


# ============================================================
# LISTE ET CRÉATION DES CENTRES
# ============================================================
class CentresView(APIView):
    permission_classes = [IsAuthenticated, EstAdmin]

    def get(self, request):
        """Liste tous les centres"""
        centres = CentreDistribution.objects.filter(actif=True)
        serializer = CentreDistributionSerializer(centres, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Créer un nouveau centre"""
        serializer = CentreDistributionSerializer(data=request.data)
        if serializer.is_valid():
            centre = serializer.save()
            # Créer les paramètres par défaut pour ce centre
            ParametresCentre.objects.create(centre=centre)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# DÉTAIL D'UN CENTRE
# ============================================================
class CentreDetailView(APIView):
    permission_classes = [IsAuthenticated, EstAdmin]

    def get_centre(self, centre_id):
        try:
            return CentreDistribution.objects.get(id=centre_id)
        except CentreDistribution.DoesNotExist:
            return None

    def get(self, request, centre_id):
        centre = self.get_centre(centre_id)
        if not centre:
            return Response({'error': 'Centre introuvable'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CentreDistributionSerializer(centre)
        return Response(serializer.data)

    def put(self, request, centre_id):
        centre = self.get_centre(centre_id)
        if not centre:
            return Response({'error': 'Centre introuvable'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CentreDistributionSerializer(centre, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, centre_id):
        """Désactiver un centre"""
        centre = self.get_centre(centre_id)
        if not centre:
            return Response({'error': 'Centre introuvable'}, status=status.HTTP_404_NOT_FOUND)
        centre.actif = False
        centre.save()
        return Response({'message': 'Centre désactivé avec succès'})


# ============================================================
# PARAMÈTRES DU CENTRE DE L'ADMIN
# ============================================================
class ParametresCentreView(APIView):
    permission_classes = [IsAuthenticated, EstAdmin]

    def get(self, request):
        """Voir les paramètres du centre de l'admin connecté"""
        if not request.user.centre:
            return Response(
                {'error': 'Vous n\'êtes rattaché à aucun centre'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            parametres = ParametresCentre.objects.get(centre=request.user.centre)
        except ParametresCentre.DoesNotExist:
            # Créer les paramètres par défaut si inexistants
            parametres = ParametresCentre.objects.create(centre=request.user.centre)

        serializer = ParametresCentreSerializer(parametres)
        return Response(serializer.data)

    def put(self, request):
        """Modifier les paramètres du centre"""
        if not request.user.centre:
            return Response(
                {'error': 'Vous n\'êtes rattaché à aucun centre'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            parametres = ParametresCentre.objects.get(centre=request.user.centre)
        except ParametresCentre.DoesNotExist:
            parametres = ParametresCentre.objects.create(centre=request.user.centre)

        was_manual = not parametres.attribution_auto_active

        serializer = ParametresCentreSerializer(parametres, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)

            # Si on réactive le mode auto, assigner tous les tickets non-assignés
            now_auto = serializer.instance.attribution_auto_active
            if was_manual and now_auto:
                self._assign_pending_tickets(request.user.centre)

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _assign_pending_tickets(self, centre):
        """Assigne automatiquement tous les tickets sans agent du centre."""
        from apps.tickets.models import Ticket
        from apps.users.models import Utilisateur, Role

        agents = Utilisateur.objects.filter(centre=centre, role=Role.AGENT, actif=True)
        if not agents.exists():
            return

        pending = Ticket.objects.filter(
            centre=centre,
            agent__isnull=True,
            statut__in=['soumis', 'ouvert']
        ).order_by('created_at')

        for ticket in pending:
            agent_min = min(
                agents,
                key=lambda a: a.tickets_agent.filter(
                    statut__in=['ouvert', 'en_cours']
                ).count()
            )
            ticket.agent = agent_min
            ticket.attribution_auto = True
            ticket.save()


# ============================================================
# MON CENTRE (pour tous les utilisateurs connectés)
# ============================================================
class MonCentreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Voir les infos du centre de l'utilisateur connecté"""
        if not request.user.centre:
            return Response(
                {'error': 'Vous n\'êtes rattaché à aucun centre'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = CentreDistributionSerializer(request.user.centre)
        return Response(serializer.data)