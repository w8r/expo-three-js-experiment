import { Color, Texture, ShaderMaterialParameters } from "three";

module.exports = function createMultipageShader({
  opacity = 1,
  alphaTest = 0.0001,
  precision = "highp",
  textures = [],
  color,
}: {
  color: string;
  opacity?: number;
  alphaTest?: number;
  precision?: string;
  textures?: Texture[];
} & ShaderMaterialParameters): ShaderMaterialParameters {
  const baseUniforms: Record<string, { type: "t"; value: Texture }> = {};
  textures.forEach(function (tex, i) {
    baseUniforms["texture" + i] = {
      type: "t",
      value: tex,
    };
  });

  const samplers = textures
    .map(function (tex, i) {
      return "uniform sampler2D texture" + i + ";";
    })
    .join("\n");

  const body = textures
    .map((tex, i) => {
      const cond = i === 0 ? "if" : "else if";
      return [
        cond + " (vPage == " + i + ".0) {",
        "sampleColor = texture2D(texture" + i + ", vUv);",
        "}",
      ].join("\n");
    })
    .join("\n");

  return {
    uniforms: {
      ...baseUniforms,
      // @ts-ignore
      opacity: { type: "f", value: opacity },
      // @ts-ignore
      color: { type: "c", value: new Color(color) },
    },
    vertexShader: `
      attribute vec4 position;
      attribute vec2 uv;
      attribute float page;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      varying vec2 vUv;
      varying float vPage;
      void main() {
        vUv = uv;
        vPage = page;
        gl_Position = projectionMatrix * modelViewMatrix * position;
      }
    `,
    fragmentShader: `
      precision "${precision}" float;
      uniform float opacity;
      uniform vec3 color;
      ${samplers}
      varying float vPage;
      varying vec2 vUv;
      void main() {
        vec4 sampleColor = vec4(0.0);
        ${body}
        gl_FragColor = sampleColor * vec4(color, opacity);
        ${
          alphaTest === 0
            ? ""
            : "  if (gl_FragColor.a < " + alphaTest + ") discard;"
        }
      }
    `,
  };
};
