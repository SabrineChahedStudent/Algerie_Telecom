from django.contrib import admin
from .models import CentreDistribution, ParametresCentre


@admin.register(CentreDistribution)
class CentreDistributionAdmin(admin.ModelAdmin):
    list_display  = ['code', 'nom', 'wilaya', 'actif', 'created_at']
    list_filter   = ['wilaya', 'actif']
    search_fields = ['code', 'nom', 'wilaya']
    ordering      = ['nom']


@admin.register(ParametresCentre)
class ParametresCentreAdmin(admin.ModelAdmin):
    list_display = ['centre', 'attribution_auto_active', 'sla_heures_normale', 'updated_at']