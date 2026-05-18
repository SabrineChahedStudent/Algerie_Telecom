from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Ticket, TypeService, PieceJointe, Escalade, StatutTicket
from apps.centres.models import ParametresCentre


class TypeServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TypeService
        fields = ['id', 'code', 'libelle', 'description', 'priorite_defaut', 'actif']


class PieceJointeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PieceJointe
        fields = ['id', 'nom_fichier', 'type_mime', 'taille_octets', 'created_at']


class PieceJointeUploadSerializer(serializers.ModelSerializer):
    fichier = serializers.FileField(write_only=True)

    class Meta:
        model  = PieceJointe
        fields = ['id', 'fichier', 'nom_fichier', 'type_mime', 'taille_octets', 'created_at']
        read_only_fields = ['id', 'nom_fichier', 'type_mime', 'taille_octets', 'created_at']

    def create(self, validated_data):
        fichier = validated_data.pop('fichier')
        piece = PieceJointe(
            nom_fichier=fichier.name,
            type_mime=fichier.content_type,
            taille_octets=fichier.size,
            contenu=fichier.read(),
            **validated_data
        )
        piece.save()
        return piece


class CreerTicketSerializer(serializers.ModelSerializer):
    type_service = serializers.IntegerField(write_only=True)
    historique_ia = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = Ticket
        fields = ['type_service', 'titre', 'description', 'historique_ia']

    def create(self, validated_data):
        client = self.context['request'].user

        # Récupérer directement le centre du client, auto-heal si manquant
        centre = client.centre
        if not centre:
            from apps.centres.models import CentreDistribution
            centre = CentreDistribution.objects.first()
            if not centre:
                centre = CentreDistribution.objects.create(
                    code='AT-ALGER-01',
                    nom='Centre Principal Alger',
                    wilaya='Alger',
                    prefixes_tel=['0555', '0560']
                )
            client.centre = centre
            client.save(update_fields=['centre'])

        priorite_map = {1: 'basse', 2: 'normale', 3: 'haute', 4: 'critique'}
        
        type_service_id = validated_data.pop('type_service')
        try:
            ts = TypeService.objects.get(id=type_service_id)
        except TypeService.DoesNotExist:
            fallback_map = {
                1: 'Internet ADSL', 2: 'Internet Fiber', 3: 'Téléphonie Fixe',
                4: '4G LTE', 5: 'IPTV', 6: 'Autre'
            }
            libelle = fallback_map.get(type_service_id, f'Service {type_service_id}')
            code = f"SVC_{type_service_id}"
            import uuid
            if TypeService.objects.filter(code=code).exists():
                code = f"SVC_{uuid.uuid4().hex[:6]}"
            ts = TypeService.objects.create(id=type_service_id, code=code, libelle=libelle, priorite_defaut=2)

        priorite = priorite_map.get(ts.priorite_defaut, 'normale')

        historique_ia = validated_data.pop('historique_ia', None)
        resume_ia = None
        if historique_ia:
            from .hf_triage import generer_resume_ia
            resume_ia = generer_resume_ia(historique_ia)

        ticket = Ticket.objects.create(client=client, centre=centre, priorite=priorite, type_service=ts, resume_ia=resume_ia, **validated_data)

        try:
            params = ParametresCentre.objects.get(centre=centre)
            sla_map = {'normale': params.sla_heures_normale, 'haute': params.sla_heures_haute, 'critique': params.sla_heures_critique, 'basse': 72}
            heures = sla_map.get(priorite, 48)
            ticket.echeance_sla = timezone.now() + timedelta(hours=heures)
            ticket.save()
        except ParametresCentre.DoesNotExist:
            pass

        self._attribuer_automatiquement(ticket, centre)

        # Notification email au client
        try:
            from apps.notifications.emails import notifier_ticket_ouvert
            notifier_ticket_ouvert(ticket)
        except Exception:
            pass  # Ne pas bloquer la création si l'email échoue

        return ticket

    def _attribuer_automatiquement(self, ticket, centre):
        from apps.users.models import Utilisateur, Role
        try:
            params = ParametresCentre.objects.get(centre=centre)
            if not params.attribution_auto_active:
                return
        except ParametresCentre.DoesNotExist:
            pass

        agents = Utilisateur.objects.filter(centre=centre, role=Role.AGENT, actif=True)
        if not agents.exists():
            return

        agent_min = min(agents, key=lambda a: a.tickets_agent.filter(statut__in=['ouvert', 'en_cours']).count())
        ticket.agent = agent_min
        # On garde le statut initial (SOUMIS) pour laisser au client le temps d'annuler s'il le souhaite
        ticket.attribution_auto = True
        ticket.save()


class TicketListSerializer(serializers.ModelSerializer):
    type_service_libelle = serializers.CharField(source='type_service.libelle', read_only=True)
    client_nom    = serializers.CharField(source='client.nom', read_only=True)
    client_prenom = serializers.CharField(source='client.prenom', read_only=True)
    agent_nom     = serializers.CharField(source='agent.nom', read_only=True)
    agent_prenom  = serializers.CharField(source='agent.prenom', read_only=True)
    centre_nom    = serializers.CharField(source='centre.nom', read_only=True)
    nombre_messages = serializers.SerializerMethodField()

    class Meta:
        model  = Ticket
        fields = ['id', 'numero_ticket', 'titre', 'description', 'resume_ia', 'statut', 'priorite', 'source', 'type_service_libelle', 'client_nom', 'client_prenom', 'agent_nom', 'agent_prenom', 'centre_nom', 'nombre_messages', 'created_at', 'echeance_sla']

    def get_nombre_messages(self, obj):
        return obj.messages.count()


class TicketDetailSerializer(serializers.ModelSerializer):
    type_service   = TypeServiceSerializer(read_only=True)
    pieces_jointes = PieceJointeSerializer(many=True, read_only=True)
    centre_nom     = serializers.CharField(source='centre.nom', read_only=True)
    client_nom     = serializers.CharField(source='client.nom', read_only=True)
    client_prenom  = serializers.CharField(source='client.prenom', read_only=True)
    client_tel     = serializers.CharField(source='client.telephone', read_only=True)
    agent_nom      = serializers.CharField(source='agent.nom', read_only=True)
    agent_prenom   = serializers.CharField(source='agent.prenom', read_only=True)

    class Meta:
        model  = Ticket
        fields = ['id', 'numero_ticket', 'titre', 'description', 'resume_ia', 'statut', 'priorite', 'source', 'email_source', 'email_actif', 'type_service', 'client_nom', 'client_prenom', 'client_tel', 'agent_nom', 'agent_prenom', 'centre_nom', 'attribution_auto', 'resolution', 'satisfaction_client', 'commentaire_satisfaction', 'pieces_jointes', 'created_at', 'updated_at', 'pris_en_charge_a', 'resolu_a', 'ferme_a', 'echeance_sla']


class MettreAJourTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Ticket
        fields = ['statut', 'resolution', 'priorite']

    def validate_statut(self, value):
        ticket = self.instance
        transitions = {
            'soumis': ['ouvert', 'en_cours', 'resolu', 'rejete'], 
            'ouvert': ['en_cours', 'resolu', 'rejete'], 
            'en_cours': ['resolu', 'escalade_technique', 'escalade_annexe', 'rejete'], 
            'escalade_technique': ['resolu', 'ferme'], 
            'escalade_annexe': ['resolu', 'ferme'], 
            'resolu': ['ferme']
        }
        autorises = transitions.get(ticket.statut, [])
        if value not in autorises:
            raise serializers.ValidationError(f"Transition invalide : {ticket.statut} → {value}")
        return value

    def update(self, instance, validated_data):
        nouveau_statut = validated_data.get('statut', instance.statut)
        if nouveau_statut == 'resolu' and instance.statut != 'resolu':
            instance.resolu_a = timezone.now()
        if nouveau_statut == 'ferme' and instance.statut != 'ferme':
            instance.ferme_a = timezone.now()
        result = super().update(instance, validated_data)

        # Notifications email
        try:
            from apps.notifications.emails import notifier_changement_statut, notifier_ticket_resolu
            if nouveau_statut == 'resolu':
                notifier_ticket_resolu(instance)
            else:
                notifier_changement_statut(instance)
        except Exception:
            pass

        return result


class SatisfactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Ticket
        fields = ['satisfaction_client', 'commentaire_satisfaction']

    def validate_satisfaction_client(self, value):
        if value not in range(1, 6):
            raise serializers.ValidationError("La satisfaction doit être entre 1 et 5.")
        return value


class EscaladeSerializer(serializers.ModelSerializer):
    agent_source_nom = serializers.CharField(source='agent_source.nom', read_only=True)
    agent_cible_nom  = serializers.CharField(source='agent_cible.nom', read_only=True)

    class Meta:
        model  = Escalade
        fields = ['id', 'ticket', 'type_escalade', 'agent_source', 'agent_source_nom', 'agent_cible', 'agent_cible_nom', 'motif', 'resume_ia', 'created_at', 'pris_en_charge_a', 'resolu_a']
        read_only_fields = ['id', 'ticket', 'agent_source', 'created_at']


class CreerEscaladeSerializer(serializers.Serializer):
    type_escalade = serializers.ChoiceField(choices=['technique', 'annexe'])
    motif         = serializers.CharField()

    def create(self, validated_data):
        ticket       = self.context['ticket']
        agent_source = self.context['request'].user
        if validated_data['type_escalade'] == 'technique':
            ticket.statut = StatutTicket.ESCALADE_TECHNIQUE
        else:
            ticket.statut = StatutTicket.ESCALADE_ANNEXE
        ticket.save()

        # Generate AI summary based on chat messages
        from apps.chat.models import Message
        messages = Message.objects.filter(ticket=ticket).order_by('created_at')
        if messages.exists():
            historique_lignes = []
            for msg in messages:
                role = "Client" if msg.expediteur_type == "client" else "Agent Helpdesk"
                historique_lignes.append(f"{role}: {msg.contenu}")
            historique_chat = "\n".join(historique_lignes)
            
            from apps.tickets.hf_triage import generer_resume_escalade
            resume_ia = generer_resume_escalade(historique_chat)
        else:
            resume_ia = "Aucun échange de messages disponible avant l'escalade."

        escalade = Escalade.objects.create(ticket=ticket, agent_source=agent_source, resume_ia=resume_ia, **validated_data)

        # Notification email au client
        try:
            from apps.notifications.emails import notifier_escalade
            notifier_escalade(ticket, escalade)
        except Exception:
            pass

        return escalade