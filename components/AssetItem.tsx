
import React, { memo } from 'react';
import { PlacedAsset, VisualStyle } from '../types';
import { ASSET_CATALOG } from '../constants';

interface AssetItemProps {
  asset: PlacedAsset;
  isSelected: boolean;
  isColliding?: boolean;
  visualStyle: VisualStyle;
  onMouseDown: (e: React.PointerEvent, id: string) => void;
}

export const AssetItem: React.FC<AssetItemProps> = memo(({ asset, isSelected, isColliding, visualStyle, onMouseDown }) => {
  const assetType = ASSET_CATALOG.find(a => a.id === asset.typeId);

  if (!assetType) return null;

  return (
    <div
      className={`absolute group select-none touch-none transition-all duration-200 ease-out ${
        isSelected ? 'z-40' : 'z-10 hover:drop-shadow-md'
      }`}
      style={{
        left: asset.x,
        top: asset.y,
        width: asset.dimensions.width,
        height: asset.dimensions.height,
        transform: `translate(-50%, -50%) rotate(${asset.rotation}deg)`,
        cursor: isSelected ? 'grabbing' : 'grab',
      }}
      onPointerDown={(e) => onMouseDown(e, asset.id)}
    >
      {/* Visual Render */}
      <div className={`w-full h-full relative ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
        {/* Render the Asset SVG */}
        {assetType.render(asset.dimensions.width, asset.dimensions.height, visualStyle)}
        
        {/* Selection Highlight */}
        {isSelected && !isColliding && (
          <div className="absolute inset-0 border border-blue-400/50 rounded-sm pointer-events-none" />
        )}

        {/* Collision Feedback (Red Outline & Tint) */}
        {isColliding && (
          <>
            <div className="absolute -inset-0.5 border-2 border-red-500 rounded-sm pointer-events-none animate-pulse" />
            <div className="absolute inset-0 bg-red-500/10 pointer-events-none rounded-sm" />
          </>
        )}
      </div>
    </div>
  );
});

AssetItem.displayName = 'AssetItem';
