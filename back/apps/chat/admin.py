from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ['ticket', 'expediteur', 'expediteur_type', 'lu_par_client', 'lu_par_agent', 'created_at']
    list_filter   = ['expediteur_type', 'lu_par_client', 'lu_par_agent']
    ordering      = ['-created_at']