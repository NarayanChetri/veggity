import React from 'react';

/**
 * Rich, layered botanical SVG illustration for the empty harvest state on Home.
 */
export function EmptyHarvestIllustration({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Neighborhood garden basket and fresh vegetables illustration"
    >
      <defs>
        <linearGradient id="skyGlow" x1="180" y1="0" x2="180" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#D1FAE5" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="hillBack" x1="0" y1="120" x2="360" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
        <linearGradient id="hillFront" x1="0" y1="150" x2="360" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="basketGrad" x1="125" y1="125" x2="235" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Soft organic backdrop */}
      <ellipse cx="180" cy="112" rx="154" ry="92" fill="url(#skyGlow)" />

      {/* Warm morning sun */}
      <circle cx="284" cy="52" r="24" fill="#FDE68A" />
      <circle cx="284" cy="52" r="15" fill="#FBBF24" />

      {/* Distant neighborhood cottages */}
      <g opacity="0.85">
        <rect x="44" y="108" width="38" height="30" rx="3" fill="#FFFFFF" stroke="#6EE7B7" strokeWidth="1.5" />
        <path d="M38 110L63 90L88 110H38Z" fill="#059669" />
        <rect x="57" y="122" width="12" height="16" rx="2" fill="#A7F3D0" />

        <rect x="278" y="112" width="34" height="26" rx="3" fill="#FFFFFF" stroke="#6EE7B7" strokeWidth="1.5" />
        <path d="M273 114L295 96L317 114H273Z" fill="#047857" />
        <rect x="290" y="124" width="10" height="14" rx="2" fill="#A7F3D0" />
      </g>

      {/* Rolling green garden hills */}
      <path d="M26 156C82 126 146 132 198 148C252 164 300 132 336 148V186H26V156Z" fill="url(#hillBack)" />
      <path d="M20 174C92 146 178 158 256 172C298 180 322 166 342 172V198C342 204 337 208 331 208H31C25 208 20 204 20 198V174Z" fill="url(#hillFront)" />

      {/* Decorative garden sprouts on left */}
      <g>
        <path d="M74 166C74 150 62 140 52 144C52 156 62 166 74 166Z" fill="#047857" />
        <path d="M74 166C74 148 88 136 98 142C96 156 86 166 74 166Z" fill="#34D399" />
        <rect x="72.5" y="162" width="3" height="14" rx="1.5" fill="#065F46" />
      </g>

      {/* Wicker Harvest Basket overflowing with fresh veggies */}
      <g>
        {/* Leafy greens behind */}
        <path d="M138 124C126 98 144 82 160 98C168 82 190 84 192 104C208 90 226 102 216 124H138Z" fill="#10B981" />
        <path d="M150 124C144 106 158 96 170 108C178 96 196 100 198 118L150 124Z" fill="#34D399" />

        {/* Carrot */}
        <g transform="rotate(-24 146 118)">
          <path d="M140 102C140 97 148 97 148 102L146 130C145.5 133 142.5 133 142 130L140 102Z" fill="#F97316" />
          <path d="M144 98C140 90 135 90 138 96M144 98C144 88 149 88 148 96" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* Heirloom Tomatoes */}
        <circle cx="196" cy="116" r="14" fill="#EF4444" />
        <circle cx="192" cy="112" r="4" fill="#FCA5A5" opacity="0.6" />
        <path d="M196 102L193 97M196 102L199 97M196 102L196 96" stroke="#065F46" strokeWidth="2" strokeLinecap="round" />

        <circle cx="170" cy="120" r="12" fill="#DC2626" />
        <path d="M170 108L167 104M170 108L173 104" stroke="#065F46" strokeWidth="1.8" strokeLinecap="round" />

        {/* Basket body */}
        <path d="M122 126H238L224 176C222.5 181.5 217.5 185 211.8 185H148.2C142.5 185 137.5 181.5 136 176L122 126Z" fill="url(#basketGrad)" />
        {/* Basket rim */}
        <rect x="116" y="120" width="128" height="12" rx="6" fill="#B45309" />
        {/* Basket weave lines */}
        <path d="M132 144H228M136 160H224" stroke="#92400E" strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" />
        <path d="M154 132L158 185M180 132V185M206 132L202 185" stroke="#92400E" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
      </g>

      {/* Watering can on right */}
      <g transform="translate(256, 140)">
        <rect x="10" y="12" width="28" height="22" rx="5" fill="#065F46" />
        <path d="M38 18C44 18 46 28 38 30" stroke="#065F46" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M10 22L-4 10" stroke="#047857" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="-5" cy="9" rx="3" ry="5" transform="rotate(-40 -5 9)" fill="#34D399" />
      </g>

      {/* Floating botanical accents */}
      <circle cx="98" cy="68" r="4" fill="#34D399" opacity="0.6" />
      <circle cx="242" cy="78" r="5" fill="#10B981" opacity="0.5" />
      <path d="M124 62C128 54 136 54 138 62C132 66 126 66 124 62Z" fill="#6EE7B7" />
    </svg>
  );
}

/**
 * Hero illustration for the Login & Signup green split panel.
 */
export function AuthGardenIllustration({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 340 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Fresh homegrown produce crate and botanical leaves"
    >
      <defs>
        <linearGradient id="authGlow" x1="170" y1="10" x2="170" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#064E3B" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ambient glow circle */}
      <circle cx="170" cy="130" r="110" fill="url(#authGlow)" />

      {/* Botanical leaves behind crate */}
      <path d="M90 156C56 126 58 84 94 74C112 96 112 134 90 156Z" fill="#34D399" fillOpacity="0.85" />
      <path d="M250 156C284 126 282 84 246 74C228 96 228 134 250 156Z" fill="#10B981" fillOpacity="0.85" />
      <path d="M170 124C144 80 156 40 170 30C184 40 196 80 170 124Z" fill="#6EE7B7" fillOpacity="0.9" />

      {/* Fresh veggies inside crate */}
      {/* Broccoli / Greens */}
      <circle cx="132" cy="126" r="20" fill="#10B981" />
      <circle cx="118" cy="132" r="14" fill="#34D399" />
      <circle cx="145" cy="130" r="15" fill="#059669" />

      {/* Sun-ripened Tomatoes */}
      <circle cx="176" cy="130" r="18" fill="#EF4444" />
      <circle cx="170" cy="124" r="5" fill="#FCA5A5" opacity="0.55" />
      <path d="M176 112L172 106M176 112L180 106" stroke="#A7F3D0" strokeWidth="2.5" strokeLinecap="round" />

      {/* Golden Bell Pepper / Lemon */}
      <ellipse cx="214" cy="132" rx="16" ry="18" fill="#FBBF24" />
      <ellipse cx="209" cy="126" rx="4" ry="7" fill="#FEF3C7" opacity="0.55" />

      {/* Wooden Garden Crate */}
      <rect x="86" y="138" width="168" height="72" rx="10" fill="#ECFDF5" />
      <rect x="86" y="138" width="168" height="18" rx="6" fill="#A7F3D0" />
      <rect x="96" y="164" width="148" height="14" rx="4" fill="#D1FAE5" />
      <rect x="96" y="186" width="148" height="14" rx="4" fill="#D1FAE5" />

      {/* Center Location Pin + Sprout Badge on Crate */}
      <circle cx="170" cy="174" r="18" fill="#047857" />
      <path
        d="M170 183C170 183 178 175.5 178 170.5C178 166.1 174.4 162.5 170 162.5C165.6 162.5 162 166.1 162 170.5C162 175.5 170 183 170 183Z"
        fill="#ECFDF5"
      />
      <circle cx="170" cy="170.5" r="3" fill="#047857" />

      {/* Sparkle / Freshness stars */}
      <circle cx="68" cy="70" r="4" fill="#FDE68A" />
      <circle cx="276" cy="82" r="5" fill="#A7F3D0" />
      <circle cx="264" cy="206" r="3.5" fill="#FDE68A" />
    </svg>
  );
}

/**
 * Clean Lucide-style SVG icons for the 3-step How It Works cards
 */
export function StepHarvestIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

export function StepNeighborIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function StepBasketIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 11-1 9" />
      <path d="m19 11-4-7" />
      <path d="M2 11h20" />
      <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
      <path d="M4.5 15.5h15" />
      <path d="m5 11 4-7" />
      <path d="m9 11 1 9" />
    </svg>
  );
}
