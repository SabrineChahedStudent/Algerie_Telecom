from django.db import models


# ============================================================
# CHOICES
# ============================================================
class TypeEmail(models.TextChoices):
    TICKET_OUVERT   = 'ticket_ouvert',   'Ticket Ouvert'
    TICKET_ATTRIBUE = 'ticket_attribue', 'Ticket Attribué'
    NOUVEAU_MESSAGE = 'nouveau_message', 'Nouveau Message'
    STATUT_CHANGE   = 'statut_change',   'Statut Changé'
    ESCALADE        = 'escalade',        'Escalade'
    TICKET_RESOLU   = 'ticket_resolu',   'Ticket Résolu'
    RAPPEL_SLA      = 'rappel_sla',      'Rappel SLA'


class StatutEmail(models.TextChoices):
    EN_ATTENTE = 'en_attente', 'En attente'
    ENVOYE     = 'envoye',     'Envoyé'
    ECHEC      = 'echec',      'Échec'


# ============================================================
# EMAIL
# ============================================================
class Email(models.Model):

    destinataire = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.CASCADE,
        related_name='emails'
    )
    destinataire_email = models.EmailField()          # copie de l'email au moment de l'envoi
    type_email         = models.CharField(max_length=20, choices=TypeEmail.choices)
    sujet              = models.CharField(max_length=255)
    corps_html         = models.TextField()
    ticket             = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='emails'
    )
    statut     = models.CharField(max_length=15, choices=StatutEmail.choices, default=StatutEmail.EN_ATTENTE)
    tentatives = models.SmallIntegerField(default=0)
    erreur     = models.TextField(null=True, blank=True)
    envoye_a   = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'emails'
        verbose_name = 'Email'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type_email} → {self.destinataire_email} ({self.statut})"