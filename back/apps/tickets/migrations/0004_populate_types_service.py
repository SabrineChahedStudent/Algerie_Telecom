from django.db import migrations


def populate_types_service(apps, schema_editor):
    """Pré-remplit les types de service (données statiques)."""
    TypeService = apps.get_model('tickets', 'TypeService')

    types = [
        ('PAS_TONALITE',          'Pas de tonalité',                          2),
        ('PAS_APPELS',            "Pas d'appels émis/reçus",                  2),
        ('FRITURES_LIGNE',        'Fritures sur ligne',                       2),
        ('CHUTE_DEBIT',           'Chute de débit internet',                  2),
        ('PAS_INTERNET',          "Pas d'internet",                           2),
        ('LIAISON_SPECIALISEE',   'Liaison spécialisée',                      2),
        ('IDOOM_INTERNET_PRO',    'IDOOM Internet PRO',                       2),
        ('INTRANET_VPN',          'Intranet/VPN',                             2),
        ('SIGNAUX_NON_RETABLIS',  'Problèmes signaux non rétablis',           2),
        ('PING_ELEVE',            'Ping élevé',                               2),
        ('UPLOAD_FAIBLE',         'Upload faible',                            2),
        ('COUPURES_REPETITIVES',  'Coupures répétitives',                     2),
        ('COUVERTURE_4G',         'Problème de couverture réseau (4G LTE)',   2),
        ('PAS_TONALITE_INTERNET', "Pas de tonalité / pas d'internet",         2),
    ]

    for code, libelle, priorite in types:
        TypeService.objects.get_or_create(
            code=code,
            defaults={'libelle': libelle, 'priorite_defaut': priorite}
        )


def reverse_types_service(apps, schema_editor):
    """Supprime les types de service pré-remplis."""
    TypeService = apps.get_model('tickets', 'TypeService')
    codes = [
        'PAS_TONALITE', 'PAS_APPELS', 'FRITURES_LIGNE', 'CHUTE_DEBIT',
        'PAS_INTERNET', 'LIAISON_SPECIALISEE', 'IDOOM_INTERNET_PRO',
        'INTRANET_VPN', 'SIGNAUX_NON_RETABLIS', 'PING_ELEVE',
        'UPLOAD_FAIBLE', 'COUPURES_REPETITIVES', 'COUVERTURE_4G',
        'PAS_TONALITE_INTERNET',
    ]
    TypeService.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0003_alter_ticket_statut'),
    ]

    operations = [
        migrations.RunPython(populate_types_service, reverse_types_service),
    ]
