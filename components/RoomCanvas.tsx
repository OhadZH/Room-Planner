
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ROOM_CONFIG, ASSET_CATALOG } from '../constants';
import { PlacedAsset, Dimensions, AssetCategory, VisualStyle } from '../types';
import { AssetItem } from './AssetItem';
import { GripVertical, GripHorizontal, Maximize2, ZoomIn, ZoomOut, Keyboard, RotateCw, Trash2, Group, Ungroup, Copy } from 'lucide-react';

interface RoomCanvasProps {
  assets: PlacedAsset[];
  roomDimensions: Dimensions;
  visualStyle: VisualStyle;
  onResizeRoom: (dims: Dimensions) => void;
  updateAssets: (assets: PlacedAsset[]) => void;
  removeAssets: (ids: string[]) => void;
  onDuplicateAssets: () => void;
  selectedAssetIds: string[];
  onSelectAssets: (ids: string[] | ((prev: string[]) => string[])) => void;
  onGroupAssets: () => void;
  onUngroupAssets: () => void;
}

interface SnapLine {
  orientation: 'horizontal' | 'vertical';
  position: number;
}

type Point = { x: number; y: number };

const getRotatedCorners = (asset: PlacedAsset): Point[] => {
  const cx = asset.x;
  const cy = asset.y;
  const w = asset.dimensions.width;
  const h = asset.dimensions.height;
  const rad = (asset.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners = [
    { x: -w / 2, y: -h / 2 },
    { x: w / 2, y: -h / 2 },
    { x: w / 2, y: h / 2 },
    { x: -w / 2, y: h / 2 },
  ];

  return corners.map((p) => ({
    x: cx + (p.x * cos - p.y * sin),
    y: cy + (p.x * sin + p.y * cos),
  }));
};

const doPolygonsIntersect = (a: Point[], b: Point[]): boolean => {
  const polygons = [a, b];
  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    for (let j = 0; j < polygon.length; j++) {
      const k = (j + 1) % polygon.length;
      const p1 = polygon[j];
      const p2 = polygon[k];
      const normal = { x: p2.y - p1.y, y: p1.x - p2.x };

      let minA = Infinity, maxA = -Infinity;
      for (const p of a) {
        const projected = normal.x * p.x + normal.y * p.y;
        minA = Math.min(minA, projected);
        maxA = Math.max(maxA, projected);
      }

      let minB = Infinity, maxB = -Infinity;
      for (const p of b) {
        const projected = normal.x * p.x + normal.y * p.y;
        minB = Math.min(minB, projected);
        maxB = Math.max(maxB, projected);
      }

      if (maxA < minB || maxB < minA) return false;
    }
  }
  return true;
};

const isRug = (typeId: string) => typeId.includes('rug');

const getBoundingBox = (width: number, height: number, rotationDeg: number) => {
    const rad = (rotationDeg * Math.PI) / 180;
    const w = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
    const h = Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
    return { width: w, height: h };
};

export const RoomCanvas: React.FC<RoomCanvasProps> = ({
  assets,
  roomDimensions,
  visualStyle,
  onResizeRoom,
  updateAssets,
  removeAssets,
  onDuplicateAssets,
  selectedAssetIds,
  onSelectAssets,
  onGroupAssets,
  onUngroupAssets
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  
  const [fitScale, setFitScale] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [collidingIds, setCollidingIds] = useState<Set<string>>(new Set());

  const dragInfo = useRef<{
    leaderId: string | null; 
    startX: number;
    startY: number;
    initialAssets: Record<string, { x: number; y: number; rotation: number }>;
    initialBounds?: { minX: number; maxX: number; minY: number; maxY: number };
  }>({ leaderId: null, startX: 0, startY: 0, initialAssets: {} });

  const panDrag = useRef<{ active: boolean; startX: number; startY: number; initialPanX: number; initialPanY: number; }>({ active: false, startX: 0, startY: 0, initialPanX: 0, initialPanY: 0 });
  const rotationDrag = useRef<{ active: boolean; centerX: number; centerY: number; startAngle: number; initialAssets: Record<string, { x: number; y: number; rotation: number }>; }>({ active: false, centerX: 0, centerY: 0, startAngle: 0, initialAssets: {} });
  const resizeDrag = useRef<{ active: 'right' | 'bottom' | 'corner' | null; startX: number; startY: number; startWidth: number; startHeight: number; }>({ active: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const padding = 80; 
        const availableWidth = clientWidth - padding * 2;
        const availableHeight = clientHeight - padding * 2;
        const scaleX = availableWidth / roomDimensions.width;
        const scaleY = availableHeight / roomDimensions.height;
        setFitScale(Math.min(scaleX, scaleY, 1.2));
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [roomDimensions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
        if (selectedAssetIds.length > 0) {
            const STEP = e.shiftKey ? 10 : 1;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
               e.preventDefault();
               const deltaX = e.key === 'ArrowLeft' ? -STEP : e.key === 'ArrowRight' ? STEP : 0;
               const deltaY = e.key === 'ArrowUp' ? -STEP : e.key === 'ArrowDown' ? STEP : 0;
               const updated = assets.filter(a => selectedAssetIds.includes(a.id)).map(a => {
                     let nx = a.x + deltaX;
                     let ny = a.y + deltaY;
                     // Basic Clamp
                     const {width, height} = getBoundingBox(a.dimensions.width, a.dimensions.height, a.rotation);
                     if (nx < width/2) nx = width/2;
                     if (nx > roomDimensions.width - width/2) nx = roomDimensions.width - width/2;
                     if (ny < height/2) ny = height/2;
                     if (ny > roomDimensions.height - height/2) ny = roomDimensions.height - height/2;
                     return { ...a, x: nx, y: ny };
                 });
               updateAssets(updated);
               checkCollisions(updated);
            }
            if (e.key === 'Delete' || e.key === 'Backspace') { removeAssets(selectedAssetIds); onSelectAssets([]); }
            if (e.key.toLowerCase() === 'r') {
                const rotated = rotateAssets(selectedAssetIds, 45);
                updateAssets(rotated);
                checkCollisions(rotated);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                onDuplicateAssets();
            }
            if (e.key === 'Escape') onSelectAssets([]);
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') { e.preventDefault(); e.shiftKey ? onUngroupAssets() : onGroupAssets(); }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [assets, selectedAssetIds, updateAssets, removeAssets, onSelectAssets, onGroupAssets, onUngroupAssets, onDuplicateAssets, roomDimensions]);

  const currentScale = Math.max(fitScale * zoomLevel, 0.1);
  const selectedAssets = useMemo(() => assets.filter(a => selectedAssetIds.includes(a.id)), [assets, selectedAssetIds]);

  const renderOrderedAssets = useMemo(() => {
      const getPriority = (asset: PlacedAsset) => {
          const type = ASSET_CATALOG.find(a => a.id === asset.typeId);
          if (!type) return 5;
          if (type.category === AssetCategory.DECOR && asset.typeId.includes('rug')) return 0;
          if (type.category === AssetCategory.STRUCTURE) return 10;
          return 5; 
      };
      return [...assets].sort((a, b) => {
          const pa = getPriority(a);
          const pb = getPriority(b);
          if (pa !== pb) return pa - pb;
          return a.id.localeCompare(b.id);
      });
  }, [assets]);

  const selectionBounds = useMemo(() => {
    if (selectedAssets.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedAssets.forEach(asset => {
        const { width, height } = getBoundingBox(asset.dimensions.width, asset.dimensions.height, asset.rotation);
        minX = Math.min(minX, asset.x - width / 2);
        maxX = Math.max(maxX, asset.x + width / 2);
        minY = Math.min(minY, asset.y - height / 2);
        maxY = Math.max(maxY, asset.y + height / 2);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, centerX: minX + (maxX - minX) / 2, centerY: minY + (maxY - minY) / 2 };
  }, [selectedAssets]);

  const rotateAssets = (ids: string[], angleDelta: number): PlacedAsset[] => {
      const targets = assets.filter(a => ids.includes(a.id));
      if (targets.length === 0) return [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      targets.forEach(asset => {
        const { width, height } = getBoundingBox(asset.dimensions.width, asset.dimensions.height, asset.rotation);
        minX = Math.min(minX, asset.x - width / 2);
        maxX = Math.max(maxX, asset.x + width / 2);
        minY = Math.min(minY, asset.y - height / 2);
        maxY = Math.max(maxY, asset.y + height / 2);
      });
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;
      const rad = (angleDelta * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return targets.map(asset => {
          const dx = asset.x - centerX;
          const dy = asset.y - centerY;
          const newX = centerX + (dx * cos - dy * sin);
          const newY = centerY + (dx * sin + dy * cos);
          const newRot = (asset.rotation + angleDelta + 360) % 360;
          return { ...asset, x: newX, y: newY, rotation: newRot };
      });
  };

  const rotateSelection = (angleDelta: number) => {
      const rotated = rotateAssets(selectedAssetIds, angleDelta);
      updateAssets(rotated);
      checkCollisions(rotated);
  };

  const checkCollisions = (activeAssets: PlacedAsset[]) => {
    const newCollisions = new Set<string>();
    const allAssetsMap = new Map(assets.map(a => [a.id, a]));
    activeAssets.forEach(a => allAssetsMap.set(a.id, a));
    const allAssets = Array.from(allAssetsMap.values());
    const solidAssets = allAssets.filter(a => !isRug(a.typeId));

    for (let i = 0; i < solidAssets.length; i++) {
      for (let j = i + 1; j < solidAssets.length; j++) {
        const a1 = solidAssets[i];
        const a2 = solidAssets[j];
        const b1 = getBoundingBox(a1.dimensions.width, a1.dimensions.height, a1.rotation);
        const b2 = getBoundingBox(a2.dimensions.width, a2.dimensions.height, a2.rotation);
        
        if (Math.abs(a1.x - a2.x) < (b1.width + b2.width) / 2 && 
            Math.abs(a1.y - a2.y) < (b1.height + b2.height) / 2) {
            const poly1 = getRotatedCorners(a1);
            const poly2 = getRotatedCorners(a2);
            if (doPolygonsIntersect(poly1, poly2)) {
                newCollisions.add(a1.id);
                newCollisions.add(a2.id);
            }
        }
      }
    }
    setCollidingIds(newCollisions);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    if (panDrag.current.active) {
        const deltaX = e.clientX - panDrag.current.startX;
        const deltaY = e.clientY - panDrag.current.startY;
        setPanOffset({ x: panDrag.current.initialPanX + deltaX, y: panDrag.current.initialPanY + deltaY });
        return;
    }
    if (resizeDrag.current.active) {
        const deltaX = (e.clientX - resizeDrag.current.startX) / currentScale;
        const deltaY = (e.clientY - resizeDrag.current.startY) / currentScale;
        let newW = resizeDrag.current.startWidth;
        let newH = resizeDrag.current.startHeight;
        if (resizeDrag.current.active === 'right' || resizeDrag.current.active === 'corner') newW = Math.max(200, resizeDrag.current.startWidth + deltaX);
        if (resizeDrag.current.active === 'bottom' || resizeDrag.current.active === 'corner') newH = Math.max(200, resizeDrag.current.startHeight + deltaY);
        onResizeRoom({ width: Math.round(newW), height: Math.round(newH) });
        return;
    }
    if (rotationDrag.current.active) {
        const { centerX, centerY, startAngle, initialAssets } = rotationDrag.current;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const angleDiffDeg = (currentAngle - startAngle) * (180 / Math.PI);
        const SNAP_DEG = 15;
        const snappedDiff = Math.round(angleDiffDeg / SNAP_DEG) * SNAP_DEG;
        const rad = (snappedDiff * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const initVals = Object.values(initialAssets);
        const pivotX_World = initVals.reduce((sum, a) => sum + a.x, 0) / initVals.length;
        const pivotY_World = initVals.reduce((sum, a) => sum + a.y, 0) / initVals.length;
        const updatedList = selectedAssets.map(asset => {
            const init = initialAssets[asset.id];
            if (!init) return asset;
            const dx = init.x - pivotX_World;
            const dy = init.y - pivotY_World;
            const newX = pivotX_World + (dx * cos - dy * sin);
            const newY = pivotY_World + (dx * sin + dy * cos);
            const newRot = (init.rotation + snappedDiff + 360) % 360;
            return { ...asset, x: newX, y: newY, rotation: newRot };
        });
        updateAssets(updatedList);
        checkCollisions(updatedList);
        return;
    }
    if (dragInfo.current.leaderId) {
        const leaderId = dragInfo.current.leaderId;
        const initLeader = dragInfo.current.initialAssets[leaderId];
        if (!initLeader) return;
        let deltaX = (e.clientX - dragInfo.current.startX) / currentScale;
        let deltaY = (e.clientY - dragInfo.current.startY) / currentScale;
        
        const leaderAsset = assets.find(a => a.id === leaderId);
        const assetType = ASSET_CATALOG.find(t => t.id === leaderAsset?.typeId);
        const isStructure = assetType?.category === AssetCategory.STRUCTURE;
        const WT = ROOM_CONFIG.wallThickness;
        const roomW = roomDimensions.width;
        const roomH = roomDimensions.height;

        if (!isStructure && dragInfo.current.initialBounds) {
             const bounds = dragInfo.current.initialBounds;
             const curMinX = bounds.minX + deltaX;
             const curMaxX = bounds.maxX + deltaX;
             const curMinY = bounds.minY + deltaY;
             const curMaxY = bounds.maxY + deltaY;
             if (curMinX < 0) deltaX = 0 - bounds.minX;
             else if (curMaxX > roomW) deltaX = roomW - bounds.maxX;
             if (curMinY < 0) deltaY = 0 - bounds.minY;
             else if (curMaxY > roomH) deltaY = roomH - bounds.maxY;
        }

        let newLeaderX = initLeader.x + deltaX;
        let newLeaderY = initLeader.y + deltaY;
        let newLeaderRot = initLeader.rotation;
        const activeSnaps: SnapLine[] = [];
        
        if (isStructure) {
             const isSwingDoor = assetType.id === 'door';
             const w = leaderAsset!.dimensions.width;
             const h = leaderAsset!.dimensions.height;
             // Offset = MaskHeight/2 + WallThickness/2 = 6 + 4 = 10px.
             const OFFSET = 10; 
             const SNAP_THRESHOLD = 50;
             
             const clampX = (val: number) => Math.max(w/2, Math.min(roomW - w/2, val));
             const clampY = (val: number) => Math.max(w/2, Math.min(roomH - w/2, val));
             
             const distTop = newLeaderY; const distBottom = roomH - newLeaderY; 
             const distLeft = newLeaderX; const distRight = roomW - newLeaderX;

             if (Math.abs(distTop) < SNAP_THRESHOLD) {
                // Top: h/2 - Offset. Rotation 0.
                newLeaderY = h/2 - OFFSET; 
                newLeaderRot = isSwingDoor ? 0 : 0; 
                newLeaderX = clampX(newLeaderX);
                activeSnaps.push({orientation:'horizontal', position:0});
             } else if (Math.abs(distBottom) < SNAP_THRESHOLD) {
                // Bottom: roomH - h/2 + Offset. Rotation 180.
                newLeaderY = roomH - h/2 + OFFSET; 
                newLeaderRot = isSwingDoor ? 180 : 0; 
                newLeaderX = clampX(newLeaderX);
                activeSnaps.push({orientation:'horizontal', position:roomH});
             } else if (Math.abs(distLeft) < SNAP_THRESHOLD) {
                // Left: h/2 - Offset. Rotation 270.
                newLeaderX = h/2 - OFFSET; 
                newLeaderRot = isSwingDoor ? 270 : 90; 
                newLeaderY = clampY(newLeaderY);
                activeSnaps.push({orientation:'vertical', position:0});
             } else if (Math.abs(distRight) < SNAP_THRESHOLD) {
                // Right: roomW - h/2 + Offset. Rotation 90.
                newLeaderX = roomW - h/2 + OFFSET; 
                newLeaderRot = isSwingDoor ? 90 : 90; 
                newLeaderY = clampY(newLeaderY);
                activeSnaps.push({orientation:'vertical', position:roomW});
             }
             
             // Window Specific Override: Center on Wall (-WT/2)
             if (!isSwingDoor) {
                 const winOffset = -WT/2;
                 if (activeSnaps.some(s => s.orientation === 'horizontal')) {
                     if (Math.abs(distTop) < SNAP_THRESHOLD) newLeaderY = winOffset;
                     else newLeaderY = roomH - winOffset; // This logic might be tricky, let's stick to offset for consistency or explicit
                     // Re-do for windows specifically if needed?
                     // Actually, for windows, we just want center alignment.
                     // Top: -4. Bottom: H+4.
                     if (Math.abs(distTop) < SNAP_THRESHOLD) newLeaderY = -WT/2;
                     if (Math.abs(distBottom) < SNAP_THRESHOLD) newLeaderY = roomH + WT/2;
                 } else if (activeSnaps.some(s => s.orientation === 'vertical')) {
                     if (Math.abs(distLeft) < SNAP_THRESHOLD) newLeaderX = -WT/2;
                     if (Math.abs(distRight) < SNAP_THRESHOLD) newLeaderX = roomW + WT/2;
                 }
             }

        } else {
             const assetH = leaderAsset!.dimensions.height;
             const SNAP_DIST = 20;
             if (Math.abs(newLeaderX - assetH/2) < SNAP_DIST) { newLeaderX = assetH/2; activeSnaps.push({orientation:'vertical', position:0}); }
             if (Math.abs(newLeaderX + assetH/2 - roomW) < SNAP_DIST) { newLeaderX = roomW - assetH/2; activeSnaps.push({orientation:'vertical', position:roomW}); }
             if (Math.abs(newLeaderY - assetH/2) < SNAP_DIST) { newLeaderY = assetH/2; activeSnaps.push({orientation:'horizontal', position:0}); }
             if (Math.abs(newLeaderY + assetH/2 - roomH) < SNAP_DIST) { newLeaderY = roomH - assetH/2; activeSnaps.push({orientation:'horizontal', position:roomH}); }
             if (activeSnaps.length === 0) {
                const GRID = 10;
                newLeaderX = Math.round(newLeaderX / GRID) * GRID;
                newLeaderY = Math.round(newLeaderY / GRID) * GRID;
             }
        }
        setSnapLines(activeSnaps);
        
        let finalDeltaX = newLeaderX - initLeader.x;
        let finalDeltaY = newLeaderY - initLeader.y;
        const finalDeltaRot = newLeaderRot - initLeader.rotation;

        if (!isStructure && dragInfo.current.initialBounds) {
             const bounds = dragInfo.current.initialBounds;
             const curMinX = bounds.minX + finalDeltaX;
             const curMaxX = bounds.maxX + finalDeltaX;
             const curMinY = bounds.minY + finalDeltaY;
             const curMaxY = bounds.maxY + finalDeltaY;
             if (curMinX < 0) finalDeltaX = 0 - bounds.minX;
             else if (curMaxX > roomW) finalDeltaX = roomW - bounds.maxX;
             if (curMinY < 0) deltaY = 0 - bounds.minY;
             else if (curMaxY > roomH) deltaY = roomH - bounds.maxY;
        }

        const updatedList = selectedAssets.map(a => {
            const init = dragInfo.current.initialAssets[a.id];
            if (!init) return a;
            return { ...a, x: init.x + finalDeltaX, y: init.y + finalDeltaY, rotation: init.rotation + finalDeltaRot };
        });
        updateAssets(updatedList);
        checkCollisions(updatedList);
    }
  };

  // ... (handlePointerUp, handleResizeStart, startPan, handleWheel, handleAssetPointerDown, handleRotateStart, handleBackgroundPointerDown, renderSelectionOverlay same as previous)
  const handlePointerUp = (e: React.PointerEvent) => {
    setSnapLines([]);
    if (panDrag.current.active) { panDrag.current.active = false; (containerRef.current as Element).releasePointerCapture(e.pointerId); return; }
    if (resizeDrag.current.active) { resizeDrag.current.active = null; (e.target as Element).releasePointerCapture(e.pointerId); return; }
    if (rotationDrag.current.active) { rotationDrag.current.active = false; (e.target as Element).releasePointerCapture(e.pointerId); return; }
    if (dragInfo.current.leaderId) { dragInfo.current.leaderId = null; (e.target as Element).releasePointerCapture(e.pointerId); }
  };
  const handleResizeStart = (e: React.PointerEvent, type: 'right' | 'bottom' | 'corner') => {
    e.preventDefault(); e.stopPropagation();
    resizeDrag.current = { active: type, startX: e.clientX, startY: e.clientY, startWidth: roomDimensions.width, startHeight: roomDimensions.height };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const startPan = (e: React.PointerEvent) => {
    panDrag.current = { active: true, startX: e.clientX, startY: e.clientY, initialPanX: panOffset.x, initialPanY: panOffset.y };
    if (containerRef.current) { (containerRef.current as unknown as Element).setPointerCapture(e.pointerId); }
  };
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) { const delta = -e.deltaY * 0.005; setZoomLevel(z => Math.min(5, Math.max(0.2, z + delta))); } 
    else { setPanOffset(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY })); }
  };
  const handleAssetPointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (isSpacePressed || e.button === 1) { startPan(e); return; }
    const asset = assets.find(a => a.id === id); if (!asset) return;
    let newSelection = [...selectedAssetIds];
    const isSelected = selectedAssetIds.includes(id);
    if (e.shiftKey) {
        const ids = asset.groupId ? assets.filter(a => a.groupId === asset.groupId).map(a => a.id) : [id];
        if (isSelected) newSelection = newSelection.filter(selId => !ids.includes(selId));
        else newSelection = [...newSelection, ...ids];
        onSelectAssets(newSelection);
    } else {
        if (!isSelected) { const ids = asset.groupId ? assets.filter(a => a.groupId === asset.groupId).map(a => a.id) : [id]; onSelectAssets(ids); newSelection = ids; }
    }
    const initialAssets: Record<string, {x: number, y: number, rotation: number}> = {};
    let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
    assets.forEach(a => {
        if (newSelection.includes(a.id)) {
            initialAssets[a.id] = { x: a.x, y: a.y, rotation: a.rotation };
            const { width, height } = getBoundingBox(a.dimensions.width, a.dimensions.height, a.rotation);
            minX = Math.min(minX, a.x - width/2); maxX = Math.max(maxX, a.x + width/2);
            minY = Math.min(minY, a.y - height/2); maxY = Math.max(maxY, a.y + height/2);
        }
    });
    dragInfo.current = { leaderId: id, startX: e.clientX, startY: e.clientY, initialAssets, initialBounds: { minX, maxX, minY, maxY } };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (!selectionBounds || !roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    const scaleX = rect.width / roomDimensions.width;
    const scaleY = rect.height / roomDimensions.height;
    const cx = rect.left + (selectionBounds.centerX * scaleX);
    const cy = rect.top + (selectionBounds.centerY * scaleY);
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const initialAssets: Record<string, {x: number, y: number, rotation: number}> = {};
    selectedAssets.forEach(a => { initialAssets[a.id] = { x: a.x, y: a.y, rotation: a.rotation }; });
    rotationDrag.current = { active: true, centerX: cx, centerY: cy, startAngle, initialAssets };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
      if (e.button === 1 || isSpacePressed) { e.preventDefault(); startPan(e); return; }
      if (e.button === 0) onSelectAssets([]);
  };
  const renderSelectionOverlay = () => {
      if (!selectionBounds || selectedAssetIds.length === 0) return null;
      const { x, y, width, height } = selectionBounds;
      const isGrouped = selectedAssets.length > 1 && selectedAssets.every(a => a.groupId && a.groupId === selectedAssets[0].groupId);
      const canGroup = selectedAssets.length > 1 && !isGrouped;
      return (
          <div className="absolute z-50 pointer-events-none" style={{ left: x, top: y, width, height }}>
               <div className={`absolute inset-0 border-2 ${collidingIds.size > 0 && selectedAssetIds.some(id => collidingIds.has(id)) ? 'border-red-500' : 'border-blue-500'} rounded-sm`} />
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing group/rotate" onPointerDown={handleRotateStart}>
                    <div className={`w-4 h-4 bg-white border-2 ${collidingIds.size > 0 && selectedAssetIds.some(id => collidingIds.has(id)) ? 'border-red-500' : 'border-blue-500'} rounded-full shadow-sm group-hover/rotate:scale-110 transition-transform`} />
                    <div className={`w-0.5 h-8 ${collidingIds.size > 0 && selectedAssetIds.some(id => collidingIds.has(id)) ? 'bg-red-500' : 'bg-blue-500'}`} />
               </div>
               <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-auto bg-white border border-gray-200 p-1 rounded-lg shadow-lg scale-90 opacity-90 hover:opacity-100 hover:scale-100 transition-all">
                   <button onClick={(e) => { e.stopPropagation(); rotateSelection(45); }} className="p-2 hover:bg-gray-50 rounded-md text-gray-700" title="Rotate"><RotateCw size={16} /></button>
                   <div className="w-px bg-gray-100 my-1" />
                   <button onClick={(e) => { e.stopPropagation(); onDuplicateAssets(); }} className="p-2 hover:bg-gray-50 rounded-md text-gray-700" title="Duplicate"><Copy size={16} /></button>
                   <div className="w-px bg-gray-100 my-1" />
                   {canGroup && <button onClick={(e) => { e.stopPropagation(); onGroupAssets(); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-md" title="Group"><Group size={16} /></button>}
                   {isGrouped && <button onClick={(e) => { e.stopPropagation(); onUngroupAssets(); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-md" title="Ungroup"><Ungroup size={16} /></button>}
                   <div className="w-px bg-gray-100 my-1" />
                   <button onClick={(e) => { e.stopPropagation(); removeAssets(selectedAssetIds); onSelectAssets([]); }} className="p-2 hover:bg-red-50 text-red-500 rounded-md" title="Delete"><Trash2 size={16} /></button>
               </div>
          </div>
      );
  };

  return (
    <div ref={containerRef} className={`flex-1 w-full h-full relative overflow-hidden flex items-center justify-center bg-paper select-none touch-none ${isSpacePressed || panDrag.current.active ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerDown={handleBackgroundPointerDown} onWheel={handleWheel}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '20px 20px', transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }} />
        
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50 bg-white p-1.5 rounded-lg shadow-md border border-gray-100">
            <button onClick={() => setZoomLevel(z => Math.min(5, z + 0.1))} className="p-2 hover:bg-gray-50 rounded-md text-gray-600"><ZoomIn size={20} /></button>
            <div className="h-px w-full bg-gray-100" />
            <button onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.1))} className="p-2 hover:bg-gray-50 rounded-md text-gray-600"><ZoomOut size={20} /></button>
        </div>

        <div ref={roomRef} className="relative bg-white shadow-2xl transition-transform duration-75 will-change-transform origin-center"
            style={{
                width: roomDimensions.width,
                height: roomDimensions.height,
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentScale})`,
                border: `${ROOM_CONFIG.wallThickness}px solid #1a1a1a`,
                boxSizing: 'content-box', 
                boxShadow: '20px 20px 60px rgba(0,0,0,0.05), -10px -10px 40px rgba(255,255,255,0.5)'
            }} onClick={(e) => e.stopPropagation()}>
            
            {snapLines.map((line, i) => (
                <div key={i} className="absolute bg-blue-400 pointer-events-none z-50" style={{ left: line.orientation === 'vertical' ? line.position : 0, top: line.orientation === 'horizontal' ? line.position : 0, width: line.orientation === 'vertical' ? '1px' : '100%', height: line.orientation === 'horizontal' ? '1px' : '100%', opacity: 0.6 }} />
            ))}

            <div className="absolute -right-5 top-0 bottom-0 w-10 flex items-center justify-center cursor-col-resize group z-30" onPointerDown={(e) => handleResizeStart(e, 'right')}><div className="h-12 w-1.5 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors flex items-center justify-center"><GripVertical size={10} className="text-white opacity-0 group-hover:opacity-100" /></div></div>
            <div className="absolute -bottom-5 left-0 right-0 h-10 flex items-center justify-center cursor-row-resize group z-30" onPointerDown={(e) => handleResizeStart(e, 'bottom')}><div className="w-12 h-1.5 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors flex items-center justify-center"><GripHorizontal size={10} className="text-white opacity-0 group-hover:opacity-100" /></div></div>
            <div className="absolute -bottom-5 -right-5 w-10 h-10 flex items-center justify-center cursor-nwse-resize group z-40" onPointerDown={(e) => handleResizeStart(e, 'corner')}><div className="w-4 h-4 bg-white border-2 border-gray-300 group-hover:border-blue-500 rounded-full shadow-sm transition-colors flex items-center justify-center"><Maximize2 size={10} className="text-gray-400 group-hover:text-blue-500" /></div></div>

            {renderOrderedAssets.map(asset => (
                <AssetItem 
                    key={asset.id} 
                    asset={asset} 
                    visualStyle={visualStyle}
                    isSelected={selectedAssetIds.includes(asset.id)}
                    isColliding={collidingIds.has(asset.id)}
                    onMouseDown={handleAssetPointerDown}
                />
            ))}
            {renderSelectionOverlay()}
        </div>
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200 text-xs font-mono text-gray-500 pointer-events-none">
            {roomDimensions.width} × {roomDimensions.height} <span className="opacity-50 mx-1">|</span> {Math.round(currentScale * 100)}%
        </div>
    </div>
  );
};
