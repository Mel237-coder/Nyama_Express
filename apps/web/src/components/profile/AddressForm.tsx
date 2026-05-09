import React, { useState } from 'react';
import { MapPin, Loader2, Save, Check, AlertCircle } from 'lucide-react';
import { AddressData, Address } from '../../pages/profile/addresses';

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
    // Simulate saving state for UI feedback before calling onSave
    setTimeout(() => {
      onSave(form);
      setSaving(false);
    }, 500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-gray-900">{existingAddress ? 'Edit Address' : 'New Address'}</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* GPS Capture Section */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <button
              type="button"
              onClick={captureLocation}
              disabled={gpsLoading}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 disabled:opacity-50"
            >
              {gpsLoading ? <Loader2 className="animate-spin" size={12} /> : <MapPin size={12} />}
              Use My Current Location
            </button>
          </div>

          {gpsError && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
              <AlertCircle size={12} />
              {gpsError}
            </div>
          )}

          {form.latitude && form.longitude ? (
            <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
              <Check size={12} />
              GPS Coordinates captured successfully
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-400 font-bold">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.0000"
                  value={form.latitude || ''}
                  onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-400 font-bold">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.0000"
                  value={form.longitude || ''}
                  onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Label Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Label</label>
          <select
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-white"
          >
            <option value="">Select a label</option>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Street/Main Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Street Address</label>
          <input
            type="text"
            placeholder="House number, Street name, City"
            required
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
        </div>

        {/* Landmarks Refinement */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Delivery Landmarks</label>
          <textarea
            placeholder="e.g., Opposite the blue pharmacy, next to the bakery"
            rows={2}
            value={form.landmarks}
            onChange={(e) => setForm({ ...form, landmarks: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
        </div>

        {/* Default Toggle */}
        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
          />
          <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
            Set as default delivery address
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Address
        </button>
      </form>
    </div>
  );
}
