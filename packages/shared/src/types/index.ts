// ============================================
// Types et interfaces partagés
// ============================================

import { User, Restaurant, Order, Payment, UserRole, OrderStatus, PaymentStatus } from '@prisma/client';

// ============================================
// UTILISATEURS
// ============================================

export interface CreateUserDto {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  language?: 'fr' | 'en';
  role: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  language?: 'fr' | 'en';
}

export interface UserResponse {
  id: string;
  phone: string;
  role: UserRole;
  status: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatar: string | null;
  language: string;
  createdAt: Date;
}

// ============================================
// AUTHENTIFICATION
// ============================================

export interface RequestOtpDto {
  phone: string;
  role?: UserRole;
}

export interface VerifyOtpDto {
  phone: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

// ============================================
// RESTAURANTS
// ============================================

export interface CreateRestaurantDto {
  name: string;
  description?: string;
  descriptionEn?: string;
  phone: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  cuisineTypes?: string[];
  openingHours?: OpeningHours;
  deliveryRadius?: number;
}

export interface OpeningHours {
  [day: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

export interface RestaurantResponse {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  logo: string | null;
  coverImage: string | null;
  cuisineTypes: string[];
  openingHours: OpeningHours;
  deliveryRadius: number;
  isActive: boolean;
  totalOrders: number;
  avgRating: number;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

// ============================================
// MENUS
// ============================================

export interface CreateCategoryDto {
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateMenuItemDto {
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  preparationTime?: number;
}

// ============================================
// COMMANDES
// ============================================

export interface CreateOrderDto {
  restaurantId: string;
  items: {
    menuItemId: string;
    quantity: number;
    options?: string[];
  }[];
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryNotes?: string;
  paymentMethod: 'MTN_MOMO' | 'ORANGE_MONEY' | 'CASH' | 'NOTCHPAY';
  promotionCode?: string;
}

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  commission: number;
  discount: number;
  total: number;
  deliveryAddress: string;
  pickupCode: string;
  items: OrderItemResponse[];
  restaurant: {
    id: string;
    name: string;
    logo: string | null;
    phone: string;
  };
  deliveryPerson: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string;
  } | null;
  createdAt: Date;
}

export interface OrderItemResponse {
  id: string;
  menuItemId: string;
  name: string;
  nameEn: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  options: string[];
}

// ============================================
// PAIEMENTS
// ============================================

export interface InitiatePaymentDto {
  orderId: string;
  phone?: string;
}

export interface PaymentResponse {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  expiresAt?: Date;
}

export interface PaymentWebhookPayload {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
  amount?: number;
  currency?: string;
}

// ============================================
// LIVRAISON
// ============================================

export interface DeliveryPersonResponse {
  id: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string;
    avatar: string | null;
  };
  vehicleType: string;
  isActive: boolean;
}

export interface LocationUpdate {
  orderId: string;
  latitude: number;
  longitude: number;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// FILTRES
// ============================================

export interface RestaurantFilters {
  city?: string;
  zoneId?: string;
  cuisineType?: string;
  minRating?: number;
  isOpen?: boolean;
  search?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  restaurantId?: string;
  clientId?: string;
  deliveryPersonId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}