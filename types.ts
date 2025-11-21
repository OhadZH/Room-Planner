
export enum AssetCategory {
  STRUCTURE = 'Structure',
  BEDROOM = 'Bedroom',
  DECOR = 'Decor'
}

export type VisualStyle = 'architectural' | 'realistic' | 'detailed';

export interface Dimensions {
  width: number;
  height: number;
}

export interface AssetType {
  id: string;
  name: string;
  category: AssetCategory;
  defaultDimensions: Dimensions;
  render: (width: number, height: number, style: VisualStyle) => React.ReactNode; // SVG path or shape
}

export interface PlacedAsset {
  id: string; // Unique instance ID
  groupId?: string; // ID for grouping multiple assets
  typeId: string; // Reference to AssetType
  x: number;
  y: number;
  rotation: number; // in degrees
  dimensions: Dimensions;
}

export interface RoomDimensions {
  width: number;
  height: number;
  padding: number;
}
