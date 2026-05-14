import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  MapPin,
  Plus,
  Check,
  ArrowLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api, storage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { AddressCard } from '../../components/profile/AddressCard';
import { AddressForm } from '../../components/profile/AddressForm';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { NeonButton } from '../../components/layout/NeonButton';

export interface Address {
  id: string;
  label: string;
  street: string;
  latitude?: number;
  longitude?: number;
  landmarks?: string;
  zoneId?: string;
  isDefault: boolean;
}

export interface AddressData {
  label: string;
  street: string;
  latitude?: number;
  longitude?: number;
  landmarks?: string;
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
      const data: any = await api.getAddresses(token);
      setAddresses(data);
    } catch (e) {
      setMessage({ text: 'Failed to load addresses', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async (addressData: AddressData) => {
    setSaving(true);
    setMessage(null);
    try {
      const token = storage.getAccessToken() || '';
      if (editingAddress) {
        await api.updateAddress(editingAddress.id, addressData, token);
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
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 font-medium">Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <GlassHeader
        title="Address Book"
        right={
          <button
            onClick={() => router.push('/profile')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-white/70" />
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20' : 'bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20'}`}>
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Add Address Button */}
        {!isAdding && (
          <NeonButton onClick={() => setIsAdding(true)} className="w-full">
            <Plus size={20} />
            Add New Address
          </NeonButton>
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
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider px-1">Saved Addresses</h2>
          {addresses.length === 0 ? (
            <div className="text-center py-12 glass">
              <MapPin className="mx-auto text-white/20 mb-3" size={40} />
              <p className="text-white/40">No addresses saved yet</p>
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
