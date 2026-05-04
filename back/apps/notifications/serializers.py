from rest_framework import serializers
from .models import Email

class EmailSerializer(serializers.ModelSerializer):
    type_email_label = serializers.CharField(source='get_type_email_display', read_only=True)
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Email
        fields = [
            'id', 'destinataire', 'destinataire_email', 'type_email', 
            'type_email_label', 'sujet', 'corps_html', 'ticket', 
            'statut', 'statut_label', 'tentatives', 'erreur', 
            'envoye_a', 'created_at'
        ]
