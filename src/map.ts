import { Application, Assets, Texture, Rectangle } from "pixi.js";
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

export async function createTilemap(app: Application): Promise<CompositeTilemap> {
  // Load the isometric art texture
  const isometricArtTexture = await Assets.load("/assets/IsometricArt.png");
  
  // Extract tile sprite from (0,0) to (32,32)
  const tileSize = 32;
  const tileFrame = new Rectangle(0, 0, tileSize, tileSize);
  const tileTexture = new Texture({
    source: isometricArtTexture.source,
    frame: tileFrame,
  });
  
  // Use the same texture for all tiles (or you can extract different tiles if needed)
  const tileTextures: Texture[] = [tileTexture];

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
      const screenY = tileToScreenY(x, y);
      tiles.push({
        x,
        y,
        screenX,
        screenY,
        tileIndex: 0,
      });
    }
  }

  // Sort tiles by rendering order (back to front)
  // In isometric view, tiles with higher y (further back) or higher x+y should render first
  tiles.sort((a, b) => {
    // Primary sort by y coordinate (rows further back render first)
    if (a.y !== b.y) return a.y - b.y;
    // Secondary sort by x coordinate (left to right)
    return a.x - b.x;
  });

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
