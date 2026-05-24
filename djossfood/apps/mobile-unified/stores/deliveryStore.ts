import { create } from 'zustand';

interface DeliveryRequest {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  earnings: number;
}

interface DeliveryState {
  isOnline: boolean;
  activeOrderId: string | null;
  deliveryRequest: DeliveryRequest | null;
  isRequestVisible: boolean;
  requestTimer: ReturnType<typeof setTimeout> | null;
  goOnline: () => void;
  goOffline: () => void;
  setActiveOrderId: (id: string | null) => void;
  setDeliveryRequest: (request: DeliveryRequest | null) => void;
  showRequest: (request: DeliveryRequest) => void;
  dismissRequest: () => void;
}

export const useDeliveryStore = create<DeliveryState>()((set, get) => ({
  isOnline: false,
  activeOrderId: null,
  deliveryRequest: null,
  isRequestVisible: false,
  requestTimer: null,

  goOnline: () => set({ isOnline: true }),

  goOffline: () => {
    const { requestTimer } = get();
    if (requestTimer) clearTimeout(requestTimer);
    set({ isOnline: false, deliveryRequest: null, isRequestVisible: false, requestTimer: null });
  },

  setActiveOrderId: (id) => set({ activeOrderId: id }),

  setDeliveryRequest: (request) => set({ deliveryRequest: request }),

  showRequest: (request) => {
    const { requestTimer } = get();
    if (requestTimer) clearTimeout(requestTimer);
    const timer = setTimeout(() => {
      set({ deliveryRequest: null, isRequestVisible: false, requestTimer: null });
    }, 30_000);
    set({ deliveryRequest: request, isRequestVisible: true, requestTimer: timer });
  },

  dismissRequest: () => {
    const { requestTimer } = get();
    if (requestTimer) clearTimeout(requestTimer);
    set({ deliveryRequest: null, isRequestVisible: false, requestTimer: null });
  },
}));
