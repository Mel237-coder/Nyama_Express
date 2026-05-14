import React, { useState, useEffect } from 'react';
import { api, storage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { MenuCard } from '../../components/admin/MenuCard';
import { GlassCard } from '../../components/layout/GlassCard';
import { NeonButton } from '../../components/layout/NeonButton';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { X } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
}

export default function MenuAdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMenuItems();
    }
  }, [isAuthenticated, user]);

  async function fetchMenuItems() {
    try {
      setIsLoading(true);
      const token = storage.getAccessToken();
      if (!token) return;

      const restaurantId = (user as any).restaurantId;
      const data: any = await api.getMenuItems(restaurantId);
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleAvailability(id: string, available: boolean) {
    try {
      const token = storage.getAccessToken();
      if (!token) return;
      await api.updateItemAvailability(id, available, token);
      setItems(prev => prev.map(item => item.id === id ? { ...item, available } : item));
    } catch (error) {
      console.error('Failed to update availability:', error);
      alert('Error updating availability');
    }
  }

  async function handleSaveItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSaveLoading(true);
      const formData = new FormData(e.currentTarget);
      const updateData: any = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
      };

      const token = storage.getAccessToken();
      if (!token) return;

      // Handle image upload if a new file is selected
      const imageFile = formData.get('image') as File;
      if (imageFile && imageFile.name) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const uploadRes: any = await api.uploadImage(uploadData, token);
        updateData.imageUrl = uploadRes.url;
      }

      await api.updateMenuItem(editingItem.id, updateData, token);

      setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...updateData } : item));
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Error saving item');
    } finally {
      setSaveLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center">
          <p className="text-white/60">Please log in to access the menu editor.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <GlassHeader title="Menu Management" sticky={false} />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Menu Management</h1>
            <p className="text-white/50">Manage your dishes and their availability in real-time.</p>
          </div>
          <NeonButton>+ Add New Item</NeonButton>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                onToggleAvailability={handleToggleAvailability}
                onEdit={setEditingItem}
              />
            ))}
          </div>
        )}

        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <GlassCard className="max-w-md w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Edit Menu Item</h2>
                <button onClick={() => setEditingItem(null)} className="text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Item Name</label>
                  <input
                    name="name"
                    defaultValue={editingItem.name}
                    required
                    className="neon-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingItem.description}
                    rows={3}
                    className="neon-input resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Price (FCFA)</label>
                  <input
                    name="price"
                    type="number"
                    defaultValue={editingItem.price}
                    required
                    className="neon-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Image</label>
                  <input
                    name="image"
                    type="file"
                    accept="image/*"
                    className="neon-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFD600]/10 file:text-[#FFD600] hover:file:bg-[#FFD600]/20"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 ghost-btn"
                  >
                    Cancel
                  </button>
                  <NeonButton type="submit" disabled={saveLoading} className="flex-1">
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
