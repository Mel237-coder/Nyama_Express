# FoodApp Cameroun — Redesign UI/UX

> **Date:** 2026-05-13  
> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

## Goal

Redesign complet du frontend FoodApp Cameroun avec une direction **Vibrant Africain / Savane Terre**, fond clair, en s'inspirant de l'UX d'Uber Eats et de l'identité culturelle camerounaise.

## Design Direction (brainstorming validé)

| Choix | Valeur |
|-------|--------|
| Direction | Vibrant Africain |
| Fond | Clair |
| Palette | Savane Terre |
| Cartes restaurant | Verticales (Uber Eats) |
| Header | Minimal + Tabs Livraison/À emporter |
| Catégories | Pills / Texte |

### Palette Savane Terre

```css
--bg-primary:    #F5F0E8   /* beige sable */
--bg-white:      #FFFFFF   /* blanc cartes */
--accent-primary:#D84315   /* terre cuite (boutons, badges actifs, header tabs actif) */
--accent-secondary:#F9A825 /* or terreux (étoiles, highlights, tags) */
--accent-tertiary:#2E7D32  /* vert forêt (statut ouvert, succès) */
--text-primary:  #1A1A1A   /* presque noir */
--text-secondary:#666666   /* gris moyen */
--text-muted:    #999999   /* gris clair */
--border:        #E8E4DC   /* bordure douce */
--shadow:        rgba(0,0,0,0.06) /* ombres subtiles */
```

### Principes UX

1. **Fond clair** `#F5F0E8` partout, cartes `#FFFFFF` avec ombres subtiles (`0 4px 16px rgba(0,0,0,0.06)`)
2. **Photos appétissantes** en premier plan — pas d'effets glassmorphism qui masquent les images
3. **Typographie bold** — titres en `font-extrabold`, interligne serré
4. **Badges informatifs** : "Meilleure offre" (terre cuite), note étoilée (or), temps (overlay noir translucide)
5. **Catégories pills** : pastilles arrondies, actif = fond terre cuite + texte blanc, inactif = fond blanc + bordure grise
6. **Boutons principaux** : fond terre cuite `#D84315`, texte blanc, border-radius 12px
7. **Bottom nav** : fond blanc, icônes Lucide, actif = terre cuite
8. **Inputs** : fond `#F5F0E8`, border-radius 24px (style recherche Uber Eats)

## Pages à Redesigner

### P1. Accueil (`/pages/index.tsx`)

- Header minimal blanc avec logo "FoodApp" + localisation + icône profil
- Tabs **Livraison / À emporter** — actif = terre cuite rempli, inactif = beige
- Barre de recherche : fond beige `#F5F0E8`, border-radius 24px, icône loupe, placeholder "Rechercher un restaurant..."
- Catégories pills horizontales scrollables : Tous, Africaine, Fast-Food, Grill, Asiatique, Pizza, Indienne
- Liste cartes verticales : photo full-width, badge "Meilleure offre" en haut à gauche, temps de livraison overlay bas droit, nom bold, description, ligne avec note étoilée (or) + frais + statut ouvert (vert)
- Skeleton loading : shimmer beige

### P2. Détail Restaurant (`/pages/restaurant/[id].tsx`)

- Couverture full-width avec photo, bouton retour circule blanc en overlay haut gauche
- Avatar/logo rond centré chevauchant la couverture
- Nom bold centré, note étoile + temps + distance sur une ligne
- Tabs **Menu / Infos** avec indicateur terre cuite actif
- Filtres catégories en pills colorés
- Items du menu : photo carrée à droite, nom + description + prix à gauche, bouton "+" terre cuite rond
- Modal customizer (panier) avec fond blanc, border-radius haut

### P3. Panier (`/pages/cart.tsx`)

- Header "Panier" avec bouton retour
- Liste items : photo carrée, nom, prix unitaire, quantité +/-, prix total
- Résumé : sous-total, frais de livraison, total en bold
- Bouton "Commander" plein largeur terre cuite

### P4. Checkout (`/pages/checkout.tsx`)

- Adresses sauvegardées en pills/pills sélectionnables
- Sélecteur d'adresse sur carte (si disponible)
- Résumé commande
- Méthodes de paiement : MTN MoMo, Orange Money, Espèces — icônes + radio buttons
- Bouton confirmer terre cuite

### P5. Profil (`/pages/profile.tsx`)

- Header avec avatar rond + nom
- Sections en cards blanches : Informations personnelles, Téléphone de paiement, Adresses, Paramètres
- Icônes Lucide colorées (terre cuite, or, vert)

### P6. Login (`/pages/login.tsx`)

- Fond beige clair
- Card blanche centrée avec ombre
- Logo FoodApp en haut
- Input email : fond beige, bordure douce
- Bouton "Continuer" terre cuite
- Décompte OTP avec champs numériques séparés

### P7. Liste Commandes (`/pages/orders/index.tsx`)

- Header "Mes commandes"
- Cartes verticales : numéro de commande, restaurant, date, statut coloré (terre cuite = en cours, vert = livré, rouge = annulé), montant total

### P8. Suivi Commande (`/pages/orders/[id].tsx`)

- Timeline verticale avec étapes colorées
- Carte de tracking Leaflet
- Info livreur (si disponible)
- Bouton "Confirmer réception" vert

### P9. Admin Dashboard (`/pages/admin/dashboard.tsx`)

- Cards KPI : commandes aujourd'hui, revenus, utilisateurs actifs — couleurs savane
- Graphiques simples (barres/lignes) avec palette terre cuite/or/vert
- Liste activité récente

### P10. Admin Users (`/pages/admin/users.tsx`)

- Table avec fond blanc, lignes alternées beige clair
- Badges rôle : ADMIN (terre cuite), CLIENT (vert), RESTAURANT_OWNER (or)
- Filtres et recherche

### P11. Admin Menu (`/pages/admin/menu.tsx`)

- Header restaurant
- Grid d'items : photo, nom, prix, toggle disponibilité (switch vert/terre cuite)
- Bouton "Ajouter" flottant terre cuite

### P12. Admin Orders (`/pages/admin/orders.tsx`)

- Kanban colonnes : En attente, En préparation, Prête, En livraison
- Cartes drag & drop avec couleurs de statut

### P13. Admin Restaurants (`/pages/admin/restaurants.tsx`)

- Grid de cartes : logo, nom, adresse, statut actif/inactif
- Toggle rapide

### P14. Admin Analytics (`/pages/admin/analytics.tsx`)

- Graphiques avec chart.js ou recharts
- Palette savane appliquée aux datasets

## Composants Partagés à Modifier

| Composant | Fichier | Changements |
|-----------|---------|-------------|
| NeonBottomNav | `components/layout/NeonBottomNav.tsx` | Fond blanc, icônes Lucide, actif terre cuite, supprimer glassmorphism |
| GlassCard | `components/layout/GlassCard.tsx` | Fond blanc `#FFFFFF`, border `1px solid #E8E4DC`, ombre douce, border-radius 16px |
| NeonButton | `components/layout/NeonButton.tsx` | Fond terre cuite `#D84315`, texte blanc, border-radius 12px, hover plus foncé |
| GlassHeader | `components/layout/GlassHeader.tsx` | Fond blanc avec border-bottom douce, texte bold noir, supprimer glassmorphism |
| FloatingCartBar | `components/layout/FloatingCartBar.tsx` | Fond terre cuite, badge blanc, texte blanc |
| api.ts | `lib/api.ts` | Pas de changement fonctionnel |
| globals.css | `styles/globals.css` | Mettre à jour les variables CSS avec la palette savane |

## Shared Styles (globals.css)

```css
:root {
  --bg-primary: #F5F0E8;
  --bg-card: #FFFFFF;
  --accent: #D84315;
  --accent-hover: #BF360C;
  --accent-secondary: #F9A825;
  --accent-tertiary: #2E7D32;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border: #E8E4DC;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

## Notes

- Garder `lucide-react` pour toutes les icônes — remplacer tout emoji restant.
- Photos des restaurants : utiliser Unsplash food URLs en fallback si pas de coverImage.
- Responsive : mobile-first, max-width 480px centrée sur desktop.
- Animations subtiles uniquement : fade-in sur les cartes, active-scale 0.98 sur les boutons.
- Pas de glassmorphism / néon / animation agressive — design épuré et chaleureux.
