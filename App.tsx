
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RoomCanvas } from './components/RoomCanvas';
import { PlacedAsset, Dimensions, AssetCategory, VisualStyle } from './types';
import { ASSET_CATALOG, ROOM_CONFIG } from './constants';
import { Palette, Sparkles } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getBoundingBox = (width: number, height: number, rotationDeg: number) => {
    const rad = (rotationDeg * Math.PI) / 180;
    const w = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
    const h = Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
    return { width: w, height: h };
};

const App: React.FC = () => {
  const [assets, setAssets] = useState<PlacedAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('architectural');
  
  const [roomDimensions, setRoomDimensions] = useState<Dimensions>({
    width: ROOM_CONFIG.width,
    height: ROOM_CONFIG.height
  });

  useEffect(() => {
      const doorType = ASSET_CATALOG.find(a => a.id === 'door');
      const windowType = ASSET_CATALOG.find(a => a.id === 'window');
      
      const initialAssets: PlacedAsset[] = [];
      const WT = ROOM_CONFIG.wallThickness;
      const OFFSET = 10; // New snapping offset for doors
      
      // Initial Door: Bottom Wall
      if (doorType) {
          const h = doorType.defaultDimensions.height;
          const y = roomDimensions.height - h / 2 + OFFSET;
          initialAssets.push({
              id: generateId(),
              typeId: 'door',
              x: 120, 
              y: y, 
              rotation: 180, // Rotated for bottom wall
              dimensions: doorType.defaultDimensions
          });
      }
      // Initial Window: Top Wall
      if (windowType) {
          initialAssets.push({
              id: generateId(),
              typeId: 'window',
              x: roomDimensions.width / 2,
              y: -WT / 2,
              rotation: 0,
              dimensions: windowType.defaultDimensions
          });
      }
      
      setAssets(initialAssets);
  }, []); 

  const handleAddAsset = useCallback((typeId: string) => {
    const assetType = ASSET_CATALOG.find(a => a.id === typeId);
    if (!assetType) return;

    const WT = ROOM_CONFIG.wallThickness;
    const OFFSET = 10;
    
    let spawnX = roomDimensions.width / 2;
    let spawnY = roomDimensions.height / 2;
    let spawnRotation = 0;

    if (assetType.category === AssetCategory.STRUCTURE) {
        spawnX = roomDimensions.width / 2;
        const h = assetType.defaultDimensions.height;
        if (typeId === 'door') {
             spawnY = h / 2 - OFFSET; // Top wall placement
             spawnRotation = 0; 
        } else {
             spawnY = -WT / 2; // Top wall center
             spawnRotation = 0;
        }
    } else {
        spawnX += (Math.random() * 40 - 20);
        spawnY += (Math.random() * 40 - 20);
    }

    const newAsset: PlacedAsset = {
      id: generateId(),
      typeId,
      x: spawnX,
      y: spawnY,
      rotation: spawnRotation,
      dimensions: assetType.defaultDimensions,
    };

    setAssets(prev => [...prev, newAsset]);
    setSelectedAssetIds([newAsset.id]);
  }, [roomDimensions]);

  const handleUpdateAssets = useCallback((updatedAssets: PlacedAsset[]) => {
      setAssets(prev => prev.map(p => {
          const updated = updatedAssets.find(u => u.id === p.id);
          return updated || p;
      }));
  }, []);

  const handleRemoveAssets = useCallback((ids: string[]) => {
    setAssets(prev => prev.filter(a => !ids.includes(a.id)));
    setSelectedAssetIds([]);
  }, []);

  const handleDuplicateAssets = useCallback(() => {
      if (selectedAssetIds.length === 0) return;

      const newAssets: PlacedAsset[] = [];
      const newSelectionIds: string[] = [];
      const OFFSET = 20;

      const groupMap = new Map<string, string>();

      const assetsToDuplicate = assets.filter(a => selectedAssetIds.includes(a.id));

      assetsToDuplicate.forEach(asset => {
          let newGroupId = undefined;
          if (asset.groupId) {
              if (!groupMap.has(asset.groupId)) {
                  groupMap.set(asset.groupId, generateId());
              }
              newGroupId = groupMap.get(asset.groupId);
          }

          const newAsset: PlacedAsset = {
              ...asset,
              id: generateId(),
              x: asset.x + OFFSET,
              y: asset.y + OFFSET,
              groupId: newGroupId
          };
          
          newAssets.push(newAsset);
          newSelectionIds.push(newAsset.id);
      });

      setAssets(prev => [...prev, ...newAssets]);
      setSelectedAssetIds(newSelectionIds);
  }, [assets, selectedAssetIds]);

  const handleGroupAssets = useCallback(() => {
      if (selectedAssetIds.length < 2) return;
      
      const newGroupId = generateId();
      setAssets(prev => prev.map(a => 
          selectedAssetIds.includes(a.id) ? { ...a, groupId: newGroupId } : a
      ));
  }, [selectedAssetIds]);

  const handleUngroupAssets = useCallback(() => {
      setAssets(prev => prev.map(a => 
          selectedAssetIds.includes(a.id) ? { ...a, groupId: undefined } : a
      ));
  }, [selectedAssetIds]);

  const handleResizeRoom = useCallback((newDims: Dimensions) => {
    const deltaW = newDims.width - roomDimensions.width;
    const deltaH = newDims.height - roomDimensions.height;

    if (deltaW === 0 && deltaH === 0) return;

    setAssets(prevAssets => prevAssets.map(asset => {
        const assetType = ASSET_CATALOG.find(a => a.id === asset.typeId);
        const isStructure = assetType?.category === AssetCategory.STRUCTURE;
        const isSwingDoor = assetType?.id === 'door';
        
        const h = asset.dimensions.height;
        const WT = ROOM_CONFIG.wallThickness;
        // New Offsets matching RoomCanvas logic
        const OFFSET = 10;
        const offsetFlush = h / 2 - OFFSET;
        const offsetCenter = -WT / 2;
        
        const bbox = getBoundingBox(asset.dimensions.width, asset.dimensions.height, asset.rotation);
        const halfW = bbox.width / 2;
        const halfH = bbox.height / 2;
        
        const SNAP_THRESHOLD = 100; 
        let newX = asset.x;
        let newY = asset.y;

        if (deltaW !== 0) {
            if (isStructure) {
                const isVertical = Math.abs(asset.rotation % 180 - 90) < 5;
                const targetRight = roomDimensions.width + (isSwingDoor ? offsetFlush : -offsetCenter);
                
                // Re-check logic: For Right Wall, rotation is 90 or 270.
                // Canvas logic: newLeaderX = roomW - h/2 + OFFSET (for Door). 
                // If h=90, OFFSET=10 -> roomW - 35.
                // Using generic offsetFlush (h/2 - OFFSET) -> 35.
                // So target is roomW - offsetFlush.
                // Wait, Canvas says `roomW + OFFSET - h/2`. 
                // `offsetFlush` = `h/2 - OFFSET`.
                // So `roomW - offsetFlush` = `roomW - (h/2 - OFFSET)` = `roomW - h/2 + OFFSET`. Correct.
                
                const oldRightTarget = roomDimensions.width + (isSwingDoor ? -offsetFlush : -offsetCenter); // Wait, Right wall is +X. Asset is INSIDE (X < roomW). So minus offset.
                
                // Let's verify Canvas: `newLeaderX = roomW - h/2 + OFFSET`
                // `offsetFlush` is positive (35). 
                // So target is `roomW - offsetFlush`.
                
                if (isVertical && Math.abs(asset.x - (roomDimensions.width - (isSwingDoor ? offsetFlush : 0))) < SNAP_THRESHOLD) {
                     // Sticky logic simplified: if close to right wall, move with it
                     // For Door: X approx Width - 35.
                     if (Math.abs(asset.x - roomDimensions.width) < 100) {
                         newX = newDims.width - (roomDimensions.width - asset.x);
                     }
                }
            } else {
                const distRightEdge = Math.abs((asset.x + halfW) - roomDimensions.width);
                const distCenter = Math.abs(asset.x - roomDimensions.width);
                if (distRightEdge < SNAP_THRESHOLD || distCenter < SNAP_THRESHOLD) {
                    newX += deltaW;
                }
                if (newX + halfW > newDims.width) newX = newDims.width - halfW;
            }
        }

        if (deltaH !== 0) {
            if (isStructure) {
                 const isHorizontal = Math.abs(asset.rotation % 180) < 5;
                 // Bottom Wall Y approx Height - 35.
                 if (isHorizontal && Math.abs(asset.y - roomDimensions.height) < SNAP_THRESHOLD) {
                     newY = newDims.height - (roomDimensions.height - asset.y);
                 }
            } else {
                const distBottomEdge = Math.abs((asset.y + halfH) - roomDimensions.height);
                const distCenter = Math.abs(asset.y - roomDimensions.height);
                if (distBottomEdge < SNAP_THRESHOLD || distCenter < SNAP_THRESHOLD) {
                    newY += deltaH;
                }
                if (newY + halfH > newDims.height) newY = newDims.height - halfH;
            }
        }

        return { ...asset, x: newX, y: newY };
    }));

    setRoomDimensions(newDims);
  }, [roomDimensions]);

  const toggleVisualStyle = () => {
      setVisualStyle(prev => {
          if (prev === 'architectural') return 'realistic';
          if (prev === 'realistic') return 'detailed';
          return 'architectural';
      });
  };

  const getStyleLabel = () => {
      switch(visualStyle) {
          case 'architectural': return 'Line Art';
          case 'realistic': return 'Flat Color';
          case 'detailed': return 'Detailed';
      }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-paper">
      <div className="flex-1 relative order-2 md:order-2 h-[70vh] md:h-auto">
        <RoomCanvas
          assets={assets}
          roomDimensions={roomDimensions}
          visualStyle={visualStyle}
          onResizeRoom={handleResizeRoom}
          updateAssets={handleUpdateAssets}
          removeAssets={handleRemoveAssets}
          onDuplicateAssets={handleDuplicateAssets}
          selectedAssetIds={selectedAssetIds}
          onSelectAssets={setSelectedAssetIds}
          onGroupAssets={handleGroupAssets}
          onUngroupAssets={handleUngroupAssets}
        />

        <button
            onClick={toggleVisualStyle}
            className="absolute top-6 left-6 z-40 flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 shadow-sm text-gray-700 px-3 py-2 rounded-full hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all text-xs font-semibold select-none"
        >
            {visualStyle === 'detailed' ? <Sparkles size={14} className="text-yellow-500" /> : <Palette size={14} />}
            {getStyleLabel()}
        </button>

      </div>
      
      <div className="order-1 md:order-1 md:h-full h-[30vh] z-20 shadow-xl md:shadow-none">
        <Sidebar 
          onAddAsset={handleAddAsset} 
          roomDimensions={roomDimensions}
          onUpdateDimensions={handleResizeRoom}
        />
      </div>
    </div>
  );
};

export default App;
