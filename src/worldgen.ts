import type { Chunk } from "./world";
import type { Tile } from "./types";
import { CHUNK_SIZE } from "./world";

/**
 * Generate tile data for a chunk
 * @param worldX The world X coordinate of the chunk's origin (chunkX * CHUNK_SIZE)
 * @param worldY The world Y coordinate of the chunk's origin (chunkY * CHUNK_SIZE)
 * @param chunk The chunk to populate with generated tiles
 */
export function generateChunk(worldX: number, worldY: number, chunk: Chunk): void {
  // Generate tiles for the chunk
  // This is a placeholder - you can implement your world generation logic here
  for (let localY = 0; localY < CHUNK_SIZE; localY++) {
    for (let localX = 0; localX < CHUNK_SIZE; localX++) {
      // Calculate the actual world coordinates for this tile
      const tileWorldX = worldX + localX;
      const tileWorldY = worldY + localY;
      
      // Default: floor tile 0, no scenery
      const tile: Tile = {
        floor: 0,
        scenery: 0,
      };
      
      // Example: add some random scenery based on world position
      // You can replace this with your actual world generation algorithm
      // tileWorldX and tileWorldY are available for use in generation logic
      if (Math.random() < 0.1) {
        tile.scenery = 1; // Tree
      }
      
      // Example: use world coordinates for deterministic patterns
      if ((tileWorldX + tileWorldY) % 20 === 0) {
        tile.scenery = 2; // Special tile at certain world coordinates
      }
      
      // Set the tile in the chunk
      chunk.setTile(localX, localY, tile);
    }
  }
}

