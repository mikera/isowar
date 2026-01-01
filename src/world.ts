import { generateChunk } from "./worldgen";

/**
 * Chunk size constant (64x64 tiles per chunk)
 */
export const CHUNK_SIZE = 64;

/**
 * Maximum seed value (2^48, a safe integer)
 */
export const MAX_SEED = 2 ** 48;

/**
 * Represents a single tile in the world
 */
export interface Tile {
  floor: number;    // Floor tile ID
  scenery: number;  // Scenery tile ID
}

/**
 * World class that manages chunks and provides logical access to tiles
 */
export class World {
  private chunks: Map<number, Chunk>;
  private static readonly CHUNK_KEY_MULTIPLIER = 100000;
  public readonly seed: number;

  constructor(seed?: number) {
    this.chunks = new Map();
    if (seed !== undefined) {
      // Ensure seed is an integer and within valid range, handling negative values
      this.seed = ((Math.floor(seed) % MAX_SEED) + MAX_SEED) % MAX_SEED;
    } else {
      this.seed = Math.floor(Math.random() * MAX_SEED);
    }
  }

  /**
   * Get the chunk key for a given chunk coordinate as a single integer
   * Uses formula: x + MULTIPLIER * y to create unique integer keys
   */
  private getChunkKey(chunkX: number, chunkY: number): number {
    return chunkX + World.CHUNK_KEY_MULTIPLIER * chunkY;
  }

  /**
   * Get or create a chunk at the given chunk coordinates
   */
  private getOrCreateChunk(chunkX: number, chunkY: number): Chunk {
    const key = this.getChunkKey(chunkX, chunkY);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(chunkX, chunkY, this);
      chunk.generate(); // Generate chunk data after creation
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  /**
   * Get a tile at global tile coordinates (chunks are automatically looked up and generated on demand)
   * @param worldX Global X coordinate (can be any integer, positive or negative)
   * @param worldY Global Y coordinate (can be any integer, positive or negative)
   */
  getTile(worldX: number, worldY: number): Tile {
    // Compute chunk coordinates inline to avoid allocations
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / CHUNK_SIZE);
    const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localY = ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    
    const chunk = this.getOrCreateChunk(chunkX, chunkY);
    return chunk.getTile(localX, localY);
  }

  /**
   * Set a tile at global tile coordinates (chunks are automatically looked up and generated on demand)
   * @param worldX Global X coordinate (can be any integer, positive or negative)
   * @param worldY Global Y coordinate (can be any integer, positive or negative)
   * @param tile The tile data to set
   */
  setTile(worldX: number, worldY: number, tile: Tile): void {
    // Compute chunk coordinates inline to avoid allocations
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / CHUNK_SIZE);
    const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localY = ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    
    const chunk = this.getOrCreateChunk(chunkX, chunkY);
    chunk.setTile(localX, localY, tile);
  }

  /**
   * Get all loaded chunks (for iteration purposes only)
   * Note: All accessor methods use global tile coordinates, not chunk coordinates
   */
  getChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Clear all chunks (useful for cleanup or reset)
   */
  clear(): void {
    this.chunks.clear();
  }
}

/**
 * Represents a 64x64 chunk of the world
 */
export class Chunk {
  private tiles: Tile[];
  public readonly chunkX: number;
  public readonly chunkY: number;
  public readonly world: World;
  private generated: boolean = false;

  constructor(chunkX: number, chunkY: number, world: World) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.world = world;
    // Initialize with 4096 tiles (CHUNK_SIZE * CHUNK_SIZE)
    this.tiles = new Array(CHUNK_SIZE * CHUNK_SIZE);
    for (let i = 0; i < CHUNK_SIZE * CHUNK_SIZE; i++) {
      this.tiles[i] = { floor: 0, scenery: 0 };
    }
  }

  /**
   * Generate the chunk data using the world generation function
   */
  generate(): void {
    if (this.generated) {
      return; // Already generated
    }
    
    // Calculate world coordinates for the chunk origin
    const worldX = this.chunkX * CHUNK_SIZE;
    const worldY = this.chunkY * CHUNK_SIZE;
    
    generateChunk(worldX, worldY, this);
    this.generated = true;
  }

  /**
   * Get a tile at local coordinates within this chunk (0 to CHUNK_SIZE-1)
   */
  getTile(localX: number, localY: number): Tile {
    if (localX < 0 || localX >= CHUNK_SIZE || localY < 0 || localY >= CHUNK_SIZE) {
      throw new Error(`Tile coordinates out of bounds: (${localX}, ${localY})`);
    }
    return this.tiles[localY * CHUNK_SIZE + localX];
  }

  /**
   * Set a tile at local coordinates within this chunk (0 to CHUNK_SIZE-1)
   */
  setTile(localX: number, localY: number, tile: Tile): void {
    if (localX < 0 || localX >= CHUNK_SIZE || localY < 0 || localY >= CHUNK_SIZE) {
      throw new Error(`Tile coordinates out of bounds: (${localX}, ${localY})`);
    }
    this.tiles[localY * CHUNK_SIZE + localX] = tile;
  }
}
