# 📡 Portail de Réclamations — Algérie Télécom
## Documentation Complète du Projet (PFE)

---

## 📋 Table des Matières

1. [Présentation du Projet](#1-présentation-du-projet)
2. [Stack Technique](#2-stack-technique)
3. [Architecture Générale](#3-architecture-générale)
4. [Base de Données](#4-base-de-données)
5. [Backend Django](#5-backend-django)
6. [API Endpoints](#6-api-endpoints)
7. [Authentification JWT](#7-authentification-jwt)
8. [Rôles & Permissions](#8-rôles--permissions)
9. [Logique Métier](#9-logique-métier)
10. [WebSocket & Chat](#10-websocket--chat)
11. [Notifications Email](#11-notifications-email)
12. [Rapports & Exports](#12-rapports--exports)
13. [Frontend React](#13-frontend-react)
14. [Lancer le Projet](#14-lancer-le-projet)
15. [Décisions Techniques](#15-décisions-techniques)

---

## 1. Présentation du Projet

### Contexte
Portail web de gestion des réclamations (tickets) pour **Algérie Télécom**. Projet de Fin d'Études (PFE).

### Objectif
Permettre aux clients d'Algérie Télécom de déposer leurs réclamations en ligne et aux agents de les traiter efficacement, avec un système d'attribution automatique, de chat en temps réel, et de rapports de performance.

### Types de Dérangements Supportés
Les types de service sont pré-remplis automatiquement via une migration de données (`0004_populate_types_service`). La priorité n'est pas définie par le type de service — elle sera déterminée par un **chatbot IA** qui discutera avec le client en amont.

| Code | Libellé |
|---|---|
| PAS_TONALITE | Pas de tonalité |
| PAS_APPELS | Pas d'appels émis/reçus |
| FRITURES_LIGNE | Fritures sur ligne |
| CHUTE_DEBIT | Chute de débit internet |
| PAS_INTERNET | Pas d'internet |
| LIAISON_SPECIALISEE | Liaison spécialisée |
| IDOOM_INTERNET_PRO | IDOOM Internet PRO |
| INTRANET_VPN | Intranet/VPN |
| SIGNAUX_NON_RETABLIS | Problèmes signaux non rétablis |
| PING_ELEVE | Ping élevé |
| UPLOAD_FAIBLE | Upload faible |
| COUPURES_REPETITIVES | Coupures répétitives |
| COUVERTURE_4G | Problème de couverture réseau (4G LTE) |
| PAS_TONALITE_INTERNET | Pas de tonalité / pas d'internet |

---

## 2. Stack Technique

| Composant | Technologie | Version |
|---|---|---|
| Frontend | React (Vite) | 19.x |
| Build Tool | Vite | 8.x |
| Backend | Django + Django REST Framework | 5.x + 3.x |
| Base de données | PostgreSQL | 18 |
| CSS | Tailwind CSS + shadcn/ui | v4 |
| Graphiques | Recharts | 3.8 |
| Authentification | JWT + Refresh Token | simplejwt |
| Temps réel | Django Channels + Redis | — |
| Internationalisation | i18next + react-i18next | — |
| Emails | SMTP Gmail | — |
| Export PDF | ReportLab | — |
| Export Excel | OpenPyXL | — |
| Gestionnaire dépendances (back) | Pipenv | — |
| Gestionnaire dépendances (front) | npm | — |
| Icons Frontend | lucide-react | — |
| HTTP Frontend | axios | — |
| Routing Frontend | react-router-dom | v7 |

### Charte Graphique AT
| Élément | Valeur |
|---|---|
| Couleur bleue principale | `#0055A4` |
| Couleur verte | `#10B981` |
| Couleur verte staff | `#059669` |
| Fond page | `#F8FAFC` |
| Fond card | `#FFFFFF` |
| Bordure top card | `10px solid #0055A4` |
| Border radius card | `24px` |
| Police titres | Barlow Condensed (700/800/900) |
| Police corps | Barlow (400/600/700) |

---

## 3. Architecture Générale

```
projet/
├── .gitignore
├── Pipfile                      ← Dépendances Python
├── Pipfile.lock
├── DOCUMENTATION_COMPLETE.md
├── endpoints_postman.txt
│
├── back/                        ← Backend Django
│   ├── .env                     ← Variables d'environnement (NON versionné)
│   ├── config/
│   │   ├── settings.py          ← Configuration Django
│   │   ├── urls.py              ← Routes principales
│   │   └── asgi.py              ← WebSocket (Channels)
│   ├── apps/
│   │   ├── users/               ← Auth, utilisateurs, lignes tél
│   │   ├── centres/             ← Centres AT, paramètres SLA
│   │   ├── tickets/             ← Réclamations, pièces jointes, escalades
│   │   ├── chat/                ← Messages WebSocket temps réel
│   │   ├── notifications/       ← Emails SMTP automatiques
│   │   └── rapports/            ← Stats, export PDF/Excel
│   ├── templates/
│   │   └── emails/
│   │       └── statut_change.html
│   └── manage.py
│
└── front/                       ← Frontend React (Vite)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx             ← Point d'entrée
        ├── App.jsx              ← Routes de l'application
        ├── index.css            ← Styles globaux + Tailwind
        ├── api/                 ← Services API (axios)
        ├── assets/              ← Logos AT, images
        ├── components/
        │   ├── ui/              ← Composants shadcn/ui (Button, Card, Badge...)
        │   ├── shared/          ← Header, LanguageSwitcher
        │   └── features/
        │       ├── portal/      ← Composants Client (CustomerTicketList, CustomerChatDrawer...)
        │       ├── workspace/   ← Composants Agent (ActiveQueue, AgentDashboard...)
        │       └── admin/       ← Composants Admin (AdminOverview, AgentManagement...)
        ├── contexts/            ← AuthContext (gestion JWT)
        ├── hooks/               ← useWebSocket
        ├── i18n/                ← Configuration i18next
        ├── locales/             ← Traductions (fr, ar, en)
        ├── layouts/             ← DashboardLayout
        ├── lib/                 ← Utilitaires (cn)
        ├── routes/              ← ProtectedRoute, RoleRoute
        ├── styles/              ← CSS spécifiques par page
        └── pages/
            ├── auth/            ← LoginClient, LoginStaff
            ├── client/          ← PortalView
            ├── agent/           ← WorkspaceView
            ├── admin/           ← AdminView
            └── errors/          ← NotFound, Unauthorized
```

---

## 4. Base de Données

### Moteur
**PostgreSQL 18** — Base de données relationnelle utilisée en développement et en production.

### Tables Principales

#### `utilisateurs`
Table commune à tous les rôles.
| Colonne | Type | Description |
|---|---|---|
| id | UUID | Identifiant unique |
| role | ENUM | client, agent, agent_technique, agent_annexe, admin |
| telephone | VARCHAR | Utilisé pour l'auth client |
| email | VARCHAR | Utilisé pour l'auth staff |
| mot_de_passe_hash | TEXT | Hash bcrypt |
| nom, prenom | VARCHAR | Identité |
| type_client | ENUM | particulier, professionnel |
| centre_id | FK | Centre de rattachement |
| actif | BOOLEAN | Compte actif/désactivé |

**Contrainte importante :** Un seul admin par centre
```sql
CREATE UNIQUE INDEX idx_un_admin_par_centre 
ON utilisateurs(centre_id) WHERE role = 'admin';
```

**Contrainte :** Email obligatoire pour agents/admin
```sql
ALTER TABLE utilisateurs
ADD CONSTRAINT chk_email_agents
CHECK (role = 'client' OR email IS NOT NULL);
```

#### `lignes_telephoniques`
Un client peut avoir plusieurs lignes (plusieurs maisons).
| Colonne | Type | Description |
|---|---|---|
| id | SERIAL | Identifiant |
| client_id | FK | Référence utilisateur (client) |
| numero | VARCHAR | Numéro de ligne (unique) |
| type_abonnement | VARCHAR | ADSL, Fibre, IDOOM... |
| num_contrat | VARCHAR | Numéro de contrat AT |
| date_abonnement | DATE | Date de souscription |
| actif | BOOLEAN | Ligne active |

#### `centres_distribution`
| Colonne | Type | Description |
|---|---|---|
| id | SERIAL | Identifiant |
| code | VARCHAR | ex: AT-ALGER-01 |
| nom | VARCHAR | Nom du centre |
| wilaya | VARCHAR | Wilaya |
| prefixes_tel | JSON | Préfixes téléphoniques couverts |
| actif | BOOLEAN | Centre actif |

#### `parametres_centre`
Configuration opérationnelle indépendante pour chaque centre.
| Colonne | Type | Description |
|---|---|---|
| centre_id | FK (PK) | Relation OneToOne avec centres_distribution |
| attribution_auto_active | BOOLEAN | Active/désactive l'attribution automatique |
| sla_heures_normale | INT | Délai SLA pour priorité normale (défaut: 48h) |
| sla_heures_haute | INT | Délai SLA pour priorité haute (défaut: 24h) |
| sla_heures_critique | INT | Délai SLA pour priorité critique (défaut: 4h) |
| updated_at | DATETIME | Dernière mise à jour |
| updated_by_id | FK | Administrateur ayant modifié |

#### `tickets`
| Colonne | Type | Description |
|---|---|---|
| id | UUID | Identifiant |
| numero_ticket | VARCHAR | ex: TKT-2026-000001 |
| client_id | FK | Client qui a déposé |
| agent_id | FK | Agent assigné |
| agent_technique_id | FK | Agent technique (si escalade) |
| agent_annexe_id | FK | Agent annexe (si escalade) |
| centre_id | FK | Centre de traitement |
| type_service_id | FK | Type de dérangement |
| statut | ENUM | soumis, ouvert, en_cours, escalade_*, resolu, ferme, rejete |
| priorite | ENUM | basse, normale, haute, critique |
| echeance_sla | DATETIME | Délai de résolution calculé auto |

#### `messages`
| Colonne | Type | Description |
|---|---|---|
| id | BIGSERIAL | Identifiant |
| ticket_id | FK | Ticket concerné |
| expediteur_id | FK | Qui a envoyé |
| expediteur_type | ENUM | client, agent, agent_technique, agent_annexe, systeme |
| contenu | TEXT | Contenu du message |
| lu_par_client | BOOLEAN | Lu par le client |
| lu_par_agent | BOOLEAN | Lu par l'agent |

#### `escalades`
| Colonne | Type | Description |
|---|---|---|
| id | SERIAL | Identifiant |
| ticket_id | FK | Ticket escaladé |
| type_escalade | ENUM | technique, annexe |
| agent_source_id | FK | Agent qui escalade |
| agent_cible_id | FK | Agent qui reçoit |
| motif | TEXT | Raison de l'escalade (obligatoire) |
| resume_ia | TEXT | Résumé IA (prévu — intégration API externe) |

#### `emails`
Journal de tous les emails envoyés.
| Colonne | Type | Description |
|---|---|---|
| id | BIGSERIAL | Identifiant |
| destinataire_id | FK | Utilisateur destinataire |
| destinataire_email | VARCHAR | Email au moment de l'envoi |
| type_email | ENUM | statut_change, ticket_resolu... |
| statut | ENUM | en_attente, envoye, echec |
| tentatives | SMALLINT | Nombre de tentatives |

#### `historique_connexions`
| Colonne | Type | Description |
|---|---|---|
| id | SERIAL | Identifiant |
| utilisateur_id | FK | Utilisateur connecté |
| date_connexion | DATETIME | Date et heure |
| adresse_ip | VARCHAR | Adresse IP |

#### Tables Django (auto-générées)
| Table | Rôle |
|---|---|
| `auth_group` | Groupes de permissions |
| `auth_group_permissions` | Liaison groupes ↔ permissions |
| `auth_permission` | Toutes les permissions du système |
| `django_admin_log` | Journal des actions dans `/admin/` |
| `django_content_type` | Registre interne des models |
| `django_migrations` | Historique des migrations appliquées |
| `django_session` | Sessions utilisateur côté serveur |
| `token_blacklist_outstandingtoken` | Tokens JWT actifs émis |
| `token_blacklist_blacklistedtoken` | Tokens JWT révoqués (après logout) |

---

## 5. Backend Django

### Structure de chaque App
Chaque app contient :
```
app/
├── models.py        ← Modèles Django
├── serializers.py   ← Sérialisation DRF
├── views.py         ← Logique des endpoints
├── urls.py          ← Routes de l'app
├── permissions.py   ← Contrôle d'accès
├── admin.py         ← Interface Django Admin
└── apps.py          ← Configuration de l'app
```

### App `users`
- Modèles : `Utilisateur`, `LigneTelephonique`, `HistoriqueConnexion`
- Auth client : téléphone + mot de passe
- Auth staff : email + mot de passe
- Permissions : `EstClient`, `EstAgent`, `EstAdmin`, `EstAgentOuPlus`, `EstAgentEscalade`

### App `centres`
- Modèles : `CentreDistribution`, `ParametresCentre`
- Gestion des centres AT et leurs paramètres SLA

### App `tickets`
- Modèles : `Ticket`, `TypeService`, `PieceJointe`, `Escalade`
- Signal `pre_save` → email automatique si statut change
- Génération automatique du numéro ticket : `TKT-{ANNÉE}-{XXXXXX}`
- Numéro généré via `MAX()` sur les numéros existants pour éviter les collisions après suppression
- **Migration de données** `0004_populate_types_service` : pré-remplit les 14 types de service automatiquement à chaque `migrate`

### App `chat`
- Modèle : `Message`
- API REST pour récupérer/envoyer des messages
- WebSocket via `ChatConsumer` (Django Channels)
- Chaque ticket a son canal : `ticket_{ticket_id}`
- Résumé IA : endpoint `/chat/{ticket_id}/summary/` (texte de résumé laissé vide — prévu pour intégration API externe)

### App `notifications`
- Modèle : `Email`
- Envoi via SMTP Gmail
- Template HTML : `templates/emails/statut_change.html`
- Déclenché automatiquement par signal Django

### App `rapports`
- Pas de modèle propre
- Utilise les données de toutes les autres apps
- Statistiques temps réel
- Export PDF (ReportLab)
- Export Excel (OpenPyXL, 2 feuilles : Tickets + Performances)

---

## 6. API Endpoints

**Base URL :** `http://127.0.0.1:8000/api`

**Headers requis (sauf login) :**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 🔐 Auth & Utilisateurs — `/api/users/`

| Méthode | URL | Rôle | Qui |
|---|---|---|---|
| POST | `/users/login/client/` | Login client | — |
| POST | `/users/login/agent/` | Login staff | — |
| POST | `/users/logout/` | Déconnexion | Tous |
| POST | `/auth/token/refresh/` | Renouveler token | Tous |
| GET | `/users/me/` | Mon profil | Tous |
| PUT | `/users/me/` | Modifier profil | Tous |
| GET | `/users/agents/` | Liste agents du centre | Admin |
| POST | `/users/agents/` | Créer agent | Admin |
| GET | `/users/agents/{id}/` | Détail agent | Admin |
| PUT | `/users/agents/{id}/` | Modifier agent | Admin |
| DELETE | `/users/agents/{id}/` | Désactiver agent | Admin |
| GET | `/users/connexions/` | Historique connexions agents | Admin |
| GET | `/users/clients/connexions/` | Historique connexions clients | Agent + Admin |
| GET | `/users/mes-lignes/` | Mes lignes téléphoniques | Client |
| POST | `/users/mes-lignes/` | Ajouter une ligne | Client |
| GET | `/users/mes-lignes/{id}/` | Détail ligne | Client |
| PUT | `/users/mes-lignes/{id}/` | Modifier ligne | Client |
| DELETE | `/users/mes-lignes/{id}/` | Désactiver ligne | Client |

### 🏢 Centres — `/api/centres/`

| Méthode | URL | Rôle | Qui |
|---|---|---|---|
| GET | `/centres/` | Liste centres | Admin |
| POST | `/centres/` | Créer centre | Admin |
| GET | `/centres/{id}/` | Détail centre | Admin |
| PUT | `/centres/{id}/` | Modifier centre | Admin |
| DELETE | `/centres/{id}/` | Désactiver centre | Admin |
| GET | `/centres/parametres/` | Voir paramètres SLA | Admin |
| PUT | `/centres/parametres/` | Modifier paramètres SLA | Admin |
| GET | `/centres/mon-centre/` | Mon centre | Tous |

### 🎫 Tickets — `/api/tickets/`

| Méthode | URL | Rôle | Qui |
|---|---|---|---|
| GET | `/tickets/types-service/` | Types de dérangement | Tous |
| GET | `/tickets/mes-tickets/` | Mes tickets | Client |
| POST | `/tickets/mes-tickets/` | Créer ticket (statut initial: soumis) | Client |
| GET | `/tickets/mes-tickets/{id}/` | Détail ticket | Client |
| POST | `/tickets/mes-tickets/{id}/` | Donner satisfaction | Client |
| DELETE | `/tickets/mes-tickets/{id}/` | Supprimer ticket (seulement si statut == soumis) | Client |
| GET | `/tickets/agent/mes-tickets/` | Tickets assignés | Agent + Tech + Annexe |
| GET | `/tickets/agent/mes-tickets/{id}/` | Détail ticket | Agent + Tech + Annexe |
| PUT | `/tickets/agent/mes-tickets/{id}/` | Changer statut | Agent |
| POST | `/tickets/agent/mes-tickets/{id}/escalader/` | Escalader | Agent |
| GET | `/tickets/escalades/` | Tickets escaladés | Agent Tech/Annexe |
| GET | `/tickets/admin/tous/` | Tous les tickets | Admin |
| POST | `/tickets/admin/{id}/attribuer/` | Attribution manuelle | Admin |
| POST | `/tickets/{id}/pieces-jointes/` | Ajouter pièce jointe | Tous |
| GET | `/tickets/pieces-jointes/{id}/download/` | Télécharger pièce jointe | Tous |
| GET | `/tickets/agent/mes-tickets/{id}/historique-client/` | Historique tickets du client | Agent |

### 💬 Chat — `/api/chat/`

| Méthode | URL | Rôle | Qui |
|---|---|---|---|
| GET | `/chat/{ticket_id}/messages/` | Voir messages | Tous |
| POST | `/chat/{ticket_id}/messages/` | Envoyer message | Tous |
| GET | `/chat/non-lus/` | Messages non lus | Tous |
| GET | `/chat/{ticket_id}/summary/` | Résumé IA du ticket | Agent + Tech + Annexe |
| WS | `ws://127.0.0.1:8000/ws/chat/{ticket_id}/` | Chat temps réel | Tous |

### 📧 Notifications — `/api/notifications/`

| Méthode | URL | Rôle | Qui |
|---|---|---|---|
| GET | `/notifications/historique/` | Historique emails | Admin |
| POST | `/notifications/tester/` | Tester SMTP | Admin |

### 📊 Rapports — `/api/rapports/`

| Méthode | URL | Rôle | Qui |
|---|---|---|---|
| GET | `/rapports/stats/` | Statistiques générales | Admin |
| GET | `/rapports/performances/` | Performances agents | Admin |
| GET | `/rapports/export/pdf/` | Export PDF | Admin |
| GET | `/rapports/export/excel/` | Export Excel | Admin |

---

## 7. Authentification JWT

### Fonctionnement
```
Client envoie : identifiant + mot de passe
Serveur répond : access_token + refresh_token
```

| Token | Durée | Usage |
|---|---|---|
| `access` | 60 minutes | Toutes les requêtes API |
| `refresh` | 7 jours | Renouveler le access token |

### Renouveler le token
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
    "refresh": "eyJhbGci..."
}
```

### Stockage côté frontend
Les tokens sont stockés dans des cookies HTTP sécurisés via `js-cookie`, avec un intercepteur Axios pour le renouvellement automatique du token expiré.

### Utilisation dans les requêtes
```javascript
// Intercepteur Axios automatique (api/axios.js)
headers: {
    Authorization: `Bearer ${Cookies.get('access')}`
}
```

---

## 8. Rôles & Permissions

| Rôle | Auth | Créé par |
|---|---|---|
| `client` | téléphone + mdp | Présentiellement chez AT |
| `agent` | email + mdp | Admin du centre |
| `agent_technique` | email + mdp | Admin du centre |
| `agent_annexe` | email + mdp | Admin du centre |
| `admin` | email + mdp | Django Admin (superuser) |

### Permissions Django (permissions.py)
```python
EstClient       → role == 'client'
EstAgent        → role == 'agent'
EstAgentTechnique → role == 'agent_technique'
EstAgentAnnexe  → role == 'agent_annexe'
EstAdmin        → role == 'admin'
EstAgentOuPlus  → role in ['agent', 'agent_technique', 'agent_annexe', 'admin']
EstAgentEscalade → role in ['agent_technique', 'agent_annexe']
```

---

## 9. Logique Métier

### Attribution Automatique des Tickets
1. Client crée un ticket
2. Un **chatbot IA** discute avec le client pour qualifier le problème et **déterminer la priorité**
3. Système détecte le centre via `client.centre`
4. Si attribution auto activée → attribue à l'agent avec le moins de tickets actifs
5. Calcule l'échéance SLA selon la priorité définie par l'IA

### Calcul SLA
| Priorité | Délai par défaut |
|---|---|
| Basse | 72 heures |
| Normale | 48 heures |
| Haute | 24 heures |
| Critique | 4 heures |

Ces délais sont configurables par centre dans `ParametresCentre`.

### Transitions de Statut
```
soumis            → ouvert (lorsqu'un agent prend en charge), rejete, (suppression par le client)
ouvert            → en_cours, rejete
en_cours          → resolu, escalade_technique, escalade_annexe, rejete
escalade_technique → resolu, ferme
escalade_annexe   → resolu, ferme
resolu            → ferme
```

### Escalade
- L'agent décide d'escalader si le problème est trop complexe
- Motif obligatoire
- Le ticket passe en statut `escalade_technique` ou `escalade_annexe`
- L'agent technique/annexe voit **toute la discussion** avec le client
- Résumé IA prévu (intégration API externe en cours)

### Numérotation des Tickets
- Format : `TKT-{ANNÉE}-{XXXXXX}`
- Exemple : `TKT-2026-000001`
- Génération : basée sur `MAX()` des numéros existants pour éviter les collisions après suppression de tickets

---

## 10. WebSocket & Chat

### Architecture
```
Client React ←→ WebSocket ←→ Django Channels ←→ Redis ←→ Autres clients
```

### URL WebSocket
```
ws://127.0.0.1:8000/ws/chat/{ticket_id}/
```

### Format des messages WebSocket
**Envoyer :**
```json
{
    "contenu": "Bonjour, ma connexion est coupée !"
}
```

**Recevoir :**
```json
{
    "type": "message",
    "message_id": 1,
    "contenu": "Bonjour, ma connexion est coupée !",
    "expediteur_id": "uuid...",
    "expediteur_nom": "Benali",
    "expediteur_prenom": "Karim",
    "expediteur_type": "client",
    "created_at": "2026-03-29T14:39:30.240906+01:00"
}
```

> ⚠️ **Note :** Le WebSocket nécessite Redis installé et Daphne comme serveur ASGI. En développement sans Redis, le système utilise automatiquement un **fallback HTTP** via l'API REST `/api/chat/{ticket_id}/messages/`.

---

## 11. Notifications Email

### Déclencheur
Un email est envoyé automatiquement au client quand le statut de son ticket change vers : `en_cours`, `resolu`, `ferme`, `rejete`.

### Fonctionnement
```
Changement statut ticket
        ↓
Signal pre_save Django
        ↓
notifier_changement_statut()
        ↓
Template HTML rendu
        ↓
Envoi SMTP Gmail
        ↓
Enregistrement dans table emails
```

### Configuration SMTP (.env)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-app
```

---

## 12. Rapports & Exports

### Statistiques (temps réel)
- Total tickets par statut
- Tickets par priorité
- Tickets par type de dérangement
- Évolution par jour (7 derniers jours)
- Évolution par mois (6 derniers mois)
- Satisfaction client moyenne

### Performances des Agents
- Total tickets traités
- Taux de résolution (%)
- Taux d'escalade (%)
- Temps moyen de résolution (minutes)
- Satisfaction client moyenne
- Dernière connexion

### Export PDF
- Généré avec ReportLab
- Contient : statistiques générales + tableau performances agents
- Couleurs Algérie Télécom (`#0055A4`)
- Nom de fichier : `rapport_{CODE_CENTRE}_{DATE}.pdf`

### Export Excel
- Généré avec OpenPyXL
- Feuille 1 : Liste complète des tickets
- Feuille 2 : Performances des agents
- Nom de fichier : `rapport_{CODE_CENTRE}_{DATE}.xlsx`

---

## 13. Frontend React

### Stack Frontend
- **React 19** avec **Vite 8** comme bundler
- **Tailwind CSS v4** + **shadcn/ui** pour le design system
- **Recharts** pour les graphiques et statistiques
- **i18next** pour l'internationalisation (Français, Arabe, Anglais)
- **lucide-react** pour les icônes
- **axios** avec intercepteurs JWT automatiques
- **react-router-dom v7** pour le routing
- **js-cookie** pour le stockage des tokens

### Routes
| URL | Page | Composant | Rôle |
|---|---|---|---|
| `/` | Login Client | `LoginClient` | Public |
| `/staff` | Login Staff | `LoginStaff` | Public |
| `/client/dashboard` | Portail Client | `PortalView` | Client |
| `/agent/dashboard` | Console Agent | `WorkspaceView` | Agent |
| `/technique/dashboard` | Console Technique | `WorkspaceView` | Agent Technique |
| `/annexe/dashboard` | Console Annexe | `WorkspaceView` | Agent Annexe |
| `/admin/dashboard` | Dashboard Admin | `AdminView` | Admin |
| `/unauthorized` | Page non autorisé | `Unauthorized` | — |
| `*` | Page 404 | `NotFound` | — |

### Composants Principaux

#### Client (`components/features/portal/`)
- **`CustomerTicketList`** — Liste des tickets avec filtres, recherche et statuts visuels
- **`CustomerChatDrawer`** — Drawer latéral responsive avec chat en temps réel, prévisualisation des pièces jointes et détails du ticket
- Suppression autorisée uniquement si le ticket est au statut `soumis`

#### Agent (`components/features/workspace/`)
- **`ActiveQueue`** — File d'attente des tickets avec indicateurs SLA et priorité
- **`AgentDashboard`** — KPI dynamiques (résolutions du jour, respect SLA)
- **`WorkspaceView`** — Console complète : barre d'infos ticket (client, téléphone, service, description), panneau d'escalade, chat responsive, résumé IA
- Vue unique partagée entre Agent, Agent Technique et Agent Annexe (via prop `agentRole`)

#### Admin (`components/features/admin/`)
- **`AdminOverview`** — Vue d'ensemble avec graphiques Recharts (BarChart, AreaChart, PieChart), KPI globaux, dimensions commutables (types, temps, priorité, agents)
- **`AgentManagement`** — CRUD complet des agents du centre
- **`AdminView`** — Interface unifiée avec onglets (Overview, Tickets, Agents, Rapports, Paramètres)

#### Shared (`components/shared/`)
- **Header** dynamique selon le rôle de l'utilisateur authentifié
- **LanguageSwitcher** — Changement de langue (FR/AR/EN)

### Fonctionnalités Transverses
- **Responsive Design** — Toutes les interfaces s'adaptent au mobile, tablette et desktop
- **Chat temps réel** — WebSocket avec fallback HTTP automatique
- **Internationalisation** — Support complet FR, AR (direction RTL), EN
- **Thème Algérie Télécom** — Palette cohérente `#0055A4`, typographie Barlow, design premium avec glassmorphism et micro-animations

---

## 14. Lancer le Projet

### Prérequis
- **Python 3.14+** avec **Pipenv**
- **Node.js 18+** avec **npm**
- **PostgreSQL 18** (installé et service actif)
- **Redis** (optionnel — nécessaire uniquement pour le WebSocket en production)

### Backend
```bash
cd back

# Installer les dépendances Python
pipenv install

# Appliquer les migrations (crée les tables dans PostgreSQL)
pipenv run python manage.py migrate

# Créer le superuser (admin)
pipenv run python manage.py createsuperuser

# Lancer le serveur
pipenv run python manage.py runserver
```

### Frontend
```bash
cd front

# Installer les dépendances Node
npm install

# Lancer le serveur de développement
npm run dev
```

### Créer les données de test
```bash
pipenv run python manage.py shell
```
```python
from apps.centres.models import CentreDistribution, ParametresCentre
from apps.users.models import Utilisateur
from apps.tickets.models import TypeService

# Centre
centre = CentreDistribution.objects.create(
    code='AT-ALGER-01',
    nom='Centre Alger Centre',
    wilaya='Alger',
    prefixes_tel=['0561', '0562', '0770', '0771']
)
ParametresCentre.objects.create(centre=centre)

# Rattacher l'admin au centre
admin = Utilisateur.objects.first()
admin.centre = centre
admin.save()

# Client test
client = Utilisateur.objects.create(
    role='client', nom='Benali', prenom='Karim',
    telephone='0561234567', type_client='particulier',
    num_contrat='AT-2024-001', centre=centre,
)
client.set_password('client123')
client.save()

# Types de service
types = [
    ('PAS_TONALITE', 'Pas de tonalité', 3),
    ('PAS_INTERNET', "Pas d'internet", 3),
    ('CHUTE_DEBIT', 'Chute de débit internet', 2),
    # ... etc
]
for code, libelle, priorite in types:
    TypeService.objects.create(code=code, libelle=libelle, priorite_defaut=priorite)
```

### Variables d'environnement (.env)
Créer le fichier `back/.env` (ce fichier n'est **pas versionné** sur GitHub) :
```env
SECRET_KEY=dev-secret-key-change-en-prod
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=reclamations_at
DB_USER=postgres
DB_PASSWORD=votre-mot-de-passe-postgres
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://localhost:6379/0

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-app

ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173
```

---

## 15. Décisions Techniques

| Décision | Choix | Raison |
|---|---|---|
| Un seul modèle utilisateur | Table `utilisateurs` unique | Simplifier les jointures et l'auth |
| Stockage pièces jointes | BYTEA PostgreSQL | Pas de serveur de fichiers externe |
| Auth client | Téléphone + mdp | AT identifie ses clients par numéro |
| Auth staff | Email + mdp | Standard professionnel |
| Pas d'inscription client | Login seul | Base clients existante chez AT |
| Attribution automatique | Agent le moins chargé | Équilibrage de charge |
| Centre du client | `client.centre` FK | Rattachement présentiel chez AT |
| Plusieurs lignes tél | Table `LigneTelephonique` | Client peut avoir plusieurs maisons |
| Notifications | Email SMTP seul | Simple, pas de dépendance externe |
| CSS | Tailwind CSS v4 + shadcn/ui | Rendu premium, composants réutilisables |
| Graphiques | Recharts | Bibliothèque React native, responsive |
| Base de données | PostgreSQL 18 | Performance et robustesse en production |
| Bundler Frontend | Vite 8 | Build rapide, hot reload instantané |
| Internationalisation | i18next | Support FR, AR (RTL), EN |
| Numéro ticket | `TKT-{ANNÉE}-{XXXXXX}` via MAX() | Lisible, unique, résiste aux suppressions |
| Admin par centre | Un seul admin | Contrainte métier AT |
| Tokens JWT | Cookies HTTP (js-cookie) | Plus sécurisé que localStorage |

---

## 📊 Diagrammes UML

Les codes PlantUML pour les diagrammes de classes et de cas d'utilisation sont disponibles séparément.

---

*Documentation générée dans le cadre du PFE — Algérie Télécom Portail Réclamations*
*Stack : React 19 + Vite 8 + Django 5 + PostgreSQL 18*
