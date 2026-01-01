/**
 * Shared type definitions used across the application
 */

/**
 * Represents a single tile in the world at a specific x,y location
 * Floor is rendered at z=0, scenery is rendered at z=1
 */
export interface Tile {
  /** Floor tile ID (rendered at z=0) */
  floor: number;
  /** Scenery tile ID (rendered at z=1, 0 means no scenery) */
  scenery: number;
}

/**
 * Definition of a tile from the tiles configuration
 */
export interface TileDefinition {
  /** Unique tile identifier */
  id: number;
  /** Human-readable tile name */
  name: string;
  /** X coordinate in the texture atlas */
  x: number;
  /** Y coordinate in the texture atlas */
  y: number;
  /** Z coordinate (height) in the texture atlas */
  z?: number;
}

/**
 * Configuration structure for tiles loaded from JSON
 */
export interface TilesConfig {
  /** Path to the tile atlas image */
  image: string;
  /** Size of each tile in pixels */
  tileSize: number;
  /** Array of tile definitions */
  tiles: TileDefinition[];
}

