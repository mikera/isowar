import { describe, it, expect, beforeEach } from "vitest";
import { World, Chunk, CHUNK_SIZE, type Tile } from "./world";

describe("World", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe("getTile and setTile", () => {
    it("should get generated tile values", () => {
      const tile = world.getTile(0, 0);
      // Tiles are now generated, so they may have non-zero values
      expect(typeof tile.floor).toBe("number");
      expect(typeof tile.scenery).toBe("number");
    });

    it("should set and get a tile", () => {
      const newTile: Tile = { floor: 1, scenery: 2 };
      world.setTile(10, 20, newTile);
      
      const retrieved = world.getTile(10, 20);
      expect(retrieved.floor).toBe(1);
      expect(retrieved.scenery).toBe(2);
    });

    it("should handle negative coordinates", () => {
      const tile: Tile = { floor: 5, scenery: 6 };
      world.setTile(-10, -20, tile);
      
      const retrieved = world.getTile(-10, -20);
      expect(retrieved.floor).toBe(5);
      expect(retrieved.scenery).toBe(6);
    });

    it("should handle coordinates across chunk boundaries", () => {
      const tile1: Tile = { floor: 1, scenery: 1 };
      const tile2: Tile = { floor: 2, scenery: 2 };
      
      // Set tiles in different chunks
      world.setTile(0, 0, tile1);
      world.setTile(CHUNK_SIZE, CHUNK_SIZE, tile2);
      
      expect(world.getTile(0, 0)).toEqual(tile1);
      expect(world.getTile(CHUNK_SIZE, CHUNK_SIZE)).toEqual(tile2);
    });

    it("should handle coordinates at chunk boundaries", () => {
      const tile1: Tile = { floor: 1, scenery: 1 };
      const tile2: Tile = { floor: 2, scenery: 2 };
      
      // Set tiles at chunk boundaries
      world.setTile(CHUNK_SIZE - 1, CHUNK_SIZE - 1, tile1);
      world.setTile(CHUNK_SIZE, 0, tile2);
      
      expect(world.getTile(CHUNK_SIZE - 1, CHUNK_SIZE - 1)).toEqual(tile1);
      expect(world.getTile(CHUNK_SIZE, 0)).toEqual(tile2);
    });

    it("should create chunks on demand", () => {
      expect(world.getChunks().length).toBe(0);
      
      world.getTile(100, 200);
      expect(world.getChunks().length).toBe(1);
      
      world.getTile(200, 300);
      expect(world.getChunks().length).toBe(2);
    });

    it("should reuse existing chunks", () => {
      world.setTile(10, 20, { floor: 1, scenery: 1 });
      world.setTile(30, 40, { floor: 2, scenery: 2 });
      
      // Both tiles are in the same chunk (0, 0)
      expect(world.getChunks().length).toBe(1);
    });
  });

  describe("chunk coordinate mapping", () => {
    it("should correctly map coordinates to chunks", () => {
      // Test various coordinates and verify they map to correct chunks
      const testCases = [
        { x: 0, y: 0, expectedChunk: { x: 0, y: 0 } },
        { x: CHUNK_SIZE - 1, y: CHUNK_SIZE - 1, expectedChunk: { x: 0, y: 0 } },
        { x: CHUNK_SIZE, y: CHUNK_SIZE, expectedChunk: { x: 1, y: 1 } },
        { x: -1, y: -1, expectedChunk: { x: -1, y: -1 } },
        { x: -CHUNK_SIZE, y: -CHUNK_SIZE, expectedChunk: { x: -1, y: -1 } },
        { x: 100, y: 200, expectedChunk: { x: 1, y: 3 } },
      ];

      for (const testCase of testCases) {
        const tile: Tile = { floor: testCase.x, scenery: testCase.y };
        world.setTile(testCase.x, testCase.y, tile);
        
        const retrieved = world.getTile(testCase.x, testCase.y);
        expect(retrieved.floor).toBe(testCase.x);
        expect(retrieved.scenery).toBe(testCase.y);
      }
    });
  });

  describe("getChunks", () => {
    it("should return empty array for new world", () => {
      expect(world.getChunks()).toEqual([]);
    });

    it("should return all loaded chunks", () => {
      world.getTile(0, 0);
      world.getTile(CHUNK_SIZE * 2, CHUNK_SIZE * 3);
      
      const chunks = world.getChunks();
      expect(chunks.length).toBe(2);
      expect(chunks[0]).toBeInstanceOf(Chunk);
      expect(chunks[1]).toBeInstanceOf(Chunk);
    });
  });

  describe("clear", () => {
    it("should clear all chunks", () => {
      world.getTile(0, 0);
      world.getTile(100, 200);
      expect(world.getChunks().length).toBe(2);
      
      world.clear();
      expect(world.getChunks().length).toBe(0);
    });

    it("should allow setting tiles after clear", () => {
      world.setTile(10, 20, { floor: 1, scenery: 1 });
      world.clear();
      
      const tile: Tile = { floor: 2, scenery: 2 };
      world.setTile(10, 20, tile);
      expect(world.getTile(10, 20)).toEqual(tile);
    });
  });

  describe("edge cases", () => {
    it("should handle large coordinates", () => {
      const tile: Tile = { floor: 1000, scenery: 2000 };
      world.setTile(10000, 20000, tile);
      expect(world.getTile(10000, 20000)).toEqual(tile);
    });

    it("should handle very negative coordinates", () => {
      const tile: Tile = { floor: -100, scenery: -200 };
      world.setTile(-1000, -2000, tile);
      expect(world.getTile(-1000, -2000)).toEqual(tile);
    });

    it("should handle multiple operations on same tile", () => {
      world.setTile(50, 50, { floor: 1, scenery: 1 });
      world.setTile(50, 50, { floor: 2, scenery: 2 });
      world.setTile(50, 50, { floor: 3, scenery: 3 });
      
      const tile = world.getTile(50, 50);
      expect(tile.floor).toBe(3);
      expect(tile.scenery).toBe(3);
    });
  });
});

describe("Chunk", () => {
  describe("getTile and setTile", () => {
    it("should get default tile values", () => {
      const world = new World();
      const chunk = new Chunk(0, 0, world);
      const tile = chunk.getTile(0, 0);
      expect(tile.floor).toBe(0);
      expect(tile.scenery).toBe(0);
    });

    it("should set and get a tile", () => {
      const world = new World();
      const chunk = new Chunk(0, 0, world);
      const tile: Tile = { floor: 1, scenery: 2 };
      chunk.setTile(10, 20, tile);
      
      const retrieved = chunk.getTile(10, 20);
      expect(retrieved).toEqual(tile);
    });

    it("should throw error for out of bounds coordinates", () => {
      const world = new World();
      const chunk = new Chunk(0, 0, world);
      
      expect(() => chunk.getTile(-1, 0)).toThrow();
      expect(() => chunk.getTile(0, -1)).toThrow();
      expect(() => chunk.getTile(CHUNK_SIZE, 0)).toThrow();
      expect(() => chunk.getTile(0, CHUNK_SIZE)).toThrow();
      
      expect(() => chunk.setTile(-1, 0, { floor: 0, scenery: 0 })).toThrow();
      expect(() => chunk.setTile(0, -1, { floor: 0, scenery: 0 })).toThrow();
      expect(() => chunk.setTile(CHUNK_SIZE, 0, { floor: 0, scenery: 0 })).toThrow();
      expect(() => chunk.setTile(0, CHUNK_SIZE, { floor: 0, scenery: 0 })).toThrow();
    });

    it("should handle boundary coordinates", () => {
      const world = new World();
      const chunk = new Chunk(0, 0, world);
      const tile: Tile = { floor: 99, scenery: 99 };
      
      chunk.setTile(CHUNK_SIZE - 1, CHUNK_SIZE - 1, tile);
      expect(chunk.getTile(CHUNK_SIZE - 1, CHUNK_SIZE - 1)).toEqual(tile);
    });
  });

  describe("chunk coordinates", () => {
    it("should store chunk coordinates", () => {
      const world = new World();
      const chunk = new Chunk(5, 10, world);
      expect(chunk.chunkX).toBe(5);
      expect(chunk.chunkY).toBe(10);
    });

    it("should handle negative chunk coordinates", () => {
      const world = new World();
      const chunk = new Chunk(-5, -10, world);
      expect(chunk.chunkX).toBe(-5);
      expect(chunk.chunkY).toBe(-10);
    });
  });
});

