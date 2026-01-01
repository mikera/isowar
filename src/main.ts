import { Application, Assets, Sprite, Container, SCALE_MODES, Text, Texture, Rectangle } from "pixi.js";
import { BloomFilter } from "@pixi/filter-bloom";
import { createTilemap, tileToScreenX, tileToScreenY } from "./map";

/**
 * Game update rate in ticks per second
 */
const TICKS_PER_SECOND = 60;
const TICK_DURATION_MS = 1000 / TICKS_PER_SECOND;

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#102030", resizeTo: window, antialias: false,depth: true });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Add bloom filter to the top level (stage)
  const bloomFilter = new BloomFilter();
  app.stage.filters = [bloomFilter as any];

  // Create FPS counter text (add to stage so it stays fixed on screen)
  const fpsText = new Text("FPS: 0", {
    fontFamily: "Arial",
    fontSize: 16,
    fill: 0xffffff,
  });
  fpsText.position.set(10, 10);
  fpsText.zIndex = 1000; // Ensure it's on top
  app.stage.addChild(fpsText);

  // Create a world container that will be moved by the camera
  const world = new Container();
  app.stage.addChild(world);

  // Create and add the tilemap to the world
  const tilemap = await createTilemap(app);
  world.addChild(tilemap);

  // Load sprites configuration
  const spritesConfigResponse = await fetch("/assets/sprites.json");
  const spritesConfig = await spritesConfigResponse.json();
  
  // Load the isometric art texture
  const isometricArtTexture = await Assets.load(spritesConfig.image);
  // Ensure texture uses NEAREST scaling
  if (isometricArtTexture.source) {
    isometricArtTexture.source.scaleMode = SCALE_MODES.NEAREST;
  }

  // Find soldier sprite definition
  const soldierDef = spritesConfig.sprites.find((s: any) => s.name === "soldier");
  if (!soldierDef) {
    throw new Error("Soldier sprite not found in sprites.json");
  }

  // Extract soldier sprite from the configuration
  const spriteSize = spritesConfig.spriteSize;
  const soldierFrame = new Rectangle(soldierDef.x, soldierDef.y, spriteSize, spriteSize);
  const soldierTexture = new Texture({
    source: isometricArtTexture.source,
    frame: soldierFrame,
  });
  // Ensure soldier texture uses NEAREST scaling
  if (soldierTexture.source) {
    soldierTexture.source.scaleMode = SCALE_MODES.NEAREST;
  }

  // Create a soldier Sprite
  const soldier = new Sprite(soldierTexture);

  // Center the sprite's anchor point
  soldier.anchor.set(0.5);

  // Soldier's logical map coordinates (starting at 10, 10)
  let soldierMapX = 10;
  let soldierMapY = 10;

  // Convert initial map coordinates to screen position
  soldier.position.set(
    tileToScreenX(soldierMapX, soldierMapY),
    tileToScreenY(soldierMapX, soldierMapY, 1)
  );

  // Add the soldier to the world
  world.addChild(soldier);

  // Camera position (target position to center on soldier)
  let cameraX = 0;
  let cameraY = 0;

  // Camera zoom factor (start at 2.0)
  let zoom = 2.0;
  world.scale.set(zoom);

  // Track which keys are currently pressed
  const keysPressed = new Set<string>();

  // Listen for keydown events
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    keysPressed.add(key);

    // Handle zoom controls
    if (key === "+" || key === "=") {
      zoom = Math.min(zoom *2, 16.0); // Zoom in, max 5x
      world.scale.set(zoom);
    } else if (key === "-" || key === "_") {
      zoom = Math.max(zoom *0.5, 0.125); // Zoom out, min 0.5x
      world.scale.set(zoom);
    }
  });

  // Listen for keyup events
  window.addEventListener("keyup", (event) => {
    keysPressed.delete(event.key.toLowerCase());
  });

  // Game update loop state
  let lastGameUpdateTime = performance.now();
  let gameUpdateAccumulator = 0;

  /**
   * Game update function - runs at fixed TICKS_PER_SECOND rate
   * Handles game logic: movement, world updates, etc.
   */
  function gameUpdate(): void {
    // Movement speed in map coordinates per tick
    const moveSpeed = 0.1;
    let moveX = 0;
    let moveY = 0;

    // Check for WASD key presses and calculate movement
    if (keysPressed.has("w")) {
      moveX -= 1;
      moveY -= 1;
    }
    if (keysPressed.has("s")) {
      moveX += 1;
      moveY += 1;
    }
    if (keysPressed.has("a")) {
      moveX -= 1;
      moveY += 1;
    }
    if (keysPressed.has("d")) {
      moveX += 1;
      moveY -= 1;
    }

    // Update soldier's map coordinates
    soldierMapX += moveX * moveSpeed;
    soldierMapY += moveY * moveSpeed;

    // Convert updated map coordinates to screen position
    soldier.position.set(
      tileToScreenX(soldierMapX, soldierMapY),
      tileToScreenY(soldierMapX, soldierMapY, 1)
    );
  }

  /**
   * Render update function - runs at display framerate
   * Handles camera movement, rendering, and display updates
   */
  function renderUpdate(deltaTime: number): void {
    // Update FPS counter
    const fps = Math.round(app.ticker.FPS);
    fpsText.text = `FPS: ${fps}`;

    // Calculate target camera position to center soldier on screen
    // Account for zoom factor in the calculation
    const targetCameraX = app.screen.width / 2 - soldier.x * zoom;
    const targetCameraY = app.screen.height / 2 - soldier.y * zoom;

    // Smoothly interpolate camera position towards target
    const cameraSpeed = 0.1 * deltaTime;
    cameraX += (targetCameraX - cameraX) * cameraSpeed;
    cameraY += (targetCameraY - cameraY) * cameraSpeed;

    // Update world container position (move camera)
    world.position.set(Math.floor(cameraX), Math.floor(cameraY));
  }

  // PixiJS ticker for rendering (runs at display framerate)
  app.ticker.add((time) => {
    const currentTime = performance.now();
    const frameTime = currentTime - lastGameUpdateTime;
    lastGameUpdateTime = currentTime;

    // Accumulate time for fixed timestep game updates
    gameUpdateAccumulator += frameTime;

    // Run game updates at fixed rate
    while (gameUpdateAccumulator >= TICK_DURATION_MS) {
      gameUpdate();
      gameUpdateAccumulator -= TICK_DURATION_MS;
    }

    // Render update (camera, display) runs every frame
    renderUpdate(time.deltaTime);
  });
})();
