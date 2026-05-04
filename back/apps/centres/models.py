from django.db import models


# ============================================================
# CENTRE DE DISTRIBUTION
# ============================================================
class CentreDistribution(models.Model):

    code         = models.CharField(max_length=20, unique=True)   # ex: AT-ALGER-01
    nom          = models.CharField(max_length=100)
    wilaya       = models.CharField(max_length=100)
    adresse      = models.TextField(null=True, blank=True)
    telephone    = models.CharField(max_length=20, null=True, blank=True)
    email        = models.EmailField(null=True, blank=True)
    prefixes_tel = models.JSONField(default=list)                  # ex: ["0561", "0562"]
    actif        = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'centres_distribution'
        verbose_name = 'Centre de Distribution'
        verbose_name_plural = 'Centres de Distribution'

    def __str__(self):
        return f"{self.code} - {self.nom}"


# ============================================================
# PARAMÈTRES DU CENTRE
# ============================================================
class ParametresCentre(models.Model):

    centre = models.OneToOneField(
        CentreDistribution,
        on_delete=models.CASCADE,
        related_name='parametres',
        primary_key=True
    )
    attribution_auto_active = models.BooleanField(default=True)
    sla_heures_normale      = models.IntegerField(default=48)
    sla_heures_haute        = models.IntegerField(default=24)
    sla_heures_critique     = models.IntegerField(default=4)
    updated_at              = models.DateTimeField(auto_now=True)
    updated_by              = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='parametres_modifies'
    )

    class Meta:
        db_table = 'parametres_centre'
        verbose_name = 'Paramètres Centre'

    def __str__(self):
        return f"Paramètres - {self.centre.nom}"