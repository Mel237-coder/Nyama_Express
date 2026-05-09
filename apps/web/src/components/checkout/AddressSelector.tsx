import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddressCoords {
  lat: number;
  lng: number;
}

interface AddressData {
  coords: AddressCoords | null;
  text: string;
  saveAddress: boolean;
}

interface AddressSelectorProps {
  onAddressConfirm: (address: AddressData) => void;
}

export default function AddressSelector({ onAddressConfirm }: AddressSelectorProps) {
  const [coords, setCoords] = useState<AddressCoords | null>(null);
  const [addressText, setAddressText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enter address manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred while fetching location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    onAddressConfirm({
      coords,
      text: addressText,
      saveAddress,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="w-full max-w-md py-3 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
        >
          {isLocating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          {isLocating ? 'Locating...' : 'Use Current Location'}
        </button>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg w-full max-w-md">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {coords && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg w-full max-w-md animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Location detected successfully!</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Map Placeholder / Visual Indicator */}
        <div className="relative w-full h-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
          {coords ? (
            <div className="absolute inset-0 bg-slate-200">
              {/*
                In a real implementation, this would be a Leaflet map
                centered on [coords.lat, coords.lng]
              */}
              <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-2">
                <MapPin className="w-8 h-8 text-orange-500 animate-bounce" />
                <span className="text-xs font-mono">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8" />
              <p className="text-sm">No location selected</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Additional delivery instructions
          </label>
          <textarea
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder="e.g. Gate 4, blue house, next to the pharmacy"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer group">
          <input
            type="checkbox"
            id="save-address"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
          />
          <label htmlFor="save-address" className="text-sm text-gray-600 cursor-pointer group-hover:text-gray-900 transition-colors">
            Save this address for future orders
          </label>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 px-6 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-all active:scale-95 shadow-sm"
        >
          Confirm Delivery Location
        </button>
      </div>
    </div>
  );
}
