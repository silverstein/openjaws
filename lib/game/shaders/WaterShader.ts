import { Filter, GlProgram } from "pixi.js"
import { gameLogger } from "@/lib/logger"

const waterVertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`

const waterFragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;

void main(void) {
    vec2 uv = vTextureCoord;

    // Create wave distortion
    float waveX = sin(uv.y * 20.0 + uTime * 2.0) * 0.005;
    float waveY = cos(uv.x * 15.0 + uTime * 1.5) * 0.005;

    // Apply distortion
    uv.x += waveX;
    uv.y += waveY;

    // Get the color with distortion
    vec4 color = texture(uTexture, uv);

    // Add cel-shading effect
    float brightness = (color.r + color.g + color.b) / 3.0;

    if (brightness > 0.7) {
        color.rgb *= 1.1;
    } else if (brightness > 0.5) {
        color.rgb *= 0.9;
    } else if (brightness > 0.3) {
        color.rgb *= 0.7;
    } else {
        color.rgb *= 0.5;
    }

    // Add subtle color shift for that 70s vibe
    color.r += sin(uTime * 0.5) * 0.02;
    color.b += cos(uTime * 0.7) * 0.02;

    finalColor = color;
}
`

export class WaterShader extends Filter {
  constructor() {
    const glProgram = GlProgram.from({
      vertex: waterVertex,
      fragment: waterFragment,
    })

    super({
      glProgram,
      resources: {
        waterUniforms: {
          uTime: { value: 0, type: "f32" },
        },
      },
    })
  }

  get time(): number {
    return (this.resources["waterUniforms"] as { uniforms: { uTime: number } }).uniforms.uTime
  }

  set time(value: number) {
    ;(this.resources["waterUniforms"] as { uniforms: { uTime: number } }).uniforms.uTime = value
  }
}

export function createWaterShader(): WaterShader | null {
  try {
    return new WaterShader()
  } catch (error) {
    gameLogger.error("Failed to create water shader:", error)
    return null
  }
}
