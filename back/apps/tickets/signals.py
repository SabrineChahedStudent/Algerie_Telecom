from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Ticket


@receiver(pre_save, sender=Ticket)
def notifier_changement_statut(sender, instance, **kwargs):
    """Envoie un email au client quand le statut du ticket change"""
    if not instance.pk:
        return  # nouveau ticket, pas de notification

    try:
        ancien = Ticket.objects.get(pk=instance.pk)
        if ancien.statut != instance.statut:
            # Statuts qui déclenchent un email au client
            statuts_notifier = ['resolu', 'ferme', 'rejete', 'en_cours']
            if instance.statut in statuts_notifier:
                from apps.notifications.emails import notifier_changement_statut
                notifier_changement_statut(instance)
    except Ticket.DoesNotExist:
        pass