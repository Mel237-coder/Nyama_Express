# FoodApp Cameroun — Application Livreur (Delivery Person App)

> **Date:** 2026-05-14  
> **Approche:** Route isolée dans `apps/web` (`/deliverer/*`) avec layout dédié  
> **Palette:** Savane Terre (cohérente avec l'app client)

---

## 1. Goal

Créer une interface dédiée pour les livreurs (`UserRole.DELIVERY_PERSON`) permettant :
- L'inscription avec vérification KYC (CNI, selfie, véhicule)
- La réception et l'acceptation de missions en temps réel
- Le suivi GPS des livraisons
- La gestion des gains et des retraits

---

## 2. Architecture

### 2.1 Frontend

Route isolée dans l'app Next.js existante (`apps/web`) sous le préfixe `/deliverer/*`.

- **Layout dédié** : full-screen mobile, bottom nav compact, pas de header fixe
- **PWA** : `manifest.json` alternatif pour l'installation comme app native
- **Auth** : réutilise le même flow JWT OTP existant, redirect selon `UserRole`
- **API client** : réutilise `ApiClient` existant (`lib/api.ts`)
- **WebSocket** : connexion Socket.io existante, événements étendus

### 2.2 Backend

Nouveaux endpoints dans `packages/api` :
- Module `deliverers/` : gestion des missions, statuts, gains
- Module `withdrawals/` : demandes de retrait (extension du modèle existant)
- WebSocket gateway : événements `mission:*` et `deliverer:*`

---

## 3. Pages et Routes

| Route | Page | Description | Auth |
|-------|------|-------------|------|
| `/deliverer/login` | Login | Même OTP que client, redirect `DELIVERY_PERSON` | Public |
| `/deliverer/register` | Register | Inscription KYC complète | Public |
| `/deliverer/dashboard` | Dashboard | Statut en ligne, missions proches, gains jour | DELIVERY_PERSON |
| `/deliverer/missions` | Missions | Liste des missions (disponibles, actives, historique) | DELIVERY_PERSON |
| `/deliverer/mission/[id]` | Mission Detail | Détail d'une mission avec navigation | DELIVERY_PERSON |
| `/deliverer/tracking` | Tracking | Carte Leaflet temps réel, boutons statut | DELIVERY_PERSON |
| `/deliverer/earnings` | Earnings | Historique livraisons, commissions, solde | DELIVERY_PERSON |
| `/deliverer/withdrawals` | Withdrawals | Demande de retrait vers mobile money | DELIVERY_PERSON |
| `/deliverer/profile` | Profile | Documents KYC, véhicule, zone | DELIVERY_PERSON |

---

## 4. Design System

### 4.1 Palette

Même palette Savane Terre que l'app client :

```css
--bg-primary:    #F5F0E8   /* beige sable */
--bg-card:       #FFFFFF   /* blanc cartes */
--accent:        #D84315   /* terre cuite (actions urgentes) */
--accent-hover:  #BF360C   /* terre cuite foncé */
--accent-secondary:#F9A825 /* or (gains, commissions) */
--accent-tertiary:#2E7D32  /* vert (en ligne, succès) */
--text-primary:  #1A1A1A
--text-secondary:#666666
--text-muted:    #999999
--border:        #E8E4DC
```

### 4.2 Composants dédiés livreur

| Composant | Fichier | Description |
|-----------|---------|-------------|
| `DelivererLayout` | `components/deliverer/DelivererLayout.tsx` | Layout full-screen avec bottom nav |
| `DelivererBottomNav` | `components/deliverer/DelivererBottomNav.tsx` | Nav 5 items : Missions, Tracking, Gains, Profil |
| `MissionCard` | `components/deliverer/MissionCard.tsx` | Carte mission : distance, commission, adresses |
| `StatusBadge` | `components/deliverer/StatusBadge.tsx` | Badge statut livreur (ONLINE, OFFLINE, BUSY) |
| `EarningsCard` | `components/deliverer/EarningsCard.tsx` | KPI gains (jour, semaine, mois) |
| `TrackingMap` | `components/deliverer/TrackingMap.tsx` | Carte Leaflet temps réel |
| `StatusButtons` | `components/deliverer/StatusButtons.tsx` | Boutons changement statut mission |

---

## 5. Flows Utilisateur

### 5.1 Inscription indépendante

```
1. /deliverer/register
2. Téléphone → POST /api/auth/request-otp
3. OTP → POST /api/auth/verify-otp → JWT token temporaire
4. Formulaire KYC :
   - Prénom / Nom
   - CNI (numéro + photo)
   - Selfie photo
   - Type véhicule (MOTORCYCLE, BICYCLE, CAR, FOOT)
   - Zone de couverture (sélection parmi les Zone existantes)
5. POST /api/deliverers/register
6. Status = PENDING (attente validation admin)
7. Redirection page "En attente de validation"
```

### 5.2 Conversion client → livreur

```
1. Client connecté sur /profile
2. Bouton "Devenir livreur"
3. Formulaire KYC (même que 5.1 étape 4)
4. PATCH /api/users/become-deliverer
5. Rôle change en DELIVERY_PERSON, status = PENDING
6. Redirection page "En attente de validation"
```

### 5.3 Validation admin

```
1. Admin sur /admin/users
2. Filtre rôle = DELIVERY_PERSON, status = PENDING
3. Table avec : nom, téléphone, CNI, véhicule, zone
4. Bouton "Approuver" → PATCH /api/admin/deliverers/:id/approve
5. Status = ACTIVE, livreur peut désormais voir les missions
```

### 5.4 Mission lifecycle

```
1. Livreur passe ONLINE (toggle sur dashboard)
2. WebSocket : émission `deliverer:online` avec position GPS
3. Serveur émet `mission:new` quand commande prête
4. Livreur voit mission sur dashboard + notification
5. Livreur clique "Accepter" → POST /api/deliverers/missions/:id/accept
6. Statut mission = ASSIGNED, livreur = BUSY
7. Navigation vers restaurant (carte + adresse)
8. Bouton "Commande récupérée" → statut PICKED_UP
9. Navigation vers client
10. Bouton "Livrée" → statut DELIVERED
11. Livreur redevient AVAILABLE
```

---

## 6. Backend — Endpoints API

### 6.1 Deliverers Module

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/deliverers/register` | Inscription complète avec KYC | Public (OTP) |
| GET | `/api/deliverers/status` | Récupère le statut actuel du livreur | DELIVERY_PERSON |
| PATCH | `/api/deliverers/status` | Change ONLINE / OFFLINE / BUSY | DELIVERY_PERSON |
| GET | `/api/deliverers/missions` | Liste missions (query: status, zone) | DELIVERY_PERSON |
| POST | `/api/deliverers/missions/:id/accept` | Accepter une mission | DELIVERY_PERSON |
| POST | `/api/deliverers/missions/:id/reject` | Refuser une mission | DELIVERY_PERSON |
| PATCH | `/api/deliverers/missions/:id/status` | Mettre à jour statut (PICKED_UP, IN_TRANSIT, DELIVERED) | DELIVERY_PERSON |
| GET | `/api/deliverers/missions/:id` | Détail d'une mission | DELIVERY_PERSON |
| GET | `/api/deliverers/earnings` | Historique gains et commissions | DELIVERY_PERSON |
| GET | `/api/deliverers/profile` | Profil KYC du livreur | DELIVERY_PERSON |
| PATCH | `/api/deliverers/profile` | Modifier profil / documents | DELIVERY_PERSON |

### 6.2 Users Module (extension)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| PATCH | `/api/users/become-deliverer` | Conversion client → livreur | CLIENT |

### 6.3 Withdrawals Module (extension)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/deliverers/withdrawals` | Liste des retraits | DELIVERY_PERSON |
| POST | `/api/deliverers/withdrawals` | Demande de retrait | DELIVERY_PERSON |
| GET | `/api/deliverers/balance` | Solde actuel | DELIVERY_PERSON |

### 6.4 Admin Module (extension)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/admin/deliverers/pending` | Liste livreurs en attente | ADMIN |
| PATCH | `/api/admin/deliverers/:id/approve` | Approuver un livreur | ADMIN |
| PATCH | `/api/admin/deliverers/:id/reject` | Rejeter avec raison | ADMIN |
| GET | `/api/admin/deliverers` | Tous les livreurs | ADMIN |

---

## 7. WebSocket Événements

### 7.1 Client → Server

| Événement | Payload | Description |
|-----------|---------|-------------|
| `deliverer:online` | `{ lat, lng }` | Livreur passe en ligne |
| `deliverer:offline` | `{}` | Livreur passe hors-ligne |
| `deliverer:location_update` | `{ lat, lng }` | Position GPS périodique (toutes les 5s) |
| `deliverer:accept_mission` | `{ missionId }` | Accepter une mission |
| `deliverer:update_status` | `{ missionId, status }` | Changer statut mission |

### 7.2 Server → Client

| Événement | Payload | Description |
|-----------|---------|-------------|
| `mission:new` | `{ mission }` | Nouvelle mission disponible |
| `mission:assigned` | `{ missionId }` | Mission attribuée à ce livreur |
| `mission:cancelled` | `{ missionId, reason }` | Mission annulée par restaurant/admin |
| `order:status_changed` | `{ orderId, status }` | Changement statut commande (restaurant) |
| `deliverer:approved` | `{}` | Compte approuvé par admin |

---

## 8. Data Models — Prisma (extensions)

Le schéma existant supporte déjà `UserRole.DELIVERY_PERSON`, `DeliveryStatus`, `VehicleType`, `Withdrawal`, `Document`.

### 8.1 Extensions nécessaires

```prisma
// Ajouter au model User
model User {
  // ... existing fields ...
  vehicleType   VehicleType?   // MOTORCYCLE, BICYCLE, CAR, FOOT
  vehiclePlate  String?        // Plaque d'immatriculation
  isOnline      Boolean        @default(false)
  currentLat    Float?
  currentLng    Float?
  lastLocationAt DateTime?
}
```

### 8.2 Commission & Solde

La commission livreur est calculée :
```
deliveryPersonEarning = order.deliveryFee * (1 - PLATFORM_COMMISSION_PERCENT / 100)
```

Le solde est agrégé à la volée depuis les commandes livrées non-retirées. Pas de table wallet séparée en v1.

---

## 9. Error Handling

| Scénario | Comportement |
|----------|--------------|
| Livreur OFFLINE reçoit `mission:new` | Ignoré, pas d'alerte |
| GPS indisponible | Warning toast, ne bloque pas l'acceptation |
| Mission acceptée par un autre | Toast "Mission déjà prise", refresh liste |
| Client annule pendant livraison | Alert modale, retour au dashboard, mission comptabilisée comme partielle |
| Paiement retrait échoué | Retry possible, statut FAILED loggé |
| KYC rejeté | Page "Compte rejeté" avec raison, possibilité de ré-upload |

---

## 10. Testing Strategy

- **Unit** : calcul commission, transitions statut mission
- **Integration** : flow accept-mission → status updates → delivered
- **E2E** : inscription KYC complète, WebSocket temps réel
- **Mobile** : test PWA installable, offline mode (carte cachée)

---

## 11. Notes

- **Performance** : la carte Leaflet doit utiliser le provider gratuit (OpenStreetMap) pour le livreur, pas de clé API requise.
- **Sécurité** : tracking GPS uniquement pendant mission active. Quand OFFLINE, pas d'envoi de position.
- **Notifications** : utiliser le module `notifications` existant (SMS + in-app) pour alerter le livreur d'une nouvelle mission.
- **Pas de chat v1** : le chat client-livreur est marqué comme optionnel. Si le temps le permet, utiliser Socket.io rooms.
