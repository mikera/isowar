import { Application, Assets, Texture, Rectangle, SCALE_MODES } from "pixi.js";
import { CompositeTilemap } from "@pixi/tilemap";

interface TileData {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  tileIndex: number;
}

// Isometric offsets
// x direction: [+16, +8] (right and down)
// y direction: [-16, +8] (left and down)
export const xOffsetX = 16;
export const xOffsetY = 8;
export const yOffsetX = -16;
export const yOffsetY = 8;

interface TileDefinition {
  id: number;
  name: string;
  x: number;
  y: number;
}

interface TilesConfig {
  image: string;
  tileSize: number;
  tiles: TileDefinition[];
}

export async function createTilemap(_app: Application): Promise<CompositeTilemap> {
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

  // Calculate map dimensions for isometric grid
  // Need enough tiles to cover the screen with isometric layout
  const mapWidth = 50;
  const mapHeight = 50;

  const tiles: TileData[] = [];

  // Calculate screen positions for all tiles
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      // Convert isometric coordinates to screen coordinates
      const screenX = tileToScreenX(x, y);
      const screenY = tileToScreenY(x, y)+(Math.random()*4-2);
      tiles.push({
        x,
        y,
        screenX,
        screenY,
        tileIndex: 0,
      });

      if (Math.random() < 0.1) {
        tiles.push({
          x,
          y,
          screenX,
          screenY: screenY-16,
          tileIndex: 1,
        });
      }
    }
  }

  // Create the tilemap and add tiles in correct rendering order
  const tilemap = new CompositeTilemap();
  
  for (const tile of tiles) {
    tilemap.tile(tileTextures[tile.tileIndex], tile.screenX, tile.screenY);
  }

  return tilemap;
}

/**
 * Calculate the screen X position of a tile given its map coordinates
 * @param mapX The X coordinate in map space
 * @param mapY The Y coordinate in map space
 * @returns The screen X position
 */
export function tileToScreenX(mapX: number, mapY: number): number {
  return mapX * xOffsetX + mapY * yOffsetX;
}

/**
 * Calculate the screen Y position of a tile given its map coordinates
 * @param mapX The X coordinate in map space
 * @param mapY The Y coordinate in map space
 * @returns The screen Y position
 */
export function tileToScreenY(mapX: number, mapY: number): number {
  return mapX * xOffsetY + mapY * yOffsetY;
}

/**
 * Convert screen X coordinate to map X coordinate
 * @param screenX The screen X position
 * @param screenY The screen Y position (needed for isometric conversion)
 * @returns The map X coordinate
 */
export function screenToTileX(screenX: number, screenY: number): number {
  // Solving the system:
  // screenX = mapX * xOffsetX + mapY * yOffsetX
  // screenY = mapX * xOffsetY + mapY * yOffsetY
  // For isometric: mapX = (2 * screenY + screenX) / 32
  return (2 * screenY + screenX) / 32;
}

/**
 * Convert screen Y coordinate to map Y coordinate
 * @param screenX The screen X position
 * @param screenY The screen Y position (needed for isometric conversion)
 * @returns The map Y coordinate
 */
export function screenToTileY(screenX: number, screenY: number): number {
  // Solving the system:
  // screenX = mapX * xOffsetX + mapY * yOffsetX
  // screenY = mapX * xOffsetY + mapY * yOffsetY
  // For isometric: mapY = (2 * screenY - screenX) / 32
  return (2 * screenY - screenX) / 32;
}
