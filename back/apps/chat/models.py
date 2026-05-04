from django.db import models


# ============================================================
# CHOICES
# ============================================================
class ExpediteurType(models.TextChoices):
    CLIENT          = 'client',          'Client'
    AGENT           = 'agent',           'Agent'
    AGENT_TECHNIQUE = 'agent_technique', 'Agent Technique'
    AGENT_ANNEXE    = 'agent_annexe',    'Agent Annexe'
    SYSTEME         = 'systeme',         'Système'


# ============================================================
# MESSAGE
# ============================================================
class Message(models.Model):

    ticket = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.CASCADE,
        related_name='messages'
    )
    expediteur = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='messages'
    )
    expediteur_type = models.CharField(max_length=20, choices=ExpediteurType.choices)
    expediteur_role = models.CharField(max_length=50, blank=True, null=True)
    contenu         = models.TextField()
    piece_jointe    = models.ForeignKey(
        'tickets.PieceJointe',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='messages_chat'
    )
    lu_par_client   = models.BooleanField(default=False)
    lu_par_agent    = models.BooleanField(default=False)
    via_email       = models.BooleanField(default=False)
    created_at      = models.DateTimeField(auto_now_add=True)
    modifie_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'messages'
        verbose_name = 'Message'
        ordering = ['created_at']

    def __str__(self):
        return f"Message de {self.expediteur_type} - Ticket {self.ticket.numero_ticket}"