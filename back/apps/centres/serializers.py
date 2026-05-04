from rest_framework import serializers
from .models import CentreDistribution, ParametresCentre


# ============================================================
# CENTRE DE DISTRIBUTION
# ============================================================
class CentreDistributionSerializer(serializers.ModelSerializer):

    nombre_agents = serializers.SerializerMethodField()
    nombre_tickets_actifs = serializers.SerializerMethodField()

    class Meta:
        model  = CentreDistribution
        fields = [
            'id', 'code', 'nom', 'wilaya', 'adresse',
            'telephone', 'email', 'prefixes_tel', 'actif',
            'created_at', 'nombre_agents', 'nombre_tickets_actifs',
        ]
        read_only_fields = ['id', 'created_at']

    def get_nombre_agents(self, obj):
        return obj.utilisateurs.filter(
            role__in=['agent', 'agent_technique', 'agent_annexe'],
            actif=True
        ).count()

    def get_nombre_tickets_actifs(self, obj):
        return obj.tickets.filter(
            statut__in=['ouvert', 'en_cours']
        ).count()


# ============================================================
# PARAMÈTRES DU CENTRE
# ============================================================
class ParametresCentreSerializer(serializers.ModelSerializer):

    centre_nom = serializers.CharField(source='centre.nom', read_only=True)

    class Meta:
        model  = ParametresCentre
        fields = [
            'centre', 'centre_nom',
            'attribution_auto_active',
            'sla_heures_normale',
            'sla_heures_haute',
            'sla_heures_critique',
            'updated_at', 'updated_by',
        ]
        read_only_fields = ['centre', 'updated_at']