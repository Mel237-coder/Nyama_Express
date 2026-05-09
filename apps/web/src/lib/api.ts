// ============================================
// Configuration API Client
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl = API_URL;

  private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // AUTH
  // ============================================

  async requestOtp(phone: string) {
    return this.fetch('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, code: string) {
    return this.fetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(userId: string, token: string) {
    return this.fetch('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId }),
      token,
    });
  }

  // ============================================
  // RESTAURANTS
  // ============================================

  async getRestaurants(params?: {
    city?: string;
    zoneId?: string;
    cuisineType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value.toString());
      });
    }
    return this.fetch(`/api/restaurants?${query.toString()}`);
  }

  async getRestaurant(id: string) {
    return this.fetch(`/api/restaurants/${id}`);
  }

  // ============================================
  // MENU
  // ============================================

  async getCategories(restaurantId: string) {
    return this.fetch(`/api/restaurants/${restaurantId}/categories`);
  }

  async getMenuItems(restaurantId: string, categoryId?: string) {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return this.fetch(`/api/restaurants/${restaurantId}/items${query}`);
  }

  // ============================================
  // ORDERS
  // ============================================

  async createOrder(data: {
    restaurantId: string;
    items: { menuItemId: string; quantity: number; options?: string[] }[];
    deliveryAddress: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    deliveryNotes?: string;
    paymentMethod: string;
  }, token: string) {
    return this.fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async getOrders(token: string, page = 1, limit = 20) {
    return this.fetch(`/api/orders?page=${page}&limit=${limit}`, { token });
  }

  async getOrder(orderId: string, token: string) {
    return this.fetch(`/api/orders/${orderId}`, { token });
  }

  async updateOrderStatus(orderId: string, status: string, token: string) {
    return this.fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    });
  }

  async getAdminOrders(token: string, page = 1, limit = 20) {
    return this.fetch(`/api/admin/orders?page=${page}&limit=${limit}`, { token });
  }


  // ============================================
  // PAYMENTS
  // ============================================

  async initiatePayment(data: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    phone?: string;
  }, token: string) {
    return this.fetch('/api/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async getPaymentStatus(paymentId: string, token: string) {
    return this.fetch(`/api/payments/status/${paymentId}`, { token });
  }

  // ============================================
  // USER
  // ============================================

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    language?: string;
  }, token: string) {
    return this.fetch('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  }

  async updatePaymentPhone(phone: string, token: string) {
    return this.fetch('/api/users/payment-phone', {
      method: 'PUT',
      body: JSON.stringify({ phone }),
      token,
    });
  }

  async getAddresses(token: string) {

    return this.fetch('/api/users/addresses', { token });
  }

  async addAddress(data: {
    label: string;
    street: string;
    latitude?: number;
    longitude?: number;
    zoneId?: string;
    isDefault?: boolean;
  }, token: string) {
    return this.fetch('/api/users/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async updateItemAvailability(itemId: string, available: boolean, token: string) {
    return this.fetch(`/api/menu-items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available }),
      token,
    });
  }

  async updateMenuItem(itemId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  }, token: string) {
    return this.fetch(`/api/menu-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  }

  async uploadImage(formData: FormData, token: string) {
    return this.fetch('/api/uploads/image', {
      method: 'POST',
      body: formData,
      token,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }


export const api = new ApiClient();

// ============================================
// STORAGE HELPERS
// ============================================

export const storage = {
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  setAccessToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  },

  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },

  setRefreshToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('refreshToken', token);
  },

  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};