import { Application, Assets, Sprite } from "pixi.js";
import { createTilemap, tileToScreenX, tileToScreenY, screenToTileX, screenToTileY } from "./map";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Create and add the tilemap
  const tilemap = await createTilemap(app);
  app.stage.addChild(tilemap);

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

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  // Track mouse position in screen coordinates
  let mouseScreenX = app.screen.width / 2;
  let mouseScreenY = app.screen.height / 2;

  // Listen for mouse movement
  app.canvas.addEventListener("mousemove", (event) => {
    const rect = app.canvas.getBoundingClientRect();
    mouseScreenX = event.clientX - rect.left;
    mouseScreenY = event.clientY - rect.top;
  });

  // Listen for animate update
  app.ticker.add((time) => {
    // Convert mouse screen coordinates to map coordinates
    const mouseMapX = screenToTileX(mouseScreenX, mouseScreenY);
    const mouseMapY = screenToTileY(mouseScreenX, mouseScreenY);

    // Calculate distance to mouse in map space
    const dx = mouseMapX - bunnyMapX;
    const dy = mouseMapY - bunnyMapY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move bunny towards mouse in map space with smooth interpolation
    const speed = 0.05 * time.deltaTime; // Adjust speed multiplier as needed
    if (distance > 0.1) {
      bunnyMapX += dx * speed;
      bunnyMapY += dy * speed;
    }

    // Convert updated map coordinates to screen position
    bunny.position.set(
      tileToScreenX(bunnyMapX, bunnyMapY),
      tileToScreenY(bunnyMapX, bunnyMapY)
    );

    // Rotate bunny to face the mouse direction (in screen space for visual effect)
    const screenDx = mouseScreenX - bunny.x;
    const screenDy = mouseScreenY - bunny.y;
    bunny.rotation = Math.atan2(screenDy, screenDx);
  });
})();
