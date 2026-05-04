from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Email
from .serializers import EmailSerializer
from apps.users.permissions import EstAdmin


# ============================================================
# HISTORIQUE DES EMAILS (admin seulement)
# ============================================================
class HistoriqueEmailsView(APIView):
    permission_classes = [IsAuthenticated, EstAdmin]

    def get(self, request):
        """L'admin voit tous les emails envoyés pour son centre"""
        emails = Email.objects.filter(
            ticket__centre=request.user.centre
        ).order_by('-created_at')[:100]

        serializer = EmailSerializer(emails, many=True)
        return Response(serializer.data)


# ============================================================
# TESTER L'ENVOI D'EMAIL (admin seulement)
# ============================================================
class TesterEmailView(APIView):
    permission_classes = [IsAuthenticated, EstAdmin]

    def post(self, request):
        """Tester l'envoi d'un email SMTP"""
        from .emails import envoyer_email
        from .models import TypeEmail

        succes = envoyer_email(
            destinataire=request.user,
            type_email=TypeEmail.STATUT_CHANGE,
            sujet="[AT] Test email - Algérie Télécom",
            contexte={
                'client_prenom': request.user.prenom,
                'client_nom':    request.user.nom,
                'numero_ticket': 'TKT-TEST-000001',
                'titre':         'Test de configuration email',
                'statut':        'Test',
                'date':          'Maintenant',
            },
        )

        if succes:
            return Response({'message': 'Email envoyé avec succès !'})
        return Response({'error': 'Échec de l\'envoi. Vérifiez votre configuration SMTP.'})