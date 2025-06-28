import { Filter } from 'pixi.js'

const waterVertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void) {
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}
`

const waterFragment = `
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
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
    vec4 color = texture2D(uSampler, uv);
    
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
    
    gl_FragColor = color;
}
`

export class WaterShader extends Filter {
  constructor() {
    super({
      glProgram: {
        vertex: waterVertex,
        fragment: waterFragment,
      },
      resources: {
        waterUniforms: {
          uTime: { value: 0, type: 'f32' }
        }
      }
    })
  }

  get time(): number {
    return this.resources.waterUniforms.uniforms.uTime
  }

  set time(value: number) {
    this.resources.waterUniforms.uniforms.uTime = value
  }
}

export function createWaterShader(): WaterShader | null {
  try {
    return new WaterShader()
  } catch (error) {
    console.error('Failed to create water shader:', error)
    return null
  }
}