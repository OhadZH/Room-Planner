
import React from 'react';
import { AssetType, AssetCategory, VisualStyle } from './types';

// Helper to create standard SVG props
const SvgWrapper: React.FC<{ children: React.ReactNode; width: number; height: number }> = ({ children, width, height }) => (
  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
    {children}
  </svg>
);

export const ROOM_CONFIG = {
  width: 600,
  height: 600,
  wallThickness: 8,
};

// Realistic Colors
const COLORS = {
  wood: '#E8DCC4',
  woodDark: '#C7B299',
  woodRich: '#8B5E3C', // Darker, richer wood for detailed
  woodLight: '#D4C5A9',
  fabric: '#F3F4F6',
  fabricDark: '#E5E7EB',
  fabricRich: '#E2E8F0',
  fabricBlue: '#BFDBFE',
  ceramic: '#FAFAFA',
  glass: '#E0F2FE',
  glassDark: '#BAE6FD',
  plant: '#86EFAC',
  plantDark: '#22C55E',
  plantRich: '#15803d',
  rug: '#F3F4F6',
  white: '#FFFFFF',
  metal: '#9CA3AF',
  stroke: 'currentColor'
};

const SHADOW = 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))';
const GLASS_FILTER = 'drop-shadow(1px 1px 2px rgba(0,0,0,0.05))';

export const ASSET_CATALOG: AssetType[] = [
  // --- STRUCTURES ---
  {
    id: 'door',
    name: 'Door',
    category: AssetCategory.STRUCTURE,
    defaultDimensions: { width: 90, height: 90 },
    render: (w, h, style) => {
      const MASK_HEIGHT = 12; 
      const leafThick = 6;
      const isDetailed = style === 'detailed';
      const isRealistic = style === 'realistic' || isDetailed;
      
      const leafFill = isDetailed ? 'white' : (isRealistic ? COLORS.white : 'white');
      const leafStyle = isDetailed ? { filter: SHADOW } : {};

      return (
        <SvgWrapper width={w} height={h}>
          {isDetailed && (
            <defs>
               <linearGradient id="gradDoor" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f3f4f6" />
                  <stop offset="100%" stopColor="#ffffff" />
               </linearGradient>
            </defs>
          )}
          
          {/* Wall Mask - Positioned at Top (y=0) for Top-Wall native orientation */}
          <rect x="0" y="0" width={w} height={MASK_HEIGHT} fill={COLORS.white} stroke="none" />

          {/* Door Leaf - Vertical on Left */}
          <rect x="0" y="0" width={leafThick} height={h} 
            fill={isDetailed ? "url(#gradDoor)" : leafFill} 
            stroke={COLORS.stroke} strokeWidth={isDetailed ? 1 : 1.5} 
            style={leafStyle}
          />
          
          {/* Bevel for detailed */}
          {isDetailed && (
             <>
               <line x1="0.5" y1="0" x2="0.5" y2={h} stroke="white" strokeWidth="1" opacity="0.8" />
               <line x1={leafThick-0.5} y1="0" x2={leafThick-0.5} y2={h} stroke="black" strokeWidth="1" opacity="0.1" />
             </>
          )}

          {/* Handle */}
          {isDetailed && (
            <circle cx={leafThick/2} cy={h/2} r={2} fill="#9CA3AF" stroke="#4B5563" strokeWidth="0.5" />
          )}
          
          {/* Swing Arc - Sweeps from bottom of leaf to mask on right */}
          <path d={`M ${leafThick} ${h} A ${h} ${h} 0 0 0 ${h} ${MASK_HEIGHT}`} fill="none" stroke={COLORS.stroke} strokeWidth={isDetailed ? 1 : 1} opacity={isDetailed ? 0.3 : 1} strokeDasharray={isDetailed ? "2 2" : "none"} />
          {isDetailed && <path d={`M ${leafThick} ${h} A ${h} ${h} 0 0 0 ${h} ${MASK_HEIGHT}`} fill="rgba(0,0,0,0.02)" stroke="none" />}
        </SvgWrapper>
      );
    },
  },
  {
    id: 'door-sliding',
    name: 'Sliding Door',
    category: AssetCategory.STRUCTURE,
    defaultDimensions: { width: 160, height: 15 },
    render: (w, h, style) => {
      const isDetailed = style === 'detailed';
      const glassFill = isDetailed ? 'url(#gradGlass)' : (style === 'realistic' ? '#F9FAFB' : 'white');

      return (
        <SvgWrapper width={w} height={h}>
          {isDetailed && (
            <defs>
              <linearGradient id="gradGlass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          )}
          
          <rect x="0" y="0" width={w} height={h} fill={COLORS.white} stroke="none" />
          <rect x="0" y="0" width={w} height={h} fill="none" stroke={COLORS.stroke} strokeWidth={1} />
          
          {/* Frame tracks */}
          <line x1="0" y1={h/3} x2={w} y2={h/3} stroke={COLORS.stroke} strokeWidth="0.5" opacity="0.3" />
          <line x1="0" y1={h*2/3} x2={w} y2={h*2/3} stroke={COLORS.stroke} strokeWidth="0.5" opacity="0.3" />

          {/* Panels */}
          <rect x="0" y={h/3} width={w/2 + 5} height={h/3} fill={glassFill} stroke={COLORS.stroke} strokeWidth={1} style={isDetailed ? { filter: GLASS_FILTER } : {}}/>
          {isDetailed && <line x1="5" y1={h/3+2} x2={w/2} y2={h*2/3-2} stroke="white" strokeWidth="1" opacity="0.5" />}
          
          <rect x={w/2 - 5} y={h/3} width={w/2 + 5} height={h/3} fill={glassFill} stroke={COLORS.stroke} strokeWidth={1} style={isDetailed ? { filter: GLASS_FILTER } : {}}/>
          {isDetailed && <line x1={w/2} y1={h/3+2} x2={w-5} y2={h*2/3-2} stroke="white" strokeWidth="1" opacity="0.5" />}
          
          <line x1={w/2} y1={0} x2={w/2} y2={h} stroke={COLORS.stroke} strokeWidth="0.5" strokeDasharray="2 2" />
        </SvgWrapper>
      );
    },
  },
  {
    id: 'window',
    name: 'Window',
    category: AssetCategory.STRUCTURE,
    defaultDimensions: { width: 120, height: 15 },
    render: (w, h, style) => {
      const isDetailed = style === 'detailed';
      const glassColor = isDetailed ? '#E0F2FE' : (style === 'realistic' ? '#E0F2FE' : 'white');
      
      return (
        <SvgWrapper width={w} height={h}>
            <rect x="0" y="0" width={w} height={h} fill={COLORS.white} stroke="none" />
            
            {/* Sill */}
            <rect x="0" y="0" width={w} height={h} fill={glassColor} stroke={COLORS.stroke} strokeWidth={0.5} fillOpacity={isDetailed ? 0.4 : 1} />
            
            {isDetailed && (
                 <>
                   {/* Sill highlights */}
                   <rect x="0" y="0" width={w} height="2" fill="#ccc" />
                   <rect x="0" y={h-2} width={w} height="2" fill="#ccc" />
                   {/* Glass Reflection */}
                   <path d={`M 10 2 L 30 2 L 20 ${h-2} L 0 ${h-2} Z`} fill="white" fillOpacity="0.3" />
                   <path d={`M 40 2 L 60 2 L 50 ${h-2} L 30 ${h-2} Z`} fill="white" fillOpacity="0.1" />
                 </>
            )}
            
            <line x1="0" y1={h/2} x2={w} y2={h/2} stroke={COLORS.stroke} strokeWidth={0.5" />
        </SvgWrapper>
      );
    },
  },
  {
    id: 'stairs-u',
    name: 'Stairs (U-Turn)',
    category: AssetCategory.STRUCTURE,
    defaultDimensions: { width: 180, height: 200 },
    render: (w, h, style) => {
      const run = w / 2 - 5;
      const landing = h / 3;
      const stepCount = 8;
      const stepH = (h - landing) / stepCount;
      const isDetailed = style === 'detailed';
      const fill = isDetailed ? COLORS.woodRich : (style === 'realistic' ? COLORS.wood : 'white');
      
      return (
        <SvgWrapper width={w} height={h}>
          <rect x="0" y="0" width={w} height={h} fill={fill} stroke={COLORS.stroke} strokeWidth="1" style={isDetailed ? { filter: SHADOW } : {}} />
          
          {/* Landing */}
          <rect x={run} y={landing} width={10} height={h-landing} fill={isDetailed ? '#e5e5e5' : "white"} stroke={COLORS.stroke} strokeWidth="1" />
          
          {/* Wood Grain Texture for Detailed */}
          {isDetailed && (
              <path d={`M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h}`} fill="url(#woodGrain)" stroke="none" />
          )}

          {Array.from({ length: stepCount }).map((_, i) => (
             <React.Fragment key={`l-${i}`}>
                {isDetailed && <rect x="0" y={landing + i * stepH} width={run} height={stepH} fill="black" fillOpacity={0.05 * (i % 2)} stroke="none" />}
                <line x1="0" y1={landing + i * stepH} x2={run} y2={landing + i * stepH} stroke={COLORS.stroke} strokeWidth="0.5" />
                {isDetailed && <rect x="0" y={landing + i * stepH} width={run} height="2" fill="white" fillOpacity="0.2" />}
             </React.Fragment>
          ))}
          
          {Array.from({ length: stepCount }).map((_, i) => (
             <React.Fragment key={`r-${i}`}>
                {isDetailed && <rect x={run+10} y={landing + i * stepH} width={run+5} height={stepH} fill="black" fillOpacity={0.05 * ((i+1) % 2)} stroke="none" />}
                <line x1={run+10} y1={landing + i * stepH} x2={w} y2={landing + i * stepH} stroke={COLORS.stroke} strokeWidth="0.5" />
                {isDetailed && <rect x={run+10} y={landing + i * stepH} width={w-(run+10)} height="2" fill="white" fillOpacity="0.2" />}
             </React.Fragment>
          ))}
          
          {/* Railing / Direction */}
          <path d={`M ${run/2} ${h-20} L ${run/2} ${landing/2} L ${w - run/2} ${landing/2} L ${w - run/2} ${h-20}`} fill="none" stroke={COLORS.stroke} strokeWidth={1.5} />
          <path d={`M ${w - run/2 - 5} ${h-25} L ${w - run/2} ${h-20} L ${w - run/2 + 5} ${h-25}`} fill="none" stroke={COLORS.stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          <text x={run/2 + 5} y={h-30} fontSize="10" fontFamily="sans-serif" fontWeight="bold" fill={COLORS.stroke} style={{ pointerEvents: 'none', opacity: 0.6 }}>UP</text>
        </SvgWrapper>
      );
    }
  },

  // --- BEDROOM ---
  {
    id: 'bed-double',
    name: 'Double Bed',
    category: AssetCategory.BEDROOM,
    defaultDimensions: { width: 160, height: 200 },
    render: (w, h, style) => {
      const isDetailed = style === 'detailed';
      const fill = isDetailed ? '#F1F5F9' : (style === 'realistic' ? COLORS.fabric : 'white');
      const blanketColor = isDetailed ? '#D1D5DB' : 'none';

      return (
        <SvgWrapper width={w} height={h}>
            {isDetailed && (
                <defs>
                    <linearGradient id="pillowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#e5e7eb" />
                    </linearGradient>
                </defs>
            )}

            {/* Base / Mattress Shadow */}
            <rect x="2" y="2" width={w-4} height={h-4} fill={fill} stroke={COLORS.stroke} strokeWidth={1} rx={4} style={isDetailed ? { filter: SHADOW } : {}} />
            
            {/* Mattress Texture */}
            {isDetailed && <rect x="2" y="2" width={w-4} height={h-4} fill="url(#fabricPattern)" fillOpacity="0.5" rx={4} />}

            {/* Pillows */}
            <rect x="12" y="12" width={(w - 34) / 2} height="40" fill={isDetailed ? "url(#pillowGrad)" : "white"} stroke={COLORS.stroke} strokeWidth={0.5} rx={6} style={isDetailed ? { filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' } : {}}/>
            <rect x={w / 2 + 5} y="12" width={(w - 34) / 2} height="40" fill={isDetailed ? "url(#pillowGrad)" : "white"} stroke={COLORS.stroke} strokeWidth={0.5} rx={6} style={isDetailed ? { filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' } : {}}/>
            
            {/* Blanket */}
            {isDetailed ? (
                <>
                    <path d={`M 2 ${h * 0.35} Q ${w/2} ${h * 0.4} ${w-2} ${h * 0.35} L ${w-2} ${h-4} Q ${w/2} ${h-2} 2 ${h-4} Z`} fill={blanketColor} stroke="none" />
                    {/* Fold shadow */}
                    <path d={`M 2 ${h * 0.35} Q ${w/2} ${h * 0.4} ${w-2} ${h * 0.35}`} fill="none" stroke="black" strokeWidth="1" opacity="0.1" />
                    {/* Wrinkles */}
                    <path d={`M ${w*0.2} ${h*0.5} Q ${w*0.3} ${h*0.6} ${w*0.25} ${h*0.7}`} fill="none" stroke="black" opacity="0.05" strokeWidth="1" />
                    <path d={`M ${w*0.8} ${h*0.6} Q ${w*0.7} ${h*0.7} ${w*0.85} ${h*0.8}`} fill="none" stroke="black" opacity="0.05" strokeWidth="1" />
                </>
            ) : (
                 <path d={`M 0 ${h * 0.25} Q ${w/2} ${h * 0.3} ${w} ${h * 0.25} L ${w} ${h} L 0 ${h} Z`} fill="none" stroke={COLORS.stroke} strokeWidth="0.5" strokeDasharray="2 2" />
            )}
            
            {/* Blanket Outline for architectural */}
            {!isDetailed && <path d={`M 0 ${h * 0.25} Q ${w/2} ${h * 0.3} ${w} ${h * 0.25}`} fill="none" stroke={COLORS.stroke} strokeWidth="0.5" strokeDasharray="2 2" />}

            {/* Detailed Footer Shadow */}
            {isDetailed && (
                 <rect x="2" y={h-20} width={w-4} height={16} fill="black" fillOpacity="0.05" rx={2} />
            )}
        </SvgWrapper>
      );
    },
  },
  {
    id: 'bed-single',
    name: 'Single Bed',
    category: AssetCategory.BEDROOM,
    defaultDimensions: { width: 90, height: 200 },
    render: (w, h, style) => {
       const isDetailed = style === 'detailed';
       const fill = isDetailed ? '#F1F5F9' : (style === 'realistic' ? COLORS.fabric : 'white');
       const blanketColor = isDetailed ? '#D1D5DB' : 'none';

       return (
        <SvgWrapper width={w} height={h}>
            <rect x="2" y="2" width={w-4} height={h-4} fill={fill} stroke={COLORS.stroke} strokeWidth={1} rx={4} style={isDetailed ? { filter: SHADOW } : {}}/>
            
            <rect x="12" y="12" width={w - 24} height="40" fill={isDetailed ? "white" : "white"} stroke={COLORS.stroke} strokeWidth="0.5" rx={6} style={isDetailed ? { filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' } : {}}/>
            
            {isDetailed ? (
                <path d={`M 2 ${h * 0.35} Q ${w/2} ${h * 0.4} ${w-2} ${h * 0.35} L ${w-2} ${h-4} Q ${w/2} ${h-2} 2 ${h-4} Z`} fill={blanketColor} stroke="none" />
            ) : (
                <path d={`M 0 ${h * 0.25} Q ${w/2} ${h * 0.3} ${w} ${h * 0.25} L ${w} ${h} L 0 ${h} Z`} fill="none" stroke={COLORS.stroke} strokeWidth="0.5" strokeDasharray="2 2" />
            )}

             {isDetailed && (
                 <>
                    <path d={`M 2 ${h * 0.35} Q ${w/2} ${h * 0.4} ${w-2} ${h * 0.35}`} fill="none" stroke="black" strokeWidth="1" opacity="0.1" />
                    <path d={`M ${w*0.3} ${h*0.6} Q ${w*0.5} ${h*0.7} ${w*0.4} ${h*0.8}`} fill="none" stroke="black" opacity="0.05" strokeWidth="1" />
                 </>
             )}
        </SvgWrapper>
       );
    },
  },
  {
    id: 'nightstand',
    name: 'Nightstand',
    category: AssetCategory.BEDROOM,
    defaultDimensions: { width: 45, height: 45 },
    render: (w, h, style) => {
        const isDetailed = style === 'detailed';
        const fill = isDetailed ? COLORS.woodRich : (style === 'realistic' ? COLORS.wood : 'white');
        return (
          <SvgWrapper width={w} height={h}>
            <rect x="0" y="0" width={w} height={h} fill={fill} stroke={COLORS.stroke} strokeWidth={1} rx={1} style={isDetailed ? { filter: SHADOW } : {}}/>
            
            {isDetailed && (
                <>
                    {/* Wood grain */}
                    <line x1="0" y1="10" x2={w} y2="10" stroke="black" strokeWidth="0.5" opacity="0.1" />
                    <line x1="0" y1="25" x2={w} y2="25" stroke="black" strokeWidth="0.5" opacity="0.1" />
                    <line x1="0" y1="38" x2={w} y2="38" stroke="black" strokeWidth="0.5" opacity="0.1" />
                    
                    {/* Bevel */}
                    <line x1="0" y1="0" x2={w} y2="0" stroke="white" strokeWidth="1" opacity="0.3" />
                    <line x1="0" y1="0" x2="0" y2={h} stroke="white" strokeWidth="1" opacity="0.3" />
                    
                    {/* Handle */}
                    <circle cx={w/2} cy={h/2 + 8} r={2} fill="#D1D5DB" stroke="#4B5563" strokeWidth="0.5" />
                </>
            )}
            {!isDetailed && <line x1="0" y1="2" x2={w} y2="2" stroke={COLORS.stroke} strokeWidth="0.5" />}
            {!isDetailed && <line x1="0" y1={h-2} x2={w} y2={h-2} stroke={COLORS.stroke} strokeWidth="0.5" />}
          </SvgWrapper>
        );
    },
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    category: AssetCategory.BEDROOM,
    defaultDimensions: { width: 120, height: 60 },
    render: (w, h, style) => {
        const isDetailed = style === 'detailed';
        const fill = isDetailed ? COLORS.woodRich : (style === 'realistic' ? COLORS.wood : 'white');
        return (
          <SvgWrapper width={w} height={h}>
            <rect x="0" y="0" width={w} height={h} fill={fill} stroke={COLORS.stroke} strokeWidth={1} style={isDetailed ? { filter: SHADOW } : {}}/>
            
            {isDetailed && <rect x="0" y="0" width={w} height={h} fill="url(#woodGrain)" fillOpacity="0.3" />} 
            
            {isDetailed && <rect x="0" y="0" width={w} height={h/2} fill="white" fillOpacity="0.05" pointerEvents="none"/>}
            
            <line x1="0" y1={h - 2} x2={w} y2={h - 2} stroke={COLORS.stroke} strokeWidth="0.5" />
            <line x1={w/2} y1={0} x2={w/2} y2={h} stroke={COLORS.stroke} strokeWidth="0.5" />
            
            {isDetailed && (
                <>
                    {/* Handles */}
                    <rect x={w/2 - 8} y={h/2 - 4} width="4" height="8" fill="#D1D5DB" stroke="#6B7280" strokeWidth="0.5" rx="1" />
                    <rect x={w/2 + 4} y={h/2 - 4} width="4" height="8" fill="#D1D5DB" stroke="#6B7280" strokeWidth="0.5" rx="1" />
                    
                    {/* Panel definition */}
                    <rect x="4" y="4" width={w/2 - 8} height={h-8} fill="none" stroke="black" strokeWidth="0.5" opacity="0.1" />
                    <rect x={w/2 + 4} y="4" width={w/2 - 8} height={h-8} fill="none" stroke="black" strokeWidth="0.5" opacity="0.1" />
                </>
            )}
          </SvgWrapper>
        );
    },
  },
  {
    id: 'desk',
    name: 'Desk',
    category: AssetCategory.BEDROOM,
    defaultDimensions: { width: 120, height: 60 },
    render: (w, h, style) => {
        const isDetailed = style === 'detailed';
        const fill = isDetailed ? COLORS.woodRich : (style === 'realistic' ? COLORS.wood : 'white');
        return (
          <SvgWrapper width={w} height={h}>
            <rect x="0" y="0" width={w} height={h} fill={fill} stroke={COLORS.stroke} strokeWidth={1} style={isDetailed ? { filter: SHADOW } : {}}/>
            
            {isDetailed && (
                <>
                    {/* Leather pad */}
                    <rect x={w/2 - 25} y={h - 20} width="50" height="20" fill="#374151" rx="2" />
                    {/* Grommet */}
                    <circle cx={w/2} cy={10} r={3} fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="0.5" />
                    {/* Wood Bevel */}
                    <line x1="0" y1="0" x2={w} y2="0" stroke="white" strokeWidth="1" opacity="0.4" />
                    <line x1="0" y1="0" x2="0" y2={h} stroke="white" strokeWidth="1" opacity="0.4" />
                </>
            )}
            
            <rect x="0" y="0" width={30} height={h} fill="none" stroke={COLORS.stroke} strokeWidth="0.5" opacity={isDetailed ? 0.2 : 1} />
            <rect x={w-30} y="0" width={30} height={h} fill="none" stroke={COLORS.stroke} strokeWidth="0.5" opacity={isDetailed ? 0.2 : 1}/>
          </SvgWrapper>
        );
    },
  },

  // --- DECOR ---
  {
    id: 'rug-round',
    name: 'Round Rug',
    category: AssetCategory.DECOR,
    defaultDimensions: { width: 150, height: 150 },
    render: (w, h, style) => {
        const isDetailed = style === 'detailed';
        const fill = isDetailed ? '#F3F4F6' : (style === 'realistic' ? COLORS.rug : 'none');
        return (
          <SvgWrapper width={w} height={h}>
            {isDetailed && (
                <defs>
                     <radialGradient id="rugGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="80%" stopColor="#F3F4F6" />
                        <stop offset="100%" stopColor="#E5E7EB" />
                    </radialGradient>
                </defs>
            )}
            <circle cx={w / 2} cy={h / 2} r={w / 2 - 2} fill={isDetailed ? "url(#rugGrad)" : fill} stroke={COLORS.stroke} strokeWidth={0.5} strokeDasharray={isDetailed ? 'none' : '4 4'} style={isDetailed ? { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' } : {}}/>
            
            {isDetailed && (
                <>
                    {/* Texture rings */}
                    <circle cx={w / 2} cy={h / 2} r={w / 2 - 10} fill="none" stroke="#9CA3AF" strokeWidth="1" opacity="0.1" strokeDasharray="4 2" />
                    <circle cx={w / 2} cy={h / 2} r={w / 2 - 25} fill="none" stroke="#9CA3AF" strokeWidth="1" opacity="0.1" strokeDasharray="4 2" />
                    <circle cx={w / 2} cy={h / 2} r={w / 2 - 40} fill="none" stroke="#9CA3AF" strokeWidth="1" opacity="0.1" strokeDasharray="4 2" />
                </>
            )}
          </SvgWrapper>
        );
    },
  },
  {
    id: 'rug-rect',
    name: 'Rect Rug',
    category: AssetCategory.DECOR,
    defaultDimensions: { width: 200, height: 150 },
    render: (w, h, style) => {
        const isDetailed = style === 'detailed';
        const fill = isDetailed ? '#F3F4F6' : (style === 'realistic' ? COLORS.rug : 'none');
        return (
          <SvgWrapper width={w} height={h}>
            <rect x="2" y="2" width={w-4} height={h-4} fill={fill} stroke={COLORS.stroke} strokeWidth={0.5} strokeDasharray={isDetailed ? 'none' : '4 4'} rx={2} style={isDetailed ? { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' } : {}}/>
            {isDetailed && (
                <>
                     {/* Zigzag pattern hint */}
                     <path d={`M 10 10 L ${w-10} 10`} stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4 4" opacity="0.1" />
                     <path d={`M 10 ${h-10} L ${w-10} ${h-10}`} stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4 4" opacity="0.1" />
                     <rect x="15" y="20" width={w-30} height={h-40} fill="none" stroke="#9CA3AF" strokeWidth="1" opacity="0.1" />
                </>
            )}
          </SvgWrapper>
        );
    },
  },
  {
    id: 'plant',
    name: 'Potted Plant',
    category: AssetCategory.DECOR,
    defaultDimensions: { width: 45, height: 45 },
    render: (w, h, style) => {
        const isDetailed = style === 'detailed';
        const fill = isDetailed ? COLORS.plantRich : (style === 'realistic' ? COLORS.plant : 'white');
        return (
          <SvgWrapper width={w} height={h}>
             {isDetailed && (
                <defs>
                    <radialGradient id="plantGrad" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#15803d" />
                    </radialGradient>
                </defs>
             )}

            {/* Pot */}
            <circle cx={w / 2} cy={h / 2} r={w / 3} fill={fill} stroke={COLORS.stroke} strokeWidth={1} style={isDetailed ? { filter: SHADOW } : {}}/>
            {isDetailed && <circle cx={w / 2} cy={h / 2} r={w / 3} fill="black" fillOpacity="0.2" />}
            
            {/* Leaves */}
            <path d={`M ${w/2} ${h/2} Q ${w*0.1} ${h*0.1} ${w/2} ${h*0.05} Q ${w*0.9} ${h*0.1} ${w/2} ${h/2}`} fill={isDetailed ? "url(#plantGrad)" : "none"} stroke={COLORS.stroke} strokeWidth="0.5" />
            <path d={`M ${w/2} ${h/2} Q ${w*0.95} ${h*0.5} ${w} ${h*0.1} Q ${w*0.7} ${h*0.1} ${w/2} ${h/2}`} fill={isDetailed ? "url(#plantGrad)" : "none"} stroke={COLORS.stroke} strokeWidth="0.5" />
            <path d={`M ${w/2} ${h/2} Q ${w*0.1} ${h*0.9} ${w*0.05} ${h/2} Q ${w*0.3} ${h*0.2} ${w/2} ${h/2}`} fill={isDetailed ? "url(#plantGrad)" : "none"} stroke={COLORS.stroke} strokeWidth="0.5" />
            <path d={`M ${w/2} ${h/2} Q ${w*0.9} ${h*0.9} ${w} ${h*0.8} Q ${w*0.6} ${h*0.6} ${w/2} ${h/2}`} fill={isDetailed ? "url(#plantGrad)" : "none"} stroke={COLORS.stroke} strokeWidth="0.5" />
            
            {/* Center Point */}
            {isDetailed && <circle cx={w/2} cy={h/2} r={3} fill="#4B5563" />}
          </SvgWrapper>
        );
    },
  }
];
