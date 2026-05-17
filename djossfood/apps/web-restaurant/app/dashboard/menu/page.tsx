'use client';

import { useState } from 'react';
import { useMenu } from '@/hooks/use-menu';
import { CategoryTabs } from '@/components/menu/category-tabs';
import { ItemTable } from '@/components/menu/item-table';
import { ItemModal } from '@/components/menu/item-modal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { MenuItem } from '@djossfood/database';

export default function MenuPage() {
  const { menu, isLoading } = useMenu();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCreateItem, setShowCreateItem] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Filter items by active category
  const filteredItems = activeCategory
    ? menu.flatMap((cat) =>
        cat.id === activeCategory ? cat.items : [],
      )
    : menu.flatMap((cat) => cat.items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gestion du menu</h2>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowCreateItem(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un article
        </Button>
      </div>

      <CategoryTabs
        categories={menu}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <div className="rounded-lg border bg-card">
        <ItemTable items={filteredItems} onEdit={(item) => setEditingItem(item)} />
      </div>

      {/* Create/Edit item modal */}
      {(showCreateItem || editingItem) && (
        <ItemModal
          categories={menu}
          item={editingItem}
          open={showCreateItem || !!editingItem}
          onClose={() => {
            setEditingItem(null);
            setShowCreateItem(false);
          }}
        />
      )}
    </div>
  );
}