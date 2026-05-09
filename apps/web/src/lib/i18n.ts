// ============================================
// Configuration i18n - Bilinguisme FR/EN
// ============================================

export const languages = ['fr', 'en'] as const;
export type Language = (typeof languages)[number];

export const translations = {
  fr: {
    // Navigation
    home: 'Accueil',
    restaurants: 'Restaurants',
    orders: 'Mes commandes',
    profile: 'Mon profil',
    logout: 'Déconnexion',
    login: 'Connexion',

    // Accueil
    searchPlaceholder: 'Rechercher un restaurant...',
    popularRestaurants: 'Restaurants populaires',
    categories: 'Catégories',
    allCategories: 'Toutes les catégories',

    // Restaurant
    menu: 'Menu',
    reviews: 'Avis',
    info: 'Informations',
    deliveryTime: 'Temps de livraison',
    minimumOrder: 'Commande minimum',
    deliveryFee: 'Frais de livraison',
    openNow: 'Ouvert maintenant',
    closed: 'Fermé',

    // Panier
    cart: 'Panier',
    addToCart: 'Ajouter au panier',
    emptyCart: 'Votre panier est vide',
    checkout: 'Commander',
    total: 'Total',

    // Paiement
    payment: 'Paiement',
    paymentMethod: 'Moyen de paiement',
    mtnMoMo: 'MTN MoMo',
    orangeMoney: 'Orange Money',
    cashOnDelivery: 'Payer à la livraison',
    payNow: 'Payer maintenant',
    paymentPending: 'Paiement en attente...',
    paymentSuccess: 'Paiement réussi !',
    paymentFailed: 'Paiement échoué',

    // Commandes
    orderPlaced: 'Commande passée',
    orderConfirmed: 'Commande confirmée',
    preparing: 'En préparation',
    ready: 'Prête',
    onTheWay: 'En route',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    orderNumber: 'Commande',
    trackOrder: 'Suivre ma commande',

    // OTP Auth
    enterPhone: 'Votre numéro de téléphone',
    sendCode: 'Recevoir un code',
    enterCode: 'Entrez le code de vérification',
    verify: 'Vérifier',
    resendCode: 'Renvoyer le code',
    codeSent: 'Code envoyé !',

    // Erreurs
    networkError: 'Erreur de connexion',
    tryAgain: 'Réessayer',
    somethingWrong: 'Une erreur est survenue',

    // Paramètres
    settings: 'Paramètres',
    language: 'Langue',
    french: 'Français',
    english: 'English',
    notifications: 'Notifications',
    darkMode: 'Mode sombre',

    // Divers
    FCFA: 'FCFA',
    perPerson: '/ pers',
    min: 'min',
    km: 'km',
    rating: 'note',
    add: 'Ajouter',
    remove: 'Retirer',
    close: 'Fermer',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    loading: 'Chargement...',
    noResults: 'Aucun résultat',
  },

  en: {
    // Navigation
    home: 'Home',
    restaurants: 'Restaurants',
    orders: 'My orders',
    profile: 'My profile',
    logout: 'Logout',
    login: 'Login',

    // Home
    searchPlaceholder: 'Search for a restaurant...',
    popularRestaurants: 'Popular restaurants',
    categories: 'Categories',
    allCategories: 'All categories',

    // Restaurant
    menu: 'Menu',
    reviews: 'Reviews',
    info: 'Information',
    deliveryTime: 'Delivery time',
    minimumOrder: 'Minimum order',
    deliveryFee: 'Delivery fee',
    openNow: 'Open now',
    closed: 'Closed',

    // Cart
    cart: 'Cart',
    addToCart: 'Add to cart',
    emptyCart: 'Your cart is empty',
    checkout: 'Checkout',
    total: 'Total',

    // Payment
    payment: 'Payment',
    paymentMethod: 'Payment method',
    mtnMoMo: 'MTN MoMo',
    orangeMoney: 'Orange Money',
    cashOnDelivery: 'Cash on delivery',
    payNow: 'Pay now',
    paymentPending: 'Payment pending...',
    paymentSuccess: 'Payment successful!',
    paymentFailed: 'Payment failed',

    // Orders
    orderPlaced: 'Order placed',
    orderConfirmed: 'Order confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    onTheWay: 'On the way',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    orderNumber: 'Order',
    trackOrder: 'Track my order',

    // OTP Auth
    enterPhone: 'Your phone number',
    sendCode: 'Receive a code',
    enterCode: 'Enter verification code',
    verify: 'Verify',
    resendCode: 'Resend code',
    codeSent: 'Code sent!',

    // Errors
    networkError: 'Connection error',
    tryAgain: 'Try again',
    somethingWrong: 'An error occurred',

    // Settings
    settings: 'Settings',
    language: 'Language',
    french: 'Français',
    english: 'English',
    notifications: 'Notifications',
    darkMode: 'Dark mode',

    // Misc
    FCFA: 'FCFA',
    perPerson: '/ person',
    min: 'min',
    km: 'km',
    rating: 'rating',
    add: 'Add',
    remove: 'Remove',
    close: 'Close',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    noResults: 'No results',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

/**
 * Get translation for current language
 */
export function t(key: TranslationKey, lang: Language = 'fr'): string {
  return translations[lang][key] || translations.fr[key] || key;
}

/**
 * Format price in FCFA
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} F`;
}

/**
 * Detect browser language
 */
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';

  const browserLang = navigator.language.split('-')[0];
  return languages.includes(browserLang as Language) ? (browserLang as Language) : 'fr';
}