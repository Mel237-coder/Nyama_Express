import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
  image_url?: string | null;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  deliveryFee: number;
  minOrderAmount: number;
  items: CartItem[];
  addItem: (item: CartItem, restaurantId: string, restaurantName: string, deliveryFee: number, minOrderAmount: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      deliveryFee: 0,
      minOrderAmount: 0,
      items: [],

      addItem: (item, restaurantId, restaurantName, deliveryFee, minOrderAmount) => {
        const state = get();
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          set({
            restaurantId,
            restaurantName,
            deliveryFee,
            minOrderAmount,
            items: [{ ...item, quantity: item.quantity || 1 }],
          });
          return;
        }

        const existingIndex = state.items.findIndex((i) => i.menu_item_id === item.menu_item_id);
        let newItems: CartItem[];

        if (existingIndex >= 0) {
          newItems = state.items.map((i, idx) =>
            idx === existingIndex ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i,
          );
        } else {
          newItems = [...state.items, { ...item, quantity: item.quantity || 1 }];
        }

        set({
          restaurantId: restaurantId || state.restaurantId,
          restaurantName: restaurantName || state.restaurantName,
          deliveryFee: deliveryFee ?? state.deliveryFee,
          minOrderAmount: minOrderAmount ?? state.minOrderAmount,
          items: newItems,
        });
      },

      removeItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.menu_item_id !== menuItemId),
        }));
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menu_item_id === menuItemId ? { ...i, quantity } : i,
          ),
        }));
      },

      updateInstructions: (menuItemId, instructions) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.menu_item_id === menuItemId ? { ...i, special_instructions: instructions } : i,
          ),
        }));
      },

      clearCart: () => {
        set({
          restaurantId: null,
          restaurantName: null,
          deliveryFee: 0,
          minOrderAmount: 0,
          items: [],
        });
      },

      subtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      total: () => {
        const sub = get().subtotal();
        return sub + get().deliveryFee;
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'djossfood-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);