import { Assets, Texture, Rectangle, SCALE_MODES } from "pixi.js";
import type { TileDefinition, TilesConfig } from "./types";

/**
 * Loaded tile data structure
 */
export interface LoadedTiles {
  /** Array of textures indexed by tile ID */
  textures: Texture[];
  /** Size of each tile in pixels */
  tileSize: number;
  /** Source texture atlas */
  sourceTexture: Texture;
}

/**
 * Load tile definitions from tiles.json and create texture objects
 * @returns Promise resolving to loaded tile data
 */
export async function loadTiles(): Promise<LoadedTiles> {
  // Load tiles configuration
  const tilesConfigResponse = await fetch("/assets/tiles.json");
  const tilesConfig: TilesConfig = await tilesConfigResponse.json();
  
  // Load the isometric art texture
  const isometricArtTexture = await Assets.load(tilesConfig.image);
  
  // Set scale mode to NEAREST for pixel-perfect rendering
  if (isometricArtTexture.source) {
    isometricArtTexture.source.scaleMode = SCALE_MODES.NEAREST;
  }
  
  // Extract tile textures from the configuration
  const tileTextures: Texture[] = [];
  const tileSize = tilesConfig.tileSize;
  
  for (const tileDef of tilesConfig.tiles) {
    const tileFrame = new Rectangle(tileDef.x, tileDef.y, tileSize, tileSize);
    const tileTexture = new Texture({
      source: isometricArtTexture.source,
      frame: tileFrame,
    });
    
    // Set scale mode to NEAREST for pixel-perfect rendering
    if (tileTexture.source) {
      tileTexture.source.scaleMode = SCALE_MODES.NEAREST;
    }
    
    // Ensure the texture is at the correct index
    tileTextures[tileDef.id] = tileTexture;
  }
  
  return {
    textures: tileTextures,
    tileSize,
    sourceTexture: isometricArtTexture,
  };
}

