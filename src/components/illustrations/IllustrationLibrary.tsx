import React from 'react';

export const FarmerFieldIllustration = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Sky & Background Hills */}
    <rect width="800" height="600" fill="#F0F9F1" />
    <path d="M0 450C150 420 250 480 400 450C550 420 650 480 800 450V600H0V450Z" fill="#E2F2E5" />
    <path d="M0 500C200 480 300 520 500 500C700 480 800 520 800 500V600H0V500Z" fill="#D4EBD9" />
    
    {/* Crops/Fields */}
    <g opacity="0.6">
      <rect x="50" y="520" width="20" height="40" rx="2" fill="#16803A" />
      <rect x="90" y="515" width="20" height="45" rx="2" fill="#16803A" />
      <rect x="130" y="525" width="20" height="35" rx="2" fill="#16803A" />
      <rect x="650" y="510" width="20" height="50" rx="2" fill="#16803A" />
      <rect x="690" y="520" width="20" height="40" rx="2" fill="#16803A" />
    </g>

    {/* Farmer Figure (Simplified Stylized) */}
    <g transform="translate(350, 320)">
      {/* Body */}
      <path d="M40 80L20 180H60L40 80Z" fill="#16803A" />
      {/* Head & Turban */}
      <circle cx="40" cy="60" r="15" fill="#E5C4A7" />
      <path d="M25 55C25 45 55 45 55 55C55 60 25 60 25 55Z" fill="#FFFFFF" />
      {/* Arms */}
      <path d="M40 90L10 120" stroke="#E5C4A7" strokeWidth="8" strokeLinecap="round" />
      <path d="M40 90L70 120" stroke="#E5C4A7" strokeWidth="8" strokeLinecap="round" />
      {/* Basket with produce */}
      <path d="M60 120H90C95 120 95 140 90 140H60C55 140 55 120 60 120Z" fill="#8B4513" />
      <circle cx="65" cy="115" r="8" fill="#FF6B6B" />
      <circle cx="75" cy="112" r="8" fill="#FFD93D" />
      <circle cx="85" cy="115" r="8" fill="#6BCB77" />
    </g>

    {/* Distant Delivery Van */}
    <g transform="translate(100, 420) scale(0.6)">
      <rect width="100" height="50" rx="8" fill="#16803A" />
      <rect x="70" y="5" width="25" height="20" rx="2" fill="#EAF7EE" />
      <circle cx="20" cy="50" r="10" fill="#333" />
      <circle cx="80" cy="50" r="10" fill="#333" />
      <text x="10" y="30" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">MK</text>
    </g>
  </svg>
);

export const WarehouseIllustration = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="800" height="600" fill="#F8FAFC" />
    {/* Shelves */}
    <rect x="100" y="200" width="200" height="10" fill="#CBD5E1" />
    <rect x="100" y="350" width="200" height="10" fill="#CBD5E1" />
    <rect x="100" y="500" width="200" height="10" fill="#CBD5E1" />
    
    {/* Boxes/Sacks */}
    <rect x="120" y="440" width="50" height="60" rx="4" fill="#D97706" opacity="0.8" />
    <rect x="180" y="440" width="50" height="60" rx="4" fill="#D97706" opacity="0.8" />
    <path d="M240 440C240 430 290 430 290 440V500H240V440Z" fill="#FDE68A" />
    
    {/* Godown Worker */}
    <g transform="translate(450, 300)">
      <circle cx="40" cy="40" r="20" fill="#E5C4A7" />
      <rect x="20" y="60" width="40" height="100" rx="10" fill="#16803A" />
      <rect x="25" y="70" width="30" height="20" fill="#0B5428" /> {/* Vest */}
      <path d="M20 80L-10 110" stroke="#E5C4A7" strokeWidth="8" strokeLinecap="round" />
      <rect x="-30" y="100" width="30" height="20" rx="4" fill="#E2E8F0" /> {/* Tablet */}
    </g>
  </svg>
);

export const EmptyStateIllustration = ({ type = "default", className = "" }: { type?: string, className?: string }) => {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="80" fill="#F5FBF7" />
      {type === "orders" && (
        <g transform="translate(60, 60)">
          <rect width="80" height="80" rx="8" stroke="#16803A" strokeWidth="4" strokeDasharray="8 8" />
          <path d="M20 30H60M20 50H60M20 70H40" stroke="#DCE8DF" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {type === "delivery" && (
        <g transform="translate(50, 70)">
          <rect width="100" height="40" rx="8" fill="#DCE8DF" />
          <circle cx="20" cy="40" r="10" fill="#66736A" />
          <circle cx="80" cy="40" r="10" fill="#66736A" />
          <path d="M30 20H70" stroke="white" strokeWidth="4" />
        </g>
      )}
      {type === "default" && (
        <circle cx="100" cy="100" r="40" stroke="#DCE8DF" strokeWidth="4" strokeDasharray="10 10" />
      )}
    </svg>
  );
};
