'use client';

import type { MenuItem } from '@djossfood/database';

interface Category {
  id: string | null;
  name: string;
  items: any[];
}

interface ItemModalProps {
  categories: Category[];
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

export function ItemModal({ categories, item, open, onClose }: ItemModalProps) {
  // Placeholder - will be implemented in Task 9
  if (!open) return null;
  return null;
}