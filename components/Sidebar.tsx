
import React, { useMemo, useState } from 'react';
import { ASSET_CATALOG } from '../constants';
import { Dimensions, AssetCategory } from '../types';
import { Plus, DoorOpen, BedDouble, Flower2, LayoutTemplate } from 'lucide-react';

interface SidebarProps {
  onAddAsset: (typeId: string) => void;
  roomDimensions: Dimensions;
  onUpdateDimensions: (newDimensions: Dimensions) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddAsset, roomDimensions, onUpdateDimensions }) => {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>(AssetCategory.STRUCTURE);

  const filteredAssets = useMemo(() => {
    return ASSET_CATALOG.filter(asset => asset.category === activeCategory);
  }, [activeCategory]);

  const handleDimensionChange = (axis: 'width' | 'height', value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 100) { // Min limit
      onUpdateDimensions({
        ...roomDimensions,
        [axis]: num
      });
    }
  };

  // Category configuration
  const tabs = [
    { id: AssetCategory.STRUCTURE, label: 'Structure', icon: DoorOpen },
    { id: AssetCategory.BEDROOM, label: 'Bedroom', icon: BedDouble },
    { id: AssetCategory.DECOR, label: 'Decor', icon: Flower2 },
  ];

  return (
    <aside className="w-full md:w-80 bg-white border-r border-gray-100 flex flex-col h-[30vh] md:h-full z-20 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 flex items-center gap-3 bg-white shrink-0">
        <div className="bg-gray-900 text-white p-2 rounded-lg">
          <LayoutTemplate size={20} />
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-tight text-gray-900">ZenPlan</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Design Studio</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between px-2 py-2 bg-gray-50/50 border-b border-gray-100 shrink-0 overflow-x-auto no-scrollbar gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px] transition-all duration-200 group ${
              activeCategory === tab.id 
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            <tab.icon size={18} strokeWidth={activeCategory === tab.id ? 2.5 : 2} />
            <span className="text-[9px] font-semibold uppercase tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-5">
        
        {/* Room Dimensions Controls - Only show in Structure tab */}
        {activeCategory === AssetCategory.STRUCTURE && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
             <div className="flex items-center justify-between mb-3">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Room Size</h3>
                 <span className="text-[10px] text-gray-400 font-mono">cm</span>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                   <label className="absolute -top-2 left-2 bg-gray-50 px-1 text-[9px] font-bold text-gray-400 uppercase">Width</label>
                   <input 
                     type="number" 
                     value={roomDimensions.width}
                     onChange={(e) => handleDimensionChange('width', e.target.value)}
                     className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-center"
                   />
                </div>
                <div className="relative group">
                   <label className="absolute -top-2 left-2 bg-gray-50 px-1 text-[9px] font-bold text-gray-400 uppercase">Length</label>
                   <input 
                     type="number" 
                     value={roomDimensions.height}
                     onChange={(e) => handleDimensionChange('height', e.target.value)}
                     className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-center"
                   />
                </div>
             </div>
          </div>
        )}

        {/* Asset Grid */}
        <div>
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               {activeCategory === AssetCategory.STRUCTURE ? 'Structural Elements' : `${tabs.find(t => t.id === activeCategory)?.label} Assets`}
               <span className="text-[10px] font-normal bg-gray-100 px-1.5 rounded-full text-gray-500">{filteredAssets.length}</span>
           </h3>
           
           <div className="grid grid-cols-2 gap-3">
             {filteredAssets.map(asset => (
               <button
                 key={asset.id}
                 onClick={() => onAddAsset(asset.id)}
                 className="group relative flex flex-col items-center justify-center p-4 bg-paper border border-gray-200 rounded-xl hover:border-gray-900 hover:shadow-md transition-all duration-200 text-gray-800 aspect-square"
               >
                  <div className="w-16 h-16 mb-2 relative flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                     <div style={{ transform: 'scale(0.4)' }}>
                        {asset.render(asset.defaultDimensions.width, asset.defaultDimensions.height, 'architectural')}
                     </div>
                  </div>
                  <span className="text-[10px] font-semibold text-center leading-tight">{asset.name}</span>
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
                     <div className="bg-gray-900 text-white rounded-full p-1 shadow-sm">
                       <Plus size={10} />
                     </div>
                  </div>
               </button>
             ))}
           </div>
        </div>

        {/* Fallback / Empty State */}
        {filteredAssets.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-xs">
                No items in this category yet.
            </div>
        )}

      </div>

      {/* Footer Tips */}
      <div className="p-4 border-t border-gray-50 bg-gray-50/30 shrink-0">
         <div className="text-[10px] text-gray-500 leading-relaxed text-center">
            <span className="font-bold text-gray-700">Tip:</span> Press <kbd className="font-mono bg-white border border-gray-200 rounded px-1">Space</kbd> to pan, <kbd className="font-mono bg-white border border-gray-200 rounded px-1">Shift</kbd> to select multiple.
         </div>
      </div>
    </aside>
  );
};
