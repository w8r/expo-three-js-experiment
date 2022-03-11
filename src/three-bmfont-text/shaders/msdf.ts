import { Color, Texture, ShaderMaterialParameters, IUniform } from "three";

export function createMSDFShader({
  opacity = 1,
  alphaTest = 0.0001,
  color,
  map,
  precision = "highp",
  negate = true,
  transparent,
  side,
}: {
  negate?: boolean;
  opacity?: number;
  alphaTest?: number;
  precision?: "lowp" | "mediump" | "highp";
  color: string;
  map: Texture;
  transparent?: boolean;
} & ShaderMaterialParameters): ShaderMaterialParameters {
  return {
    uniforms: {
      // @ts-ignore
      opacity: { type: "f", value: opacity },
      // @ts-ignore
      map: { type: "t", value: map || new Texture() },
      // @ts-ignore
      color: { type: "c", value: new Color(color) },
    },
    vertexShader: `
      attribute vec2 uv;
      attribute vec4 position;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * position;
      }
    `,
    fragmentShader: [
      "#ifdef GL_OES_standard_derivatives",
      "#extension GL_OES_standard_derivatives : enable",
      "#endif",
      "precision " + precision + " float;",
      "uniform float opacity;",
      "uniform vec3 color;",
      "uniform sampler2D map;",
      "varying vec2 vUv;",

      "float median(float r, float g, float b) {",
      "  return max(min(r, g), min(max(r, g), b));",
      "}",

      "void main() {",
      "  vec3 sample = " +
        (negate ? "1.0 - " : "") +
        "texture2D(map, vUv).rgb;",
      "  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;",
      "  float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);",
      "  gl_FragColor = vec4(color.xyz, alpha * opacity);",
      alphaTest === 0
        ? ""
        : "  if (gl_FragColor.a < " + alphaTest + ") discard;",
      "}",
    ].join("\n"),
    transparent,
    side,
  };
}
