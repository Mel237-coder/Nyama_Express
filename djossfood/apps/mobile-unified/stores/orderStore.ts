import { create } from 'zustand';
import type { Order } from '@djossfood/database';
import { joinRoom, leaveRoom, onEvent, offEvent } from '../services/socket';

interface DriverLocation {
  driver_id: string;
  lat: number;
  lng: number;
  timestamp: string;
}

interface OrderWithDriver extends Order {
  _driverLocation?: DriverLocation;
}

interface OrderState {
  activeOrders: Order[];
  orderHistory: Order[];
  currentOrder: OrderWithDriver | null;
  setActiveOrders: (orders: Order[]) => void;
  setOrderHistory: (orders: Order[]) => void;
  setCurrentOrder: (order: Order | null) => void;
  subscribeToOrder: (orderId: string) => void;
  unsubscribeFromOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, updates: Partial<Order>) => void;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  activeOrders: [],
  orderHistory: [],
  currentOrder: null,

  setActiveOrders: (orders) => set({ activeOrders: orders }),

  setOrderHistory: (orders) => set({ orderHistory: orders }),

  setCurrentOrder: (order) => set({ currentOrder: order }),

  subscribeToOrder: (orderId) => {
    joinRoom(`order:${orderId}`);

    const statusHandler = (data: Partial<Order>) => {
      get().updateOrderStatus(orderId, data);
    };

    const locationHandler = (data: DriverLocation) => {
      const current = get().currentOrder;
      if (current && current.id === orderId) {
        set({
          currentOrder: { ...current, _driverLocation: data },
        });
      }
    };

    onEvent('order_status_update', statusHandler);
    onEvent('driver_location', locationHandler);
  },

  unsubscribeFromOrder: (orderId) => {
    leaveRoom(`order:${orderId}`);
    offEvent('order_status_update');
    offEvent('driver_location');
  },

  updateOrderStatus: (orderId, updates) => {
    set((state) => ({
      activeOrders: state.activeOrders.map((o) =>
        o.id === orderId ? { ...o, ...updates } : o,
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, ...updates }
          : state.currentOrder,
    }));
  },
}));