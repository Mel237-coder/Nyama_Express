import React, { useState, useEffect } from 'react';
import { api, storage } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { MenuCard } from '../components/admin/MenuCard';

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

      // For now we assume the user's restaurantId is stored or can be fetched.
      // In a real app, we'd get the restaurantId from the user's profile or a session.
      // For this implementation, we use a mock or fetch the restaurant associated with the user.
      const restaurantId = (user as any).restaurantId;
      const data = await api.getMenuItems(restaurantId);
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
      const updateData = {
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
        const uploadRes = await api.uploadImage(uploadData, token);
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
    return <div className="p-8 text-center">Please log in to access the menu editor.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500">Manage your dishes and their availability in real-time.</p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors">
          + Add New Item
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit Menu Item</h2>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  name="name"
                  defaultValue={editingItem.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem.description}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (FCFA)</label>
                <input
                  name="price"
                  type="number"
                  defaultValue={editingItem.price}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
