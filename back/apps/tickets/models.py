from django.db import models
import uuid


# ============================================================
# CHOICES
# ============================================================
class StatutTicket(models.TextChoices):
    SOUMIS              = 'soumis',               'Soumis'
    OUVERT              = 'ouvert',               'Ouvert'
    EN_COURS            = 'en_cours',             'En cours'
    ESCALADE_TECHNIQUE  = 'escalade_technique',   'Escaladé - Technique'
    ESCALADE_ANNEXE     = 'escalade_annexe',      'Escaladé - Annexe'
    RESOLU              = 'resolu',               'Résolu'
    FERME               = 'ferme',                'Fermé'
    REJETE              = 'rejete',               'Rejeté'


class PrioriteTicket(models.TextChoices):
    BASSE    = 'basse',    'Basse'
    NORMALE  = 'normale',  'Normale'
    HAUTE    = 'haute',    'Haute'
    CRITIQUE = 'critique', 'Critique'


class SourceTicket(models.TextChoices):
    WEB   = 'web',   'Web'
    EMAIL = 'email', 'Email'


class TypeEscalade(models.TextChoices):
    TECHNIQUE = 'technique', 'Technique'
    ANNEXE    = 'annexe',    'Annexe'


# ============================================================
# TYPE DE SERVICE (DÉRANGEMENTS)
# ============================================================
class TypeService(models.Model):

    code            = models.CharField(max_length=50, unique=True)
    libelle         = models.CharField(max_length=150)
    description     = models.TextField(null=True, blank=True)
    priorite_defaut = models.SmallIntegerField(default=2)  # 1=Basse 2=Normale 3=Haute 4=Critique
    actif           = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'types_service'
        verbose_name = 'Type de Service'
        verbose_name_plural = 'Types de Service'

    def __str__(self):
        return self.libelle


# ============================================================
# TICKET
# ============================================================
class Ticket(models.Model):

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_ticket = models.CharField(max_length=30, unique=True, blank=True)

    # --- Acteurs ---
    client = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.RESTRICT,
        related_name='tickets_client'
    )
    agent = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='tickets_agent'
    )
    agent_technique = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='tickets_technique'
    )
    agent_annexe = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='tickets_annexe'
    )
    centre = models.ForeignKey(
        'centres.CentreDistribution',
        on_delete=models.RESTRICT,
        related_name='tickets'
    )

    # --- Classification ---
    type_service = models.ForeignKey(
        TypeService,
        on_delete=models.RESTRICT,
        related_name='tickets'
    )
    priorite = models.CharField(max_length=10, choices=PrioriteTicket.choices, default=PrioriteTicket.NORMALE)
    statut   = models.CharField(max_length=25, choices=StatutTicket.choices, default=StatutTicket.SOUMIS)

    # --- Contenu ---
    titre       = models.CharField(max_length=255)
    description = models.TextField()
    resume_ia   = models.TextField(null=True, blank=True)

    # --- Attribution ---
    attribution_auto = models.BooleanField(default=True)

    # --- Source (web ou email via n8n) ---
    source       = models.CharField(max_length=10, choices=SourceTicket.choices, default=SourceTicket.WEB)
    email_source = models.EmailField(null=True, blank=True, help_text="Email d'origine de la réclamation")
    email_actif  = models.BooleanField(default=True, help_text="Relais email actif pour ce ticket")

    # --- Résolution ---
    resolution               = models.TextField(null=True, blank=True)
    satisfaction_client      = models.SmallIntegerField(null=True, blank=True)  # 1 à 5
    commentaire_satisfaction = models.TextField(null=True, blank=True)

    # --- Timestamps ---
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)
    pris_en_charge_a = models.DateTimeField(null=True, blank=True)
    resolu_a         = models.DateTimeField(null=True, blank=True)
    ferme_a          = models.DateTimeField(null=True, blank=True)
    echeance_sla     = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tickets'
        verbose_name = 'Ticket'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.numero_ticket} - {self.titre}"

    def save(self, *args, **kwargs):
        # Génération automatique du numéro de ticket
        if not self.numero_ticket:
            from django.utils import timezone
            from django.db.models import Max
            annee = timezone.now().year
            prefix = f"TKT-{annee}-"
            # Trouver le plus grand numéro existant pour cette année
            last = Ticket.objects.filter(numero_ticket__startswith=prefix).aggregate(
                max_num=Max('numero_ticket')
            )['max_num']
            if last:
                try:
                    last_num = int(last.split('-')[-1])
                except (ValueError, IndexError):
                    last_num = 0
            else:
                last_num = 0
            self.numero_ticket = f"{prefix}{str(last_num + 1).zfill(6)}"
        super().save(*args, **kwargs)


# ============================================================
# PIÈCE JOINTE
# ============================================================
class PieceJointe(models.Model):

    ticket        = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='pieces_jointes')
    nom_fichier   = models.CharField(max_length=255)
    type_mime     = models.CharField(max_length=100)
    taille_octets = models.IntegerField()
    contenu       = models.BinaryField()                  # stocké en BDD (BYTEA)
    uploaded_by   = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.RESTRICT,
        related_name='pieces_jointes'
    )
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pieces_jointes'
        verbose_name = 'Pièce Jointe'

    def __str__(self):
        return f"{self.nom_fichier} ({self.ticket.numero_ticket})"


# ============================================================
# ESCALADE
# ============================================================
class Escalade(models.Model):

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='escalades')
    type_escalade = models.CharField(max_length=10, choices=TypeEscalade.choices)
    agent_source  = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.RESTRICT,
        related_name='escalades_source'
    )
    agent_cible   = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='escalades_cible'
    )
    motif            = models.TextField()
    resume_ia        = models.TextField(null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    pris_en_charge_a = models.DateTimeField(null=True, blank=True)
    resolu_a         = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'escalades'
        verbose_name = 'Escalade'
        ordering = ['-created_at']

    def __str__(self):
        return f"Escalade {self.type_escalade} - {self.ticket.numero_ticket}"