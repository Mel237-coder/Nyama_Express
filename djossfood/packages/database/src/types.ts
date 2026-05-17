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

export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded' | 'failed';

export type PaymentMethod = 'orange_money' | 'mtn_mobile_money';

export type DriverStatus = 'offline' | 'available' | 'busy';

export type RestaurantStatus = 'open' | 'closed' | 'busy';

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
  phone: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  city: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  location: GeoJSONPoint | null;
  cuisine_types: string[];
  opening_hours: Record<string, unknown>;
  status: RestaurantStatus;
  base_rating: number;
  admin_boost: number;
  total_rating: number;
  rating_count: number;
  avg_preparation_time: number | null;
  min_order_amount: number;
  delivery_fee: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  tags: string[];
  is_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  restaurant_id: string;
  driver_id: string | null;
  status: OrderStatus;
  delivery_address: string;
  delivery_location: GeoJSONPoint | null;
  delivery_notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  amount_paid_upfront: number;
  amount_paid_delivery: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_phone: string | null;
  payment_ref_upfront: string | null;
  payment_ref_delivery: string | null;
  confirmed_at: string | null;
  preparing_started_at: string | null;
  ready_at: string | null;
  driver_assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  expires_at: string | null;
  route_distance_km: number | null;
  route_duration_min: number | null;
  route_polyline: string | null;
  estimated_delivery_time: string | null;
  client_confirmed_delivery: boolean;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions: string | null;
  subtotal: number;
}

export interface Driver {
  id: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  license_number: string | null;
  current_location: GeoJSONPoint | null;
  current_location_updated_at: string | null;
  status: DriverStatus;
  rating: number;
  rating_count: number;
  total_deliveries: number;
  payout_method: PaymentMethod | null;
  payout_phone: string | null;
  wallet_balance: number;
  is_approved: boolean;
  documents: Record<string, unknown>;
  created_at: string;
}

export interface Rating {
  id: string;
  order_id: string;
  client_id: string;
  restaurant_id: string;
  driver_id: string | null;
  restaurant_rating: number;
  driver_rating: number | null;
  restaurant_comment: string | null;
  driver_comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  sent_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  method: PaymentMethod;
  phone: string;
  amount: number;
  reference: string;
  status: PaymentStatus;
  type: 'upfront' | 'delivery';
  api_response: Record<string, unknown> | null;
  initiated_at: string;
  completed_at: string | null;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
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
  logo_url: string | null;
  cover_url: string | null;
  cuisine_types: string[];
  total_rating: number;
  rating_count: number;
  avg_preparation_time: number | null;
  delivery_fee: number;
  min_order_amount: number;
  status: RestaurantStatus;
  distance_km: number | null;
  matching_items: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  }>;
}