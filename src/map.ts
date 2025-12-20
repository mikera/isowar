import { Application, Assets, Texture, Rectangle, Matrix, Color, TextureStyle, SCALE_MODES, ParticleContainer, Particle, Shader, GlProgram } from "pixi.js";

interface TileData {
  x: number;
  y: number;
  z: number;
  tileIndex: number;
}

// Isometric offsets
// x direction: [+16, +8] (right and down)
// y direction: [-16, +8] (left and down)
export const xOffsetX = 16;
export const xOffsetY = 8;
export const yOffsetX = -16;
export const yOffsetY = 8;
export const zOffsetY = -16;

interface TileDefinition {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
}

interface TilesConfig {
  image: string;
  tileSize: number;
  tiles: TileDefinition[];
}

  // Custom vertex shader for depth sorting based on y-coordinate
  // This modifies the z-coordinate based on y-position for proper depth buffer ordering
  const customVertexShader = `
attribute vec2 aVertex;
attribute vec2 aUV;
attribute vec4 aColor;

attribute vec2 aPosition;
attribute float aRotation;

uniform mat3 uTranslationMatrix;
uniform float uRound;
uniform vec2 uResolution;
uniform vec4 uColor;

varying vec2 vUV;
varying vec4 vColor;

vec2 roundPixels(vec2 position, vec2 targetSize)
{       
    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

void main(void){
    vec2 v = aVertex + aPosition;

    // This is a crazy hack to get the depth working, since we don't need to use rotation in this shader
    float depth = clamp(aRotation, 0.01, 0.99);
    gl_Position = vec4((uTranslationMatrix * vec3(v, 1.0)).xy, depth, 1.0);

    if(uRound == 1.0)
    {
        gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
    }

    vUV = aUV;
    vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uColor;
}
  `;
  
  // Standard fragment shader (using PixiJS default template)
  const customFragmentShader = `
    varying vec2 vUV;
varying vec4 vColor;

uniform sampler2D uTexture;

void main(void){
    vec4 color = texture2D(uTexture, vUV) * vColor;
    if (color.a ==0.0) discard;
    if (color.a == 1.0) {gl_FragColor = color;}
    
    vec4 alpha=color.aaaa;
    gl_FragColor=alpha*color+(1.0-alpha)*gl_FragColor;
}
  `;

class ParticleShader extends Shader
{
    constructor()
    {
        const glProgram = GlProgram.from({
            vertex: customVertexShader,
            fragment: customFragmentShader
        });

        super({
            glProgram,
            resources: {
                // this will be replaced with the texture from the particle container
                uTexture: Texture.WHITE.source,
                // this will be replaced with the texture style from the particle container
                uSampler: new TextureStyle({}),
                // this will be replaced with the local uniforms from the particle container
                uniforms: {
                    uTranslationMatrix: { value: new Matrix(), type: 'mat3x3<f32>' },
                    uColor: { value: new Color(0xFFFFFF), type: 'vec4<f32>' },
                    uRound: { value: 1, type: 'f32' },
                    uResolution: { value: [0, 0], type: 'vec2<f32>' },
                }
            }
        });
    }
}

export async function createTilemap(_app: Application): Promise<ParticleContainer> {
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

      tiles.push({
        x,
        y,
        z: 0,
        tileIndex: 0,
      });

      if (Math.random() < 0.1) {
        tiles.push({
          x,
          y,
          z: 1,
          tileIndex: 1+Math.floor(Math.random()*4),
        });
      }
    }
  }

  // Create a TileMap container
  const tilemap = new ParticleContainer();
  
  // Enable depth testing for the container through render state
  // Access the renderer and enable depth testing
  if (_app.renderer) {
    const renderer = _app.renderer as any;
    // Enable depth testing in the renderer's state
    if (renderer.gl) {
      const gl = renderer.gl;
      // Enable depth testing
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      // Enable depth writing
      gl.depthMask(true);
    }
  }
  
  // Create particles for each tile and add them to the container
  // Tiles are already sorted by y-coordinate (back to front), so particles will be in correct depth order
  for (const tile of tiles) {
    const screenX = tileToScreenX(tile.x, tile.y, tile.z);
    const screenY = tileToScreenY(tile.x, tile.y, tile.z);
    const depth=0.5-(tile.y+tile.x+tile.z)*0.001;

    const part=new Particle({texture:tileTextures[tile.tileIndex],x:screenX,y:screenY,anchorX:0.5,anchorY:0.75,rotate:depth});

    const light=Math.max(0.0,1.0-distance(part.x,part.y,20,20)/500.0);
    const lightScale=0.1+light*0.9;
    function distance(x1: number, y1: number, x2: number, y2: number): number {
      return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
    }
    // Add random tint to floor blocks (tileIndex 0)
    if (tile.tileIndex >= 0) {
      // Generate random tint value between 0.8 and 0.9
      // Convert to RGB (0-255 range) and then to hex
      const r=Math.floor((Math.random()*0.1+0.5)*255*lightScale);
      const g=Math.floor((Math.random()*0.1+0.6)*255*lightScale);
      const b=Math.floor((Math.random()*0.1+0.4)*255*lightScale);
      part.tint = (r << 16) | (g << 8) | b;
    }
    
    tilemap.addParticle(part);
  }


  tilemap.shader=new ParticleShader();

  return tilemap;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}



/**
 * Calculate the screen X position of a tile given its map coordinates
 * @param mapX The X coordinate in map space
 * @param mapY The Y coordinate in map space
 * @returns The screen X position
 */
export function tileToScreenX(mapX: number, mapY: number, z: number =0): number {
  return mapX * xOffsetX + mapY * yOffsetX;
}

/**
 * Calculate the screen Y position of a tile given its map coordinates
 * @param mapX The X coordinate in map space
 * @param mapY The Y coordinate in map space
 * @returns The screen Y position
 */
export function tileToScreenY(mapX: number, mapY: number, z: number): number {
  return mapX * xOffsetY + mapY * yOffsetY + z*zOffsetY;
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
