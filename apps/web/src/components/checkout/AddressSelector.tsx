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
          className="w-full max-w-md py-3 px-6 neon-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLocating ? (
            <span className="inline-block w-5 h-5 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          {isLocating ? 'Localisation...' : 'Utiliser ma position'}
        </button>

        {error && (
          <div className="flex items-center gap-2 text-[#FF3366] text-sm glass p-3 rounded-lg w-full max-w-md border border-[#FF3366]/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {coords && (
          <div className="flex items-center gap-2 text-[#00FF88] text-sm glass p-3 rounded-lg w-full max-w-md border border-[#00FF88]/20">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Position détectée !</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Map Placeholder */}
        <div className="relative w-full h-48 glass rounded-2xl border border-dashed border-white/10 overflow-hidden flex items-center justify-center">
          {coords ? (
            <div className="absolute inset-0 bg-[#0A0A0F]">
              <div className="w-full h-full flex items-center justify-center text-white/30 flex-col gap-2">
                <MapPin className="w-8 h-8 text-[#FFD600] animate-bounce" />
                <span className="text-xs font-mono">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
              </div>
            </div>
          ) : (
            <div className="text-white/30 flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8" />
              <p className="text-sm">Aucune position sélectionnée</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">
            Instructions de livraison
          </label>
          <textarea
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder="ex: Portail bleu, à côté de la pharmacie"
            className="neon-input resize-none"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3 p-3 glass rounded-xl cursor-pointer group">
          <input
            type="checkbox"
            id="save-address"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 bg-transparent text-[#FFD600] focus:ring-[#FFD600] cursor-pointer accent-[#FFD600]"
          />
          <label htmlFor="save-address" className="text-sm text-white/60 cursor-pointer group-hover:text-white/80 transition-colors">
            Enregistrer cette adresse pour mes futures commandes
          </label>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 px-6 ghost-btn font-semibold"
        >
          Confirmer l&apos;adresse de livraison
        </button>
      </div>
    </div>
  );
}
