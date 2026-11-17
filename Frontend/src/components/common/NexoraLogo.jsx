import React, { useId } from 'react';

/**
 * NexoraLogo - Realistic 3D Futuristic AI Brand Mark & Wordmark
 *
 * Designed for Nexora AI Platform:
 * - 3D folded aerodynamic ribbon 'N' geometry with volumetric lighting
 * - Specular glass/metallic rim reflections and multi-stop chromatic gradients
 * - Electric cyan (#00f2fe), royal sapphire (#0066ff), and neon purple/magenta (#8b5cf6 / #ec4899)
 * - Deep occlusion drop-shadows creating genuine dimensional depth
 * - Central quantum nexus glint (specular 4-point star core)
 * - Two display styles: 'tile' (glossy 3D squircle tile) and 'glyph' (floating 3D ribbon mark)
 * - Vector SVG: pin-sharp at any resolution or pixel density
 */
const NexoraLogo = ({
  size = 'md',
  showText = true,
  badgeText = 'AI',
  theme = 'dark', // 'dark' | 'light'
  variant = 'tile', // 'tile' | 'glyph'
  className = '',
  animated = true,
}) => {
  const uid = useId().replace(/:/g, '_');

  // Size configurations
  const sizeMap = {
    xs: { box: 22, text: 'text-sm', badge: 'text-[8px] px-1 py-0.2', gap: 'space-x-1.5' },
    sm: { box: 28, text: 'text-base', badge: 'text-[9px] px-1.5 py-0.5', gap: 'space-x-2' },
    md: { box: 36, text: 'text-xl', badge: 'text-[9px] px-1.5 py-0.5', gap: 'space-x-2.5' },
    lg: { box: 48, text: 'text-2xl', badge: 'text-[10px] px-2 py-0.5', gap: 'space-x-3' },
    xl: { box: 64, text: 'text-3xl', badge: 'text-xs px-2.5 py-1', gap: 'space-x-3.5' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const boxPx = currentSize.box;

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className} group select-none`}>
      {/* 3D Realistic Emblem */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{ width: boxPx, height: boxPx }}
      >
        {/* Ambient Backlight Aura Glow */}
        {animated && (
          <div
            className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-md -z-10 group-hover:bg-cyan-400/40 group-hover:blur-lg transition-all duration-300 pointer-events-none"
            style={{ transform: 'scale(1.25)' }}
          />
        )}

        <svg
          viewBox="0 0 100 100"
          width={boxPx}
          height={boxPx}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            {/* Main Electric Cyan Gradient */}
            <linearGradient id={`${uid}-cyan`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Deep Sapphire to Violet Gradient */}
            <linearGradient id={`${uid}-sapphire`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="40%" stopColor="#4338ca" />
              <stop offset="80%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>

            {/* Diagonal Ribbon Gradient (Chromatic Flow) */}
            <linearGradient id={`${uid}-diag`} x1="15%" y1="15%" x2="85%" y2="85%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Right Wing Gradient */}
            <linearGradient id={`${uid}-right`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            {/* Specular Highlight Sheen (Glossy Rim Reflection) */}
            <linearGradient id={`${uid}-specular`} x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#a5f3fc" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Bevel Shadow for 3D Occlusion Depth */}
            <linearGradient id={`${uid}-shadow`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#020617" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </linearGradient>

            {/* Glass Surface Facet Reflection */}
            <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Tile Border Gradient */}
            <linearGradient id={`${uid}-tile-border`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
            </linearGradient>

            {/* Soft Ambient Shadow Filter */}
            <filter id={`${uid}-shadow-filter`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.65" />
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#00f2fe" floodOpacity="0.35" />
            </filter>

            {/* Core Glow Filter */}
            <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* SQUIRCLE TILE BACKGROUND (only in 'tile' variant) */}
          {variant === 'tile' && (
            <g>
              <rect
                x="4"
                y="4"
                width="92"
                height="92"
                rx="26"
                ry="26"
                fill="#070b1c"
                stroke={`url(#${uid}-tile-border)`}
                strokeWidth="1.4"
                className="filter drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
              />
              {/* Glossy top glass reflex */}
              <rect
                x="5"
                y="5"
                width="90"
                height="90"
                rx="25"
                ry="25"
                fill={`url(#${uid}-glass)`}
                pointerEvents="none"
              />
              {/* Inner luminous bloom */}
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="#00f2fe"
                opacity="0.14"
                filter={`url(#${uid}-glow)`}
              />
            </g>
          )}

          {/* ========================================================
              GEOMETRIC 3D FOLDED RIBBON 'N' (NEXORA REALISTIC EMBLEM)
              ======================================================== */}
          <g filter={`url(#${uid}-shadow-filter)`}>
            {/* LAYER 1: Deep Underloop (Left base curving up) */}
            <path
              d="M 24 74 C 24 81 28 85 34 85 C 40 85 44 80 44 73 L 44 42 C 44 32 37 25 28 27 C 24 28 22 32 22 37 Z"
              fill={`url(#${uid}-sapphire)`}
              opacity="0.9"
            />

            {/* LAYER 2: Left Vertical Pillar with 3D Bevel */}
            <path
              d="M 23 72 L 23 35 C 23 27 28 21 36 21 C 41 21 44 24 45 28 L 45 68 C 45 76 39 82 32 82 C 26 82 23 78 23 72 Z"
              fill={`url(#${uid}-cyan)`}
            />

            {/* Specular Edge along Left Column */}
            <path
              d="M 24 70 L 24 35 C 24 28 28 23 35 22"
              stroke={`url(#${uid}-specular)`}
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* LAYER 3: 3D Under-fold Drop Shadow under Diagonal Bridge */}
            <path
              d="M 36 32 L 64 72 C 60 76 54 78 48 76 L 32 44 Z"
              fill={`url(#${uid}-shadow)`}
              opacity="0.75"
            />

            {/* LAYER 4: Sweeping Central Diagonal Ribbon (Key Dynamic Ribbon) */}
            <path
              d="M 33 22 C 37 20 42 22 46 27 L 76 72 C 80 77 78 83 73 85 C 68 87 63 84 59 79 L 29 34 C 27 30 28 24 33 22 Z"
              fill={`url(#${uid}-diag)`}
            />

            {/* Specular Rim Light across Diagonal Ribbon Crest */}
            <path
              d="M 34 23 L 75 73"
              stroke={`url(#${uid}-specular)`}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* LAYER 5: Right Ascension Pillar (Completing the 'N') */}
            <path
              d="M 57 32 C 57 26 62 20 69 20 C 76 20 81 25 81 32 L 81 69 C 81 77 75 83 67 83 C 63 83 59 81 57 77 L 57 32 Z"
              fill={`url(#${uid}-right)`}
            />

            {/* Specular Edge along Right Ascension Pillar */}
            <path
              d="M 80 68 L 80 32 C 80 26 76 21 70 21"
              stroke={`url(#${uid}-specular)`}
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Top Right Specular Highlight Glint */}
            <circle
              cx="72"
              cy="25"
              r="2.5"
              fill="#ffffff"
              opacity="0.95"
            />

            {/* LAYER 6: Central Quantum Nexus Glint (Specular 4-point Star Diamond) */}
            <g transform="translate(52, 49)">
              <polygon
                points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2"
                fill="#ffffff"
                opacity="0.95"
                filter={`url(#${uid}-glow)`}
              />
              <circle cx="0" cy="0" r="1.8" fill="#a5f3fc" />
            </g>
          </g>
        </svg>
      </div>

      {/* Brand Typography & Pill Badge */}
      {showText && (
        <div className="flex items-baseline space-x-1.5 leading-none">
          <span
            className={`font-black tracking-tight ${currentSize.text} ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            nex
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              ora
            </span>
          </span>

          {badgeText && (
            <span
              className={`font-bold uppercase tracking-wider rounded-full border transition-all ${currentSize.badge} ${
                theme === 'light'
                  ? 'bg-amber-100/90 text-amber-800 border-amber-300/70 font-semibold'
                  : 'bg-cyan-950/70 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default NexoraLogo;
