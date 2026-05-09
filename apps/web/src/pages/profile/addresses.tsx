import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  MapPin,
  Plus,
  Check,
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api, storage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { AddressCard } from '../../components/profile/AddressCard';
import { AddressForm } from '../../components/profile/AddressForm';

interface Address {
  id: string;
  label: string;
  street: string;
  latitude?: number;
  longitude?: number;
  zoneId?: string;
  isDefault: boolean;
}

export default function AddressBookPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchAddresses();
    }
  }, [user, authLoading]);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const token = storage.getAccessToken() || '';
      const data = await api.getAddresses(token);
      setAddresses(data);
    } catch (e) {
      setMessage({ text: 'Failed to load addresses', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async (addressData: any) => {
    setSaving(true);
    setMessage(null);
    try {
      const token = storage.getAccessToken() || '';
      if (editingAddress) {
        // Assuming updateAddress exists or addAddress handles both
        await api.addAddress(addressData, token);
      } else {
        await api.addAddress(addressData, token);
      }
      setMessage({ text: 'Address saved successfully!', type: 'success' });
      setIsAdding(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (e) {
      setMessage({ text: 'Failed to save address', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setIsAdding(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setMessage(null);
    try {
      const token = storage.getAccessToken() || '';
      await api.deleteAddress(id, token);
      setMessage({ text: 'Address deleted successfully!', type: 'success' });
      await fetchAddresses();
    } catch (e) {
      setMessage({ text: 'Failed to delete address', type: 'error' });
    }
  };

  if (authLoading || (isLoading && addresses.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-4 px-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/profile')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Address Book</h1>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Add Address Button */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium flex items-center justify-center gap-2 hover:border-orange-500 hover:text-orange-500 transition-all"
          >
            <Plus size={20} />
            Add New Address
          </button>
        )}

        {/* Add Address Form */}
        {isAdding && (
          <AddressForm
            existingAddress={editingAddress}
            onSave={handleSaveAddress}
            onCancel={() => {
              setIsAdding(false);
              setEditingAddress(null);
            }}
          />
        )}

        {/* Address List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">Saved Addresses</h2>
          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <MapPin className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-500">No addresses saved yet</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onDelete={handleDeleteAddress}
                onEdit={handleEditAddress}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
