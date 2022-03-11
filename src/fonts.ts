import { DoubleSide, LoadingManager, RawShaderMaterial, Texture } from "three";
import font from "../assets/OpenSans/OpenSans.json";
const GlyphURL = require("../assets/OpenSans/OpenSans.png");
// @ts-ignore
import { createMSDFShader } from "./three-bmfont-text/shaders/msdf";
import { createBasicShader } from "./three-bmfont-text/shaders/basic";
import { TextureLoader } from "expo-three";
import { createTextGeometry } from "./three-bmfont-text/index";

const vertexShader = `
      attribute vec2 uv;
      attribute vec4 position;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      varying vec2 vUv;
  void main(){
    vec3 pos = position.xyz ;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
    vUv = uv;
  }
`;

const fragmentShader = `
 #ifdef GL_OES_standard_derivatives
      #extension GL_OES_standard_derivatives : enable
      #endif
      precision  highp  float;
      uniform float opacity;
      uniform vec3 color;
      uniform sampler2D map;
      varying vec2 vUv;

      float median(float r, float g, float b) {
        return max(min(r, g), min(max(r, g), b));
      }

      void main() {
        vec3 sample =  texture2D(map, vUv).rgb;
        float sigDist = median(sample.r, sample.g, sample.b) - 0.5;
        abs(dFdx(sigDist)) + abs(dFdy(sigDist));
        float w = fwidth(sigDist);
        float alpha = clamp((sigDist) / w + 0.5 , 0.0, 1.0);
        gl_FragColor = vec4(color.xyz, alpha * opacity);
        if (gl_FragColor.a < 0.0001 ) discard;
      }
`;

export function createTextMaterial(glyphs: Texture, color: string) {
  console.log(glyphs);
  const mdsf = createMSDFShader({
    transparent: true,
    side: DoubleSide,
    map: glyphs,
    color: color,
    //negate: false,
  });
  return new RawShaderMaterial({
    ...mdsf,
    extensions: { derivatives: true },
    // fragmentShader,
    // vertexShader,
  });
}

export function createGeometry(text: string) {
  return createTextGeometry({
    font,
    align: "center",
    text,
  });
}

export function loadGlyphs(): Promise<Texture> {
  return new Promise((resolve) => {
    const manager = new LoadingManager(() => {});
    load(manager).then((glyphs) => {
      manager.itemStart("a");
      manager.itemEnd("a");
      resolve(glyphs as Texture);
    });
  });
}

function load(manager: LoadingManager) {
  const glyphsLoader = new TextureLoader(manager);
  glyphsLoader.crossOrigin = "";
  return new Promise((resolve) => glyphsLoader.load(GlyphURL, resolve));
}
