from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur, HistoriqueConnexion, LigneTelephonique


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display  = ['email', 'telephone', 'nom', 'prenom', 'role', 'actif', 'created_at']
    list_filter   = ['role', 'actif']
    search_fields = ['email', 'telephone', 'nom', 'prenom']
    ordering      = ['-created_at']

    fieldsets = (
        ('Authentification', {'fields': ('email', 'telephone', 'password')}),
        ('Identité',         {'fields': ('nom', 'prenom', 'date_naissance', 'genre')}),
        ('Adresse',          {'fields': ('adresse_ligne1', 'adresse_ligne2', 'wilaya', 'commune', 'code_postal')}),
        ('Rôle & Centre',    {'fields': ('role', 'centre')}),
        ('Infos Client',     {'fields': ('type_client',)}),
        ('État',             {'fields': ('actif', 'is_active', 'is_staff', 'is_superuser', 'email_verifie', 'tel_verifie')}),
        ('Permissions',      {'fields': ('groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'telephone', 'nom', 'prenom', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(HistoriqueConnexion)
class HistoriqueConnexionAdmin(admin.ModelAdmin):
    list_display  = ['utilisateur', 'ip_adresse', 'succes', 'connecte_a']
    list_filter   = ['succes']
    search_fields = ['utilisateur__email', 'utilisateur__telephone']
    ordering      = ['-connecte_a']


@admin.register(LigneTelephonique)
class LigneTelephoniqueAdmin(admin.ModelAdmin):
    list_display  = ['numero', 'client', 'type_abonnement', 'actif', 'created_at']
    list_filter   = ['actif', 'type_abonnement']
    search_fields = ['numero', 'client__nom', 'client__prenom']