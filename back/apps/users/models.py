from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid


# ============================================================
# CHOICES
# ============================================================
class Role(models.TextChoices):
    CLIENT           = 'client',           'Client'
    AGENT            = 'agent',            'Agent'
    AGENT_TECHNIQUE  = 'agent_technique',  'Agent Technique'
    AGENT_ANNEXE     = 'agent_annexe',     'Agent Annexe'
    ADMIN            = 'admin',            'Admin'
    ADMIN_IT         = 'admin_it',         'Admin IT'


class TypeClient(models.TextChoices):
    PARTICULIER   = 'particulier',   'Particulier'
    PROFESSIONNEL = 'professionnel', 'Professionnel'


# ============================================================
# MANAGER CUSTOM
# ============================================================
class UtilisateurManager(BaseUserManager):

    def create_user(self, telephone=None, email=None, password=None, **extra_fields):
        """Crée un utilisateur normal (client ou agent)"""
        if not password:
            raise ValueError("Le mot de passe est obligatoire")
        
        user = self.model(
            telephone=telephone,
            email=self.normalize_email(email) if email else None,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Crée un superuser via Django Admin"""
        extra_fields.setdefault('role', Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('nom', 'Super')
        extra_fields.setdefault('prenom', 'Admin')
        return self.create_user(email=email, password=password, **extra_fields)


# ============================================================
# MODÈLE UTILISATEUR CUSTOM
# ============================================================
class Utilisateur(AbstractBaseUser, PermissionsMixin):

    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role     = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT)

    # --- Authentification ---
    # Client  → téléphone + mot de passe
    # Agents/Admin → email + mot de passe
    telephone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email     = models.EmailField(unique=True, null=True, blank=True)

    # --- Identité ---
    nom            = models.CharField(max_length=100)
    prenom         = models.CharField(max_length=100)
    date_naissance = models.DateField(null=True, blank=True)
    genre          = models.CharField(max_length=10, null=True, blank=True)

    # --- Adresse ---
    adresse_ligne1 = models.TextField(null=True, blank=True)
    adresse_ligne2 = models.TextField(null=True, blank=True)
    wilaya         = models.CharField(max_length=100, null=True, blank=True)
    commune        = models.CharField(max_length=100, null=True, blank=True)
    code_postal    = models.CharField(max_length=10, null=True, blank=True)

    # --- Rattachement centre (agents/admin uniquement) ---
    centre = models.ForeignKey(
        'centres.CentreDistribution',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='utilisateurs'
    )

    # --- Infos client ---
    type_client      = models.CharField(max_length=20, choices=TypeClient.choices, null=True, blank=True)
    num_contrat      = models.CharField(max_length=50, unique=True, null=True, blank=True)
    type_abonnement  = models.CharField(max_length=50, null=True, blank=True)
    date_abonnement  = models.DateField(null=True, blank=True)

    # --- État du compte ---
    actif          = models.BooleanField(default=True)
    is_active      = models.BooleanField(default=True)   # requis par Django
    is_staff       = models.BooleanField(default=False)  # requis par Django Admin
    email_verifie  = models.BooleanField(default=False)
    tel_verifie    = models.BooleanField(default=False)

    # --- Timestamps ---
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)

    objects = UtilisateurManager()

    # Client → login avec téléphone
    # Agent/Admin → login avec email
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'utilisateurs'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"

    @property
    def is_client(self):
        return self.role == Role.CLIENT

    @property
    def is_agent(self):
        return self.role == Role.AGENT

    @property
    def is_agent_technique(self):
        return self.role == Role.AGENT_TECHNIQUE

    @property
    def is_agent_annexe(self):
        return self.role == Role.AGENT_ANNEXE

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_admin_it(self):
        return self.role == Role.ADMIN_IT


# ============================================================
# HISTORIQUE DES CONNEXIONS
# ============================================================
class HistoriqueConnexion(models.Model):

    utilisateur  = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='connexions'
    )
    ip_adresse   = models.GenericIPAddressField(null=True, blank=True)
    user_agent   = models.TextField(null=True, blank=True)
    succes       = models.BooleanField(default=True)
    raison_echec = models.CharField(max_length=100, null=True, blank=True)
    connecte_a   = models.DateTimeField(auto_now_add=True)
    deconnecte_a = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'historique_connexions'
        verbose_name = 'Historique Connexion'
        ordering = ['-connecte_a']

    def __str__(self):
        return f"{self.utilisateur} - {self.connecte_a}"
    
# ============================================================
# LIGNES TÉLÉPHONIQUES DU CLIENT
# ============================================================
class LigneTelephonique(models.Model):

    client = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    numero           = models.CharField(max_length=20, unique=True)
    type_abonnement  = models.CharField(max_length=50, null=True, blank=True)  # ADSL, Fibre, IDOOM...
    num_contrat      = models.CharField(max_length=50, unique=True, null=True, blank=True)
    date_abonnement  = models.DateField(null=True, blank=True)
    actif            = models.BooleanField(default=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lignes_telephoniques'
        verbose_name = 'Ligne Téléphonique'

    def __str__(self):
        return f"{self.numero} ({self.client.prenom} {self.client.nom})"


# ============================================================
# DEMANDES IT (Agent → Admin → Admin IT)
# ============================================================
class StatutDemande(models.TextChoices):
    EN_ATTENTE   = 'en_attente',   'En attente'
    APPROUVEE    = 'approuvee',    'Approuvée'
    REFUSEE      = 'refusee',      'Refusée'
    TRAITEE      = 'traitee',      'Traitée'
    REFUSEE_IT   = 'refusee_it',   'Refusée par IT'


class PrioriteDemande(models.TextChoices):
    BASSE    = 'basse',    'Basse'
    NORMALE  = 'normale',  'Normale'
    HAUTE    = 'haute',    'Haute'
    URGENTE  = 'urgente',  'Urgente'


class DemandeIT(models.Model):

    demandeur = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='demandes_envoyees'
    )
    centre = models.ForeignKey(
        'centres.CentreDistribution',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='demandes_it'
    )
    sujet       = models.CharField(max_length=200)
    description = models.TextField()
    priorite    = models.CharField(max_length=20, choices=PrioriteDemande.choices, default=PrioriteDemande.NORMALE)
    statut      = models.CharField(max_length=20, choices=StatutDemande.choices, default=StatutDemande.EN_ATTENTE)

    # Réponse de l'admin du centre
    reponse_admin = models.TextField(null=True, blank=True)
    approuve_par  = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='demandes_approuvees'
    )

    # Réponse de l'admin IT
    reponse_it = models.TextField(null=True, blank=True)
    traite_par = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='demandes_traitees'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'demandes_it'
        verbose_name = 'Demande IT'
        verbose_name_plural = 'Demandes IT'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.statut}] {self.sujet} — {self.demandeur}"