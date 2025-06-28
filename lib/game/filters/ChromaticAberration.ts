import { Filter } from 'pixi.js'

const chromaticVertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void) {
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}
`

const chromaticFragment = `
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uAmount;

void main(void) {
    vec2 uv = vTextureCoord;
    
    // Chromatic aberration offset amount
    float amount = 0.002;
    
    // Sample each color channel with slight offset
    float r = texture2D(uSampler, vec2(uv.x + amount, uv.y)).r;
    float g = texture2D(uSampler, uv).g;
    float b = texture2D(uSampler, vec2(uv.x - amount, uv.y)).b;
    float a = texture2D(uSampler, uv).a;
    
    // Add vignette effect for that retro photo feel
    float dist = distance(uv, vec2(0.5, 0.5));
    float vignette = smoothstep(0.8, 0.4, dist);
    
    gl_FragColor = vec4(r, g, b, a) * vignette;
}
`

export class ChromaticAberrationFilter extends Filter {
  constructor(amount: number = 0.002) {
    super({
      glProgram: {
        vertex: chromaticVertex,
        fragment: chromaticFragment,
      },
      resources: {
        chromaticUniforms: {
          uAmount: { value: amount, type: 'f32' }
        }
      }
    })
  }

  get amount(): number {
    return this.resources.chromaticUniforms.uniforms.uAmount
  }

  set amount(value: number) {
    this.resources.chromaticUniforms.uniforms.uAmount = value
  }
}