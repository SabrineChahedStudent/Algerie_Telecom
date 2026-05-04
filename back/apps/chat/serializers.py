from rest_framework import serializers
from .models import Message


class PieceJointeMinSerializer(serializers.Serializer):
    """Minimal serializer for piece jointe info embedded in a message."""
    id = serializers.IntegerField(read_only=True)
    nom_fichier = serializers.CharField(read_only=True)
    type_mime = serializers.CharField(read_only=True)
    taille_octets = serializers.IntegerField(read_only=True)


class MessageSerializer(serializers.ModelSerializer):

    expediteur_nom    = serializers.CharField(source='expediteur.nom', read_only=True)
    expediteur_prenom = serializers.CharField(source='expediteur.prenom', read_only=True)
    expediteur_role   = serializers.CharField(source='expediteur_type', read_only=True)
    date_envoi        = serializers.DateTimeField(source='created_at', read_only=True)
    piece_jointe_info = PieceJointeMinSerializer(source='piece_jointe', read_only=True)

    class Meta:
        model  = Message
        fields = [
            'id', 'ticket',
            'expediteur', 'expediteur_nom', 'expediteur_prenom',
            'expediteur_type', 'expediteur_role', 'contenu',
            'lu_par_client', 'lu_par_agent', 'via_email',
            'piece_jointe', 'piece_jointe_info',
            'created_at', 'date_envoi', 'modifie_at',
        ]
        read_only_fields = [
            'id', 'ticket', 'expediteur',
            'expediteur_type', 'expediteur_nom', 'expediteur_prenom',
            'lu_par_client', 'lu_par_agent',
            'created_at', 'modifie_at',
        ]


class EnvoyerMessageSerializer(serializers.Serializer):
    contenu = serializers.CharField(required=False, allow_blank=True, default='')
    fichier = serializers.FileField(required=False)

    def validate(self, data):
        if not data.get('contenu', '').strip() and not data.get('fichier'):
            raise serializers.ValidationError('Un message ou un fichier est requis.')
        return data