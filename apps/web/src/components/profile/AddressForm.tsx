import React, { useState } from 'react';
import { MapPin, Loader2, Save, Check, AlertCircle } from 'lucide-react';
import { AddressData, Address } from '../../pages/profile/addresses';
import { NeonButton } from '../layout/NeonButton';
import { GlassCard } from '../layout/GlassCard';

interface AddressFormProps {
  onSave: (address: AddressData) => void;
  onCancel: () => void;
  existingAddress?: Address;
}

export function AddressForm({ onSave, onCancel, existingAddress }: AddressFormProps) {
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [form, setForm] = useState<AddressData>({
    label: existingAddress?.label || '',
    street: existingAddress?.street || '',
    latitude: existingAddress?.latitude || undefined,
    longitude: existingAddress?.longitude || undefined,
    landmarks: existingAddress?.landmarks || '',
    isDefault: existingAddress?.isDefault || false,
  });

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Permission denied. Please enter address manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Location unavailable.');
            break;
          case error.TIMEOUT:
            setGpsError('Location request timed out.');
            break;
          default:
            setGpsError('An unknown error occurred.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSave(form);
      setSaving(false);
    }, 500);
  };

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-white">{existingAddress ? 'Edit Address' : 'New Address'}</h2>
        <button
          onClick={onCancel}
          className="text-white/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* GPS Capture Section */}
        <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/80">Location</label>
            <button
              type="button"
              onClick={captureLocation}
              disabled={gpsLoading}
              className="text-xs font-semibold text-[#FFD600] hover:text-[#FFD600]/80 flex items-center gap-1 disabled:opacity-50"
            >
              {gpsLoading ? <Loader2 className="animate-spin" size={12} /> : <MapPin size={12} />}
              Use My Current Location
            </button>
          </div>

          {gpsError && (
            <div className="flex items-center gap-2 text-[#FF3366] text-xs font-medium">
              <AlertCircle size={12} />
              {gpsError}
            </div>
          )}

          {form.latitude && form.longitude ? (
            <div className="flex items-center gap-2 text-[#00FF88] text-xs font-medium">
              <Check size={12} />
              GPS Coordinates captured successfully
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-white/40 font-bold">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.0000"
                  value={form.latitude || ''}
                  onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                  className="neon-input text-sm py-2 px-3"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-white/40 font-bold">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.0000"
                  value={form.longitude || ''}
                  onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                  className="neon-input text-sm py-2 px-3"
                />
              </div>
            </div>
          )}
        </div>

        {/* Label Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Label</label>
          <select
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
            className="neon-input"
          >
            <option value="" className="bg-[#0A0A0F]">Select a label</option>
            <option value="Home" className="bg-[#0A0A0F]">Home</option>
            <option value="Work" className="bg-[#0A0A0F]">Work</option>
            <option value="Other" className="bg-[#0A0A0F]">Other</option>
          </select>
        </div>

        {/* Street/Main Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Street Address</label>
          <input
            type="text"
            placeholder="House number, Street name, City"
            required
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className="neon-input"
          />
        </div>

        {/* Landmarks Refinement */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Delivery Landmarks</label>
          <textarea
            placeholder="e.g., Opposite the blue pharmacy, next to the bakery"
            rows={2}
            value={form.landmarks}
            onChange={(e) => setForm({ ...form, landmarks: e.target.value })}
            className="neon-input resize-none"
          />
        </div>

        {/* Default Toggle */}
        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            className="w-4 h-4 accent-[#FFD600] rounded"
          />
          <label htmlFor="isDefault" className="text-sm font-medium text-white/80 cursor-pointer">
            Set as default delivery address
          </label>
        </div>

        <NeonButton type="submit" disabled={saving} className="w-full">
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Address
        </NeonButton>
      </form>
    </GlassCard>
  );
}
