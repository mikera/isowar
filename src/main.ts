import { Application, Assets, Sprite, Container, SCALE_MODES } from "pixi.js";
import { BloomFilter } from "@pixi/filter-bloom";
import { createTilemap, tileToScreenX, tileToScreenY } from "./map";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window, antialias: false });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Add bloom filter to the top level (stage)
  const bloomFilter = new BloomFilter();
  app.stage.filters = [bloomFilter as any];

  // Create a world container that will be moved by the camera
  const world = new Container();
  app.stage.addChild(world);

  // Create and add the tilemap to the world
  const tilemap = await createTilemap(app);
  world.addChild(tilemap);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");
  // Ensure bunny texture uses NEAREST scaling
  if (texture.source) {
    texture.source.scaleMode = SCALE_MODES.NEAREST;
  }

  // Create a bunny Sprite
  const bunny = new Sprite(texture);

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Bunny's logical map coordinates (starting at 10, 10)
  let bunnyMapX = 10;
  let bunnyMapY = 10;

  // Convert initial map coordinates to screen position
  bunny.position.set(
    tileToScreenX(bunnyMapX, bunnyMapY),
    tileToScreenY(bunnyMapX, bunnyMapY)
  );

  // Add the bunny to the world
  world.addChild(bunny);

  // Camera position (target position to center on bunny)
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

  // Listen for animate update
  app.ticker.add((time) => {
    // Movement speed in map coordinates per frame
    const moveSpeed = 0.1 * time.deltaTime;
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

    // Update bunny's map coordinates
    bunnyMapX += moveX * moveSpeed;
    bunnyMapY += moveY * moveSpeed;

    // Convert updated map coordinates to screen position
    bunny.position.set(
      tileToScreenX(bunnyMapX, bunnyMapY),
      tileToScreenY(bunnyMapX, bunnyMapY)
    );

    // Calculate target camera position to center bunny on screen
    // Account for zoom factor in the calculation
    const targetCameraX = app.screen.width / 2 - bunny.x * zoom;
    const targetCameraY = app.screen.height / 2 - bunny.y * zoom;

    // Smoothly interpolate camera position towards target
    const cameraSpeed = 0.1 * time.deltaTime;
    cameraX += (targetCameraX - cameraX) * cameraSpeed;
    cameraY += (targetCameraY - cameraY) * cameraSpeed;

    // Update world container position (move camera)
    world.position.set(cameraX, cameraY);

  });
})();
