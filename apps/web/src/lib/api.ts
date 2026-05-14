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
    if (!endpoint || endpoint === '/') {
      console.error('[ApiClient] Empty endpoint requested. Options:', options);
      throw new Error('Empty API endpoint');
    }

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

  async requestOtp(email: string, phone?: string) {
    return this.fetch('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, phone }),
    });
  }

  async verifyOtp(email: string, code: string) {
    return this.fetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
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
  // USERS (ADMIN)
  // ============================================

  async getUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }, token?: string) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value.toString());
      });
    }
    return this.fetch(`/api/users?${query.toString()}`, { token });
  }

  async getUser(id: string, token?: string) {
    return this.fetch(`/api/users/${id}`, { token });
  }

  async updateUser(id: string, data: any, token?: string) {
    return this.fetch(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteUser(id: string, token?: string) {
    return this.fetch(`/api/users/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async getUserStats(token?: string) {
    return this.fetch('/api/users/stats', { token });
  }

  // ============================================
  // ADMIN DASHBOARD
  // ============================================

  async getAdminDashboard(token?: string) {
    return this.fetch('/api/admin/dashboard', { token });
  }

  async getAdminActivity(token?: string) {
    return this.fetch('/api/admin/activity', { token });
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

  async getDeliveryTracking(orderId: string, token: string) {
    return this.fetch(`/api/orders/${orderId}/tracking`, { token });
  }

  async updateOrderStatus(orderId: string, status: string, token: string) {
    return this.fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    });
  }

  async confirmDelivery(orderId: string, token: string) {
    return this.fetch(`/api/orders/${orderId}/confirm-delivery`, {
      method: 'POST',
      token,
    });
  }

  async getAdminOrders(token: string, page = 1, limit = 20) {
    return this.fetch(`/api/admin/orders?page=${page}&limit=${limit}`, { token });
  }

  async getAnalytics(token: string) {
    return this.fetch('/api/admin/analytics', { token });
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

  async updateAddress(addressId: string, data: {
    label: string;
    street: string;
    latitude?: number;
    longitude?: number;
    zoneId?: string;
    isDefault?: boolean;
  }, token: string) {
    return this.fetch(`/api/users/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  }

  async deleteAddress(addressId: string, token: string) {
    return this.fetch(`/api/users/addresses/${addressId}`, {
      method: 'DELETE',
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

  // ============================================
  // DELIVERERS
  // ============================================

  async registerDeliverer(data: {
    phone: string; firstName: string; lastName: string;
    cniNumber: string; cniPhotoUrl: string; selfieUrl: string;
    vehicleType: string; vehiclePlate?: string; zoneId: string;
  }) {
    return this.fetch('/api/deliverers/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async getDelivererStatus(token: string) { return this.fetch('/api/deliverers/status', { token }); }
  async setDelivererOnline(token: string) { return this.fetch('/api/deliverers/online', { method: 'POST', token }); }
  async setDelivererOffline(token: string) { return this.fetch('/api/deliverers/offline', { method: 'POST', token }); }
  async updateDelivererLocation(token: string, lat: number, lng: number) {
    return this.fetch('/api/deliverers/location', { method: 'POST', body: JSON.stringify({ latitude: lat, longitude: lng }), token });
  }
  async getMissions(token: string, status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.fetch(`/api/deliverers/missions${query}`, { token });
  }
  async acceptMission(orderId: string, token: string) {
    return this.fetch(`/api/deliverers/missions/${orderId}/accept`, { method: 'POST', token });
  }
  async updateMissionStatus(orderId: string, status: string, token: string) {
    return this.fetch(`/api/deliverers/missions/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token });
  }
  async getEarnings(token: string) { return this.fetch('/api/deliverers/earnings', { token }); }
  async getWithdrawals(token: string) { return this.fetch('/api/deliverers/withdrawals', { token }); }
  async createWithdrawal(data: { amount: number; provider: string; providerAccount: string }, token: string) {
    return this.fetch('/api/deliverers/withdrawals', { method: 'POST', body: JSON.stringify(data), token });
  }
  async getDelivererProfile(token: string) { return this.fetch('/api/deliverers/profile', { token }); }
  async updateDelivererProfile(data: any, token: string) {
    return this.fetch('/api/deliverers/profile', { method: 'PATCH', body: JSON.stringify(data), token });
  }

  // ============================================
  // USERS — BECOME DELIVERER
  // ============================================

  async becomeDeliverer(data: {
    cniNumber: string; cniPhotoUrl: string; selfieUrl: string;
    vehicleType: string; vehiclePlate?: string; zoneId: string;
  }, token: string) {
    return this.fetch('/api/users/become-deliverer', { method: 'PATCH', body: JSON.stringify(data), token });
  }
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