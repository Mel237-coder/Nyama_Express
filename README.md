# FoodApp Cameroun 🍔📱

Application de livraison de repas adaptée au marché camerounais.
 similaire à Uber Eats mais pensée pour les réalités locales.

## Fonctionnalités principales

- **Authentification par OTP SMS** - Inscription sans email, validation par code à 6 chiffres
- **Paiement Mobile Money** - MTN MoMo, Orange Money, NotchPay (agrégateur)
- **Suivi en temps réel** - Socket.io pour la géolocalisation livreur
- **Interface bilingue** - Français et anglais
- **PWA installable** - Fonctionne hors ligne, légère pour connexions 3G

## Stack technique

- **Frontend**: Next.js 14 (PWA), React, TailwindCSS
- **Backend**: NestJS, Prisma ORM, PostgreSQL, Redis
- **Temps réel**: Socket.io
- **Paiement**: MTN MoMo API, Orange Money API, NotchPay
- **SMS**: Africa's Talking

## Architecture du projet

```
projet_mini_max/
├── apps/
│   └── web/                    # Frontend Next.js (PWA)
├── packages/
│   ├── api/                   # API NestJS
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Schéma complet de la BDD
│   │   └── src/
│   │       ├── auth/          # Authentification OTP
│   │       ├── payments/       # MTN, Orange, NotchPay
│   │       ├── restaurants/    # CRUD restaurants
│   │       ├── orders/        # Gestion commandes
│   │       ├── deliveries/     # Module livreur
│   │       ├── websocket/     # Temps réel
│   │       └── common/        # Services partagés (SMS)
│   └── shared/                # Types et constantes
├── docker-compose.yml
├── .env.example
└── README.md
```

## Démarrage rapide

### Prérequis

- Node.js 18+
- Docker et Docker Compose
- npm ou pnpm

### Installation

1. **Cloner et installer les dépendances**

```bash
npm install
```

2. **Configurer l'environnement**

```bash
cp .env.example .env
# Éditer .env avec vos clés API
```

3. **Démarrer les services (PostgreSQL, Redis, API)**

```bash
docker-compose up -d
```

4. **Générer le client Prisma et migrer la BDD**

```bash
npm run db:push -w packages/api
npm run db:generate -w packages/api
```

5. **Démarrer le frontend**

```bash
npm run dev -w apps/web
```

L'application est disponible sur http://localhost:3002

## Configuration des variables d'environnement

### API Keys requises

```env
# Africa's Talking (SMS OTP)
AFRICASTALKING_API_KEY=votre_cle_api
AFRICASTALKING_USERNAME=sandbox

# MTN MoMo (sandbox)
MTN_SUBSCRIPTION_KEY=votre_subscription_key
MTN_API_USER=votre_api_user
MTN_API_KEY=votre_api_key
MTN_TARGET_ENVIRONMENT=sandbox

# NotchPay (fallback)
NOTCHPAY_PUBLIC_KEY=votre_cle_publique

# Base de données
DATABASE_URL=postgresql://foodapp:foodapp_secret@localhost:5432/foodapp
```

## Endpoints API principaux

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/request-otp` | Demande un code OTP |
| POST | `/api/auth/verify-otp` | Vérifie le code et retourne les JWT |
| POST | `/api/auth/refresh` | Rafraîchit le token |

### Restaurants

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/restaurants` | Liste des restaurants |
| GET | `/api/restaurants/:id` | Détail restaurant + menu |
| POST | `/api/restaurants` | Créer un restaurant |

### Commandes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/orders` | Créer une commande |
| GET | `/api/orders/:id` | Détail commande |
| PUT | `/api/orders/:id/confirm` | Restaurant confirme |
| PUT | `/api/orders/:id/cancel` | Annuler commande |

### Paiements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/payments/initiate` | Initier un paiement |
| GET | `/api/payments/status/:id` | Vérifier le statut |
| POST | `/api/payments/mtn/callback` | Webhook MTN |

## Format des montants

Tous les montants sont en **Francs CFA (XAF)** sans décimales:

```typescript
// Affichage correct
"2 500 FCFA" ou "2 500 F"

// En base de données: nombre entier
price: 2500  // 2500 FCFA
```

## Format des numéros de téléphone

Formats acceptés:

- `+2376xxxxxxxx` (MTN/Orange)
- `6xxxxxxxx` (sans préfixe)
- `2376xxxxxxxx` (avec 237)

## Conformité réglementaire

- Journalisation de toutes les transactions (ANIF)
- Seuils de déclaration: transactions > 5 000 000 FCFA
- KYC pour restaurants et livreurs
- Conservation des logs pendant 5 ans minimum

## WebSocket Events

### Client → Serveur

- `order:subscribe` - S'abonner au suivi d'une commande
- `delivery:location_update` - Position du livreur

### Serveur → Client

- `order:status_changed` - Changement de statut
- `delivery:location` - Position temps réel du livreur
- `delivery:assigned` - Notification d'assignation livreur

## Déploiement en production

```bash
# Build des images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Déploiement
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Licence

Propriétaire - Tous droits réservés