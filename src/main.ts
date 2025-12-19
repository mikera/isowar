import { Application, Assets, Sprite, Graphics, Texture } from "pixi.js";
import { CompositeTilemap } from "@pixi/tilemap";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Create tile textures using Graphics
  const tileSize = 32;
  const tileTextures: Texture[] = [];

  // Create different colored tiles
  const colors = [0x4a90e2, 0x7ed321, 0xf5a623, 0xbd10e0, 0x50e3c2];
  
  colors.forEach((color) => {
    const graphics = new Graphics();
    graphics.rect(0, 0, tileSize, tileSize);
    graphics.fill(color);
    // Add a border for better visibility
    graphics.stroke({ width: 1, color: 0x333333 });
    tileTextures.push(app.renderer.generateTexture(graphics));
  });

  // Isometric offsets
  // x direction: [+16, +8] (right and down)
  // y direction: [-16, +8] (left and down)
  const xOffsetX = 16;
  const xOffsetY = 8;
  const yOffsetX = -16;
  const yOffsetY = 8;

  // Calculate map dimensions for isometric grid
  // Need enough tiles to cover the screen with isometric layout
  const mapWidth = Math.ceil(app.screen.width / 16) + 10;
  const mapHeight = Math.ceil(app.screen.height / 8) + 10;

  // Store tile data for sorting by rendering order
  interface TileData {
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    tileIndex: number;
  }

  const tiles: TileData[] = [];

  // Calculate screen positions for all tiles
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      // Convert isometric coordinates to screen coordinates
      const screenX = x * xOffsetX + y * yOffsetX;
      const screenY = x * xOffsetY + y * yOffsetY;
      
      // Only add tiles that are visible on screen (with some margin)
      if (screenX > -tileSize && screenX < app.screen.width + tileSize &&
          screenY > -tileSize && screenY < app.screen.height + tileSize) {
        const tileIndex = (x + y) % tileTextures.length;
        tiles.push({
          x,
          y,
          screenX,
          screenY,
          tileIndex,
        });
      }
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

  // Add tilemap to stage (behind other objects)
  app.stage.addChild(tilemap);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

  // Create a bunny Sprite
  const bunny = new Sprite(texture);

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  bunny.position.set(app.screen.width / 2, app.screen.height / 2);

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  // Track mouse position
  let mouseX = app.screen.width / 2;
  let mouseY = app.screen.height / 2;

  // Listen for mouse movement
  app.canvas.addEventListener("mousemove", (event) => {
    const rect = app.canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  });

  // Listen for animate update
  app.ticker.add((time) => {
    // Calculate distance to mouse
    const dx = mouseX - bunny.x;
    const dy = mouseY - bunny.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move bunny towards mouse with smooth interpolation
    const speed = 0.05 * time.deltaTime; // Adjust speed multiplier as needed
    if (distance > 1) {
      bunny.x += dx * speed;
      bunny.y += dy * speed;
    }

    // Rotate bunny to face the mouse direction
    bunny.rotation = Math.atan2(dy, dx);
  });
})();
