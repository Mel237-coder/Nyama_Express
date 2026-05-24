// ============================================================================
// @djossfood/database – Shared TypeScript types matching the Supabase schema
// ============================================================================

// ---------------------------------------------------------------------------
// Enum types
// ---------------------------------------------------------------------------

export type UserRole = 'client' | 'driver' | 'restaurant_owner' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'driver_assigned'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partial'
  | 'completed';

export type PaymentMethod = 'cash' | 'mobile_money' | 'card';

export type DriverStatus = 'offline' | 'available' | 'busy' | 'on_delivery';

export type RestaurantStatus = 'closed' | 'open' | 'busy' | 'temporarily_closed';

// ---------------------------------------------------------------------------
// GeoJSON helpers
// ---------------------------------------------------------------------------

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// ---------------------------------------------------------------------------
// DB row interfaces – 12 tables
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  city: string;
  address: string;
  location: GeoJSONPoint | null;
  phone: string | null;
  email: string | null;
  cuisine_types: string[];
  opening_hours: Record<string, unknown>;
  image_url: string | null;
  is_active: boolean;
  is_approved: boolean;
  status: RestaurantStatus;
  base_rating: number;
  admin_boost: number;
  total_rating: number;
  rating_count: number;
  min_order_amount: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  preparation_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  client_id: string;
  restaurant_id: string;
  driver_id: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  delivery_location: GeoJSONPoint | null;
  delivery_address: string | null;
  route_distance_km: number | null;
  route_duration_minutes: number | null;
  notes: string | null;
  cancellation_reason: string | null;
  confirmed_at: string | null;
  preparing_started_at: string | null;
  ready_at: string | null;
  driver_assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions: string | null;
  created_at: string;
}

export interface Driver {
  id: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  current_location: GeoJSONPoint | null;
  status: DriverStatus;
  rating: number;
  rating_count: number;
  wallet_balance: number;
  is_approved: boolean;
  documents: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  order_id: string;
  reviewer_id: string;
  restaurant_id: string;
  driver_id: string | null;
  restaurant_rating: number;
  driver_rating: number | null;
  comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference: string | null;
  phone: string | null;
  provider_response: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  target_type: string;
  target_id: string;
  action: string;
  action_type: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface SearchLog {
  id: string;
  user_id: string | null;
  query: string;
  city: string | null;
  results_count: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API request / response types
// ---------------------------------------------------------------------------

export interface OrderCreationData {
  client_id: string;
  restaurant_id: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    special_instructions?: string;
  }>;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  payment_method: PaymentMethod;
  payment_phone: string;
  delivery_notes?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  city: string;
  address: string;
  phone: string | null;
  cuisine_types: string[];
  total_rating: number;
  rating_count: number;
  min_order_amount: number;
  distance_km: number | null;
  matching_items: string | null;
}
