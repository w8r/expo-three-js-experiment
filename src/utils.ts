import { ZoomTransform } from "d3-zoom";
import { PerspectiveCamera } from "three";
export interface Point {
  x: number;
  y: number;
}

export type Transform = {
  x: number;
  y: number;
  k: number;
};

export function distance(x1: number, y1: number, x2: number, y2: number) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

export function center(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };
}

function toRadians(angle: number) {
  return angle * (Math.PI / 180);
}

export function getScaleFromZ(z: number, fov: number, height: number) {
  const halfFov = toRadians(fov / 2);
  const halfFovHeight = Math.tan(halfFov) * z;
  const fovHeight = halfFovHeight * 2;
  // Divide visualization height by height derived from field of view
  return height / fovHeight;
}

export function getZFromScale(scale: number, fov: number, height: number) {
  const halfFov = toRadians(fov / 2);
  const scaleHeight = height / scale;
  return scaleHeight / (2 * Math.tan(halfFov));
}

export function positionThreeCamera(
  camera: PerspectiveCamera,
  t: Pick<ZoomTransform, "x" | "y" | "k">,
  w: number,
  h: number,
  fov: number
) {
  const scale = t.k;
  const x = -t.x / scale;
  const y = t.y / scale;
  const z = getZFromScale(t.k, fov, h);
  camera.position.set(x, y, z);
}
