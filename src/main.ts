import { Application, Assets, Sprite, Container } from "pixi.js";
import { createTilemap, tileToScreenX, tileToScreenY } from "./map";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Create a world container that will be moved by the camera
  const world = new Container();
  app.stage.addChild(world);

  // Create and add the tilemap to the world
  const tilemap = await createTilemap(app);
  world.addChild(tilemap);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

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

  // Track which keys are currently pressed
  const keysPressed = new Set<string>();

  // Listen for keydown events
  window.addEventListener("keydown", (event) => {
    keysPressed.add(event.key.toLowerCase());
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
    const targetCameraX = app.screen.width / 2 - bunny.x;
    const targetCameraY = app.screen.height / 2 - bunny.y;

    // Smoothly interpolate camera position towards target
    const cameraSpeed = 0.1 * time.deltaTime;
    cameraX += (targetCameraX - cameraX) * cameraSpeed;
    cameraY += (targetCameraY - cameraY) * cameraSpeed;

    // Update world container position (move camera)
    world.position.set(cameraX, cameraY);

    // Rotate bunny to face movement direction
    if (moveX !== 0 || moveY !== 0) {
      // Calculate screen direction from map direction
      const screenDx = tileToScreenX(moveX, moveY) - tileToScreenX(0, 0);
      const screenDy = tileToScreenY(moveX, moveY) - tileToScreenY(0, 0);
    }
  });
})();
