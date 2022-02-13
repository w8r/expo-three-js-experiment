import { ZoomTransform } from "d3-zoom";
import { PerspectiveCamera } from "three";
import { Graph } from "./types";
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

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function pointOnLine(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  t: number
): Point {
  return { x: sx + t * (ex - sx), y: sy + t * (ey - sy) };
}

export function bbox({ nodes }: Graph) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < nodes.length; i++) {
    const { x = 0, y = 0 } = nodes[i].attributes;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { minX, minY, maxX, maxY };
}

export function getBoundsTransform(
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number,
  canvasWidth: number,
  canvasHeight: number,
  padding = 10
) {
  const w = xmax - xmin || 0;
  const h = ymax - ymin || 0;
  const cx = (xmin + xmax) / 2 || 0;
  const cy = (ymin + ymax) / 2 || 0;

  const hw = canvasWidth / 2;
  const hh = canvasHeight / 2;

  if (isNaN(w) || isNaN(h)) {
    return { x: hw, y: hh, k: 1 };
  }

  const scale =
    w === 0 || h === 0
      ? 8
      : Math.min(canvasWidth / (w + padding), canvasHeight / h + padding);

  return { x: cx * scale, y: cy * scale, k: scale };
}
