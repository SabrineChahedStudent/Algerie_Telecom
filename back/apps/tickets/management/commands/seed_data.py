"""
Commande Django pour peupler la base avec des données de test réalistes.

Usage:
    pipenv run python manage.py seed_data
    pipenv run python manage.py seed_data --reset   (efface tout avant)
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random


class Command(BaseCommand):
    help = "Peuple la base avec des données de test réalistes pour Algérie Télécom"

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset', action='store_true',
            help='Efface toutes les données existantes avant de peupler'
        )

    def handle(self, *args, **options):
        from apps.users.models import Utilisateur, Role
        from apps.centres.models import CentreDistribution, ParametresCentre
        from apps.tickets.models import Ticket, TypeService, Escalade
        from apps.chat.models import Message

        if options['reset']:
            self.stdout.write(self.style.WARNING("🗑️  Suppression des données existantes..."))
            Message.objects.all().delete()
            Escalade.objects.all().delete()
            Ticket.objects.all().delete()
            Utilisateur.objects.filter(is_superuser=False).delete()
            ParametresCentre.objects.all().delete()
            CentreDistribution.objects.all().delete()

        self.stdout.write(self.style.NOTICE("📦 Création des données de test..."))

        # ═══════════════════════════════════════════
        # CENTRES
        # ═══════════════════════════════════════════
        centres_data = [
            ('AT-ALGER-01', 'Centre Alger Centre', 'Alger', ['0557', '0558', '0770']),
            ('AT-ORAN-01',  'Centre Oran',         'Oran',  ['0560', '0561']),
        ]
        centres = {}
        for code, nom, wilaya, prefixes in centres_data:
            c, _ = CentreDistribution.objects.get_or_create(
                code=code, defaults={'nom': nom, 'wilaya': wilaya, 'prefixes_tel': prefixes}
            )
            ParametresCentre.objects.get_or_create(centre=c)
            centres[code] = c
            self.stdout.write(f"  ✅ Centre: {c.nom}")

        centre_alger = centres['AT-ALGER-01']

        # ═══════════════════════════════════════════
        # ADMIN (rattacher le superuser existant)
        # ═══════════════════════════════════════════
        admin = Utilisateur.objects.filter(is_superuser=True).first()
        if admin and not admin.centre:
            admin.centre = centre_alger
            admin.save()
            self.stdout.write(f"  ✅ Admin rattaché: {admin.email}")

        # ═══════════════════════════════════════════
        # AGENTS
        # ═══════════════════════════════════════════
        agents_data = [
            ('Boudjemaa', 'Karim',  'karim.boudjemaa@at.dz',  'agent',           centre_alger),
            ('Mekhloufi', 'Sara',   'sara.mekhloufi@at.dz',   'agent',           centre_alger),
            ('Belkaid',   'Youcef', 'youcef.belkaid@at.dz',   'agent_technique', centre_alger),
            ('Hamidi',    'Fatima', 'fatima.hamidi@at.dz',     'agent_annexe',    centre_alger),
        ]
        agents = []
        for nom, prenom, email, role, centre in agents_data:
            agent, created = Utilisateur.objects.get_or_create(
                email=email,
                defaults={
                    'nom': nom, 'prenom': prenom, 'role': role,
                    'centre': centre, 'actif': True
                }
            )
            if created:
                agent.set_password('agent123')
                agent.save()
            agents.append(agent)
            self.stdout.write(f"  ✅ {role}: {prenom} {nom} ({email})")

        agent_karim = agents[0]
        agent_sara  = agents[1]
        agent_tech  = agents[2]
        agent_annex = agents[3]

        # ═══════════════════════════════════════════
        # CLIENTS
        # ═══════════════════════════════════════════
        clients_data = [
            ('Benali',    'Karim',    '0557123456', 'particulier', centre_alger),
            ('Meziane',   'Amina',    '0557234567', 'particulier', centre_alger),
            ('Sahraoui',  'Mohamed',  '0558345678', 'professionnel', centre_alger),
            ('Belkacem',  'Nour',     '0770456789', 'particulier', centre_alger),
            ('Djelloul',  'Rachid',   '0557567890', 'professionnel', centre_alger),
        ]
        clients = []
        for nom, prenom, tel, type_c, centre in clients_data:
            client, created = Utilisateur.objects.get_or_create(
                telephone=tel,
                defaults={
                    'nom': nom, 'prenom': prenom, 'role': 'client',
                    'type_client': type_c, 'centre': centre, 'actif': True
                }
            )
            if created:
                client.set_password('client123')
                client.save()
            clients.append(client)
            self.stdout.write(f"  ✅ Client: {prenom} {nom} ({tel})")

        # ═══════════════════════════════════════════
        # TYPES DE SERVICE (déjà via migration 0004)
        # ═══════════════════════════════════════════
        types = list(TypeService.objects.filter(actif=True))
        if not types:
            self.stdout.write(self.style.ERROR("  ❌ Aucun type de service ! Lancez 'migrate' d'abord."))
            return

        # ═══════════════════════════════════════════
        # TICKETS (différents statuts)
        # ═══════════════════════════════════════════
        now = timezone.now()
        tickets_data = [
            # (client, agent, statut, jours_depuis, type_idx, titre, description)
            (clients[0], agent_karim, 'ouvert',    1, 0, "Pas de tonalité depuis hier",         "Plus de tonalité sur ma ligne fixe depuis hier soir."),
            (clients[0], agent_karim, 'en_cours',  3, 4, "Internet coupé",                      "Mon internet ADSL ne fonctionne plus du tout."),
            (clients[1], agent_sara,  'en_cours',  2, 3, "Débit très lent",                     "Le débit est tombé à 0.5 Mbps au lieu de 8 Mbps."),
            (clients[1], agent_sara,  'resolu',    7, 2, "Fritures sur la ligne",                "Beaucoup de bruit sur la ligne téléphonique."),
            (clients[2], agent_karim, 'escalade_technique', 4, 4, "Internet coupé (pro)",        "Internet coupé sur notre liaison pro depuis 4 jours."),
            (clients[2], agent_sara,  'ferme',    14, 1, "Appels impossibles",                   "Impossible d'émettre ou recevoir des appels."),
            (clients[3], None,        'soumis',    0, 9, "Ping très élevé",                     "Le ping est à 500ms, impossible de travailler."),
            (clients[3], agent_karim, 'resolu',    5, 11,"Coupures répétitives",                 "La connexion se coupe toutes les 10 minutes."),
            (clients[4], agent_sara,  'escalade_annexe', 3, 5, "Liaison spécialisée en panne",  "Notre liaison spécialisée est complètement down."),
            (clients[4], agent_karim, 'ouvert',    0, 10,"Upload très faible",                  "Vitesse d'upload à 0.1 Mbps."),
        ]

        priorites = ['basse', 'normale', 'haute', 'critique']
        created_tickets = []

        for client, agent, statut, days_ago, type_idx, titre, desc in tickets_data:
            ts = types[type_idx % len(types)]
            prio = random.choice(priorites)
            created_at = now - timedelta(days=days_ago, hours=random.randint(0, 12))

            ticket = Ticket(
                client=client,
                agent=agent,
                centre=centre_alger,
                type_service=ts,
                titre=titre,
                description=desc,
                statut=statut,
                priorite=prio,
                echeance_sla=created_at + timedelta(hours=48),
            )
            # Set timestamps
            if statut in ['en_cours', 'escalade_technique', 'escalade_annexe', 'resolu', 'ferme']:
                ticket.pris_en_charge_a = created_at + timedelta(hours=random.randint(1, 4))
            if statut in ['resolu', 'ferme']:
                ticket.resolu_a = created_at + timedelta(hours=random.randint(6, 24))
                ticket.resolution = "Problème résolu après intervention technique."
                ticket.satisfaction_client = random.choice([3, 4, 5])
            if statut == 'ferme':
                ticket.ferme_a = ticket.resolu_a + timedelta(hours=2)

            ticket.save()

            # Backdate created_at
            Ticket.objects.filter(id=ticket.id).update(created_at=created_at)

            created_tickets.append(ticket)
            self.stdout.write(f"  🎫 Ticket {ticket.numero_ticket} [{statut}] — {titre[:40]}")

        # ═══════════════════════════════════════════
        # ESCALADES
        # ═══════════════════════════════════════════
        for ticket in created_tickets:
            if ticket.statut == 'escalade_technique':
                Escalade.objects.get_or_create(
                    ticket=ticket,
                    defaults={
                        'type_escalade': 'technique',
                        'agent_source': ticket.agent,
                        'agent_cible': agent_tech,
                        'motif': "Problème réseau complexe nécessitant intervention technique sur le répartiteur.",
                    }
                )
                ticket.agent_technique = agent_tech
                ticket.save()
                self.stdout.write(f"  ⬆️  Escalade technique: {ticket.numero_ticket}")

            elif ticket.statut == 'escalade_annexe':
                Escalade.objects.get_or_create(
                    ticket=ticket,
                    defaults={
                        'type_escalade': 'annexe',
                        'agent_source': ticket.agent,
                        'agent_cible': agent_annex,
                        'motif': "Nécessite une vérification physique de l'installation chez le client.",
                    }
                )
                ticket.agent_annexe = agent_annex
                ticket.save()
                self.stdout.write(f"  ⬆️  Escalade annexe: {ticket.numero_ticket}")

        # ═══════════════════════════════════════════
        # MESSAGES CHAT
        # ═══════════════════════════════════════════
        conversations = [
            (created_tickets[0], [
                ('client', "Bonjour, je n'ai plus de tonalité depuis hier soir."),
                ('agent',  "Bonjour, nous allons vérifier votre ligne. Pouvez-vous me donner votre numéro de contrat ?"),
                ('client', "Oui, c'est AT-2024-001."),
                ('agent',  "Merci. Je lance un diagnostic à distance sur votre ligne."),
            ]),
            (created_tickets[1], [
                ('client', "Mon internet est complètement coupé depuis 3 jours !"),
                ('agent',  "Je comprends votre frustration. Nous vérifions le DSL de votre zone."),
                ('agent',  "Il semble y avoir une coupure sur le câble principal. Un technicien va intervenir."),
                ('client', "D'accord, quand est-ce que ça sera réparé ?"),
                ('agent',  "Nous estimons la réparation d'ici 24h."),
            ]),
            (created_tickets[2], [
                ('client', "Mon débit est tombé à 0.5 Mbps, c'est inutilisable."),
                ('agent',  "Nous constatons effectivement une dégradation sur votre ligne. Vérification en cours."),
            ]),
            (created_tickets[4], [
                ('client', "Notre internet professionnel est coupé depuis 4 jours. C'est critique pour notre entreprise."),
                ('agent',  "Je comprends l'urgence. J'escalade immédiatement vers notre équipe technique."),
                ('agent',  "Le ticket a été escaladé. Un technicien senior va prendre en charge votre dossier."),
                ('agent_technique', "Bonjour, je suis le technicien senior. Je vais analyser le problème sur le répartiteur."),
                ('client', "Merci, nous attendons une résolution rapide."),
            ]),
        ]

        for ticket, msgs in conversations:
            for role, contenu in msgs:
                if role == 'client':
                    expediteur = ticket.client
                elif role == 'agent':
                    expediteur = ticket.agent
                elif role == 'agent_technique':
                    expediteur = agent_tech
                else:
                    expediteur = agent_annex

                if expediteur:
                    Message.objects.create(
                        ticket=ticket,
                        expediteur=expediteur,
                        expediteur_type=role,
                        contenu=contenu,
                        lu_par_client=(role == 'client'),
                        lu_par_agent=(role != 'client'),
                    )
            self.stdout.write(f"  💬 {len(msgs)} messages pour {ticket.numero_ticket}")

        # ═══════════════════════════════════════════
        # RÉSUMÉ
        # ═══════════════════════════════════════════
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 50))
        self.stdout.write(self.style.SUCCESS("✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS"))
        self.stdout.write(self.style.SUCCESS("═" * 50))
        self.stdout.write(f"  📍 {CentreDistribution.objects.count()} centres")
        self.stdout.write(f"  👤 {Utilisateur.objects.filter(role='client').count()} clients")
        self.stdout.write(f"  🛡️  {Utilisateur.objects.filter(role='agent').count()} agents")
        self.stdout.write(f"  🔧 {Utilisateur.objects.filter(role='agent_technique').count()} agents techniques")
        self.stdout.write(f"  📎 {Utilisateur.objects.filter(role='agent_annexe').count()} agents annexes")
        self.stdout.write(f"  🎫 {Ticket.objects.count()} tickets")
        self.stdout.write(f"  💬 {Message.objects.count()} messages")
        self.stdout.write(f"  ⬆️  {Escalade.objects.count()} escalades")
        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("🔐 Identifiants de test:"))
        self.stdout.write("  Clients → téléphone / client123")
        for c in clients:
            self.stdout.write(f"    {c.telephone} ({c.prenom} {c.nom})")
        self.stdout.write("  Agents → email / agent123")
        for a in agents:
            self.stdout.write(f"    {a.email} ({a.prenom} {a.nom} - {a.role})")
        self.stdout.write("")
