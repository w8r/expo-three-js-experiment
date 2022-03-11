import { Color, Texture, ShaderMaterialParameters } from "three";

export function createBasicShader({
  opacity = 1,
  alphaTest = 0.0001,
  precision = "highp",
  color,
  map,
}: {
  opacity?: number;
  alphaTest?: number;
  precision?: "lowp" | "mediump" | "highp";
  color: string;
  map: Texture;
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
    fragmentShader: `
      precision ${precision} float;
      uniform float opacity;
      uniform vec3 color;
      uniform sampler2D map;
      varying vec2 vUv;

      void main() {
        gl_FragColor = texture2D(map, vUv) * vec4(color, opacity);
      ${
        alphaTest === 0
          ? ""
          : "  if (gl_FragColor.a < " + alphaTest + ") discard;"
      }
      }
    `,
  };
}
