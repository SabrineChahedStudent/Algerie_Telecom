from django.contrib import admin
from .models import Email


@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display  = ['destinataire_email', 'type_email', 'sujet', 'statut', 'tentatives', 'created_at']
    list_filter   = ['statut', 'type_email']
    search_fields = ['destinataire_email', 'sujet']
    ordering      = ['-created_at']