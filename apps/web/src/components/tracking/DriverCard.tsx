import React from 'react';

interface Driver {
  name: string;
  phone: string;
  photo?: string;
}

interface DriverCardProps {
  driver: Driver | null;
}

export default function DriverCard({ driver }: DriverCardProps) {
  if (!driver) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-md mx-auto glass-elevated rounded-3xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <img
                src={driver.photo || 'https://via.placeholder.com/150'}
                alt={driver.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-[#FFD600]/20"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#00FF88] border-2 border-[#0A0A0F] rounded-full animate-pulse"></div>
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">{driver.name}</h4>
              <p className="text-sm text-white/50">Your delivery partner</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${driver.phone}`}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#00D4FF] text-[#0A0A0F] rounded-xl font-bold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-shadow"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.307l.52.707a1 1 0 00.322.322l.707.52a1 1 0 01.307.948V5a2 2 0 012 2h3.28a1 1 0 01.948.307l.52.707a1 1 0 00.322.322l.707.52a1 1 0 01.307.948V17a2 2 0 01-2 2h-3.28a1 1 0 01-.948-.307l-.52-.707a1 1 0 00-.322-.322l-.707-.52a1 1 0 01-.307-.948V17" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17a2 2 0 012 2h2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v-2" />
              </svg>
              Contacter
            </a>
            <button
              onClick={() => alert('Chat feature coming soon!')}
              className="ghost-btn py-3 px-4 rounded-xl font-bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 2.55-1.55 5.5-4.24 7.52C14.42 20 14 21 14 21c0 0-1.42-1.02-2.48-2.48C8.55 17.55 8 15.5 8 13c0-2.55 1.55-5.5 4.24-7.52C11.58 4 12 3 12 3c0 0 1.42 1.02 2.48 2.48C16.45 8.45 16 9.5 16 11" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v-2" />
              </svg>
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
