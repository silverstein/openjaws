import { Filter, GlProgram } from "pixi.js"

const chromaticVertex = `
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

const chromaticFragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uAmount;

void main(void) {
    vec2 uv = vTextureCoord;

    // Chromatic aberration offset amount
    float amount = uAmount;

    // Sample each color channel with slight offset
    float r = texture(uTexture, vec2(uv.x + amount, uv.y)).r;
    float g = texture(uTexture, uv).g;
    float b = texture(uTexture, vec2(uv.x - amount, uv.y)).b;
    float a = texture(uTexture, uv).a;

    // Add vignette effect for that retro photo feel
    float dist = distance(uv, vec2(0.5, 0.5));
    float vignette = smoothstep(0.8, 0.4, dist);

    finalColor = vec4(r, g, b, a) * vignette;
}
`

export class ChromaticAberrationFilter extends Filter {
  constructor(amount: number = 0.002) {
    const glProgram = GlProgram.from({
      vertex: chromaticVertex,
      fragment: chromaticFragment,
    })

    super({
      glProgram,
      resources: {
        chromaticUniforms: {
          uAmount: { value: amount, type: "f32" },
        },
      },
    })
  }

  get amount(): number {
    return (this.resources["chromaticUniforms"] as { uniforms: { uAmount: number } }).uniforms
      .uAmount
  }

  set amount(value: number) {
    ;(this.resources["chromaticUniforms"] as { uniforms: { uAmount: number } }).uniforms.uAmount =
      value
  }
}
