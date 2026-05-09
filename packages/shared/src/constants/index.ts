// ============================================
// Constantes partagées pour toute l'application
// ============================================

// Langues supportées
export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

// Format de téléphone camerounais
export const CAMEROON_PHONE_REGEX = /^(\+237)?[62][0-9]{8}$/;
export const CAMEROON_FIXED_REGEX = /^(\+237)?2[0-9]{8}$/;

// Préfixes téléphonique camerounais
export const PHONE_PREFIX = '+237';

// Opérateurs
export const OPERATORS = {
  MTN: ['67', '68', '69'],
  ORANGE: ['65', '66', '69'], // Nexttel utilise 2xx
  NEXTEL: ['2'],
} as const;

// Devise
export const CURRENCY = 'XAF';
export const CURRENCY_SYMBOL = 'FCFA';
export const CURRENCY_DISPLAY = 'F'; // Affichage court

// Frais de livraison par défaut (FCFA)
export const DEFAULT_DELIVERY_FEE = 500;

// Commission plateforme (pourcentage)
export const PLATFORM_COMMISSION_PERCENT = 15;

// OTP
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 3;

// Délai d'acceptation de commande livreur (secondes)
export const DELIVERY_ACCEPT_TIMEOUT_SECONDS = 60;

// Statuts de commande
export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

// Statuts de paiement
export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  INITIATED: 'INITIATED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

// Moyens de paiement
export const PAYMENT_METHODS = {
  MTN_MOMO: 'MTN_MOMO',
  ORANGE_MONEY: 'ORANGE_MONEY',
  CASH: 'CASH',
  NOTCHPAY: 'NOTCHPAY',
} as const;

// Villes cibles
export const CITIES = ['Yaoundé', 'Douala', 'Bafoussam', 'Bamenda', 'Garoua'] as const;

// Seuils de déclaration ANIF (FCFA)
export const ANIF_DECLARATION_THRESHOLD = 5_000_000; // 5 millions FCFA

// Duration formats
export const TIMEZONE = 'Africa/Douala'; // CET/WAT

// Map settings
export const MAP_DEFAULTS = {
  CENTER_LAT: 3.848, // Yaoundé
  CENTER_LNG: 11.502,
  DEFAULT_ZOOM: 14,
  TILE_URL: 'https://tile.openstreetmap.org',
} as const;