export interface Point {
  x: number;
  y: number;
}

type TransformProps = {
  left: number;
  top: number;
  zoom: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
};

export type Transform = {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
};

export interface ViewTransform {
  scaleX: number;
  skewX: number;
  skewY: number;
  scaleY: number;
  translateX: number;
  translateY: number;
}

export interface ViewDimensions {
  height: number;
  width: number;
  pageX: number;
  pageY: number;
}

export type Align = "min" | "max" | "start" | "mid" | "end" | "none";

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

export const getZoomTransform = ({
  left,
  top,
  zoom,
  scaleX,
  scaleY,
  translateX,
  translateY,
}: TransformProps): Transform => ({
  translateX: left + zoom * translateX,
  translateY: top + zoom * translateY,
  scaleX: zoom * scaleX,
  scaleY: zoom * scaleY,
});

export function getAlignment(align: Align) {
  switch (align) {
    case "min":
    case "start":
      return "xMinYMin";

    case "mid":
      return "xMidYMid";

    case "max":
    case "end":
      return "xMaxYMax";

    default:
      return align || "xMidYMid";
  }
}

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function getTransform(
  vbRect: Rect,
  eRect: Rect,
  align: Align,
  meetOrSlice: "meet" | "slice"
) {
  // based on
  // https://svgwg.org/svg2-draft/coords.html#ComputingAViewportsTransform

  // Let vb-x, vb-y, vb-width, vb-height be the min-x, min-y, width and height
  // values of the viewBox attribute respectively.
  const vbX = vbRect.left || 0;
  const vbY = vbRect.top || 0;
  const vbWidth = vbRect.width;
  const vbHeight = vbRect.height;

  // Let e-x, e-y, e-width, e-height be the position and size of the element
  // respectively.
  const eX = eRect.left || 0;
  const eY = eRect.top || 0;
  const eWidth = eRect.width;
  const eHeight = eRect.height;

  // Initialize scale-x to e-width/vb-width.
  let scaleX = eWidth / vbWidth;

  // Initialize scale-y to e-height/vb-height.
  let scaleY = eHeight / vbHeight;

  // Initialize translate-x to e-x - (vb-x * scale-x).
  // Initialize translate-y to e-y - (vb-y * scale-y).
  let translateX = eX - vbX * scaleX;
  let translateY = eY - vbY * scaleY;

  // If align is 'none'
  if (align === "none") {
    // Let scale be set the smaller value of scale-x and scale-y.
    // Assign scale-x and scale-y to scale.
    const scale = (scaleX = scaleY = Math.min(scaleX, scaleY));

    // If scale is greater than 1
    if (scale > 1) {
      // Minus translateX by (eWidth / scale - vbWidth) / 2
      // Minus translateY by (eHeight / scale - vbHeight) / 2
      translateX -= (eWidth / scale - vbWidth) / 2;
      translateY -= (eHeight / scale - vbHeight) / 2;
    } else {
      translateX -= (eWidth - vbWidth * scale) / 2;
      translateY -= (eHeight - vbHeight * scale) / 2;
    }
  } else {
    // If align is not 'none' and meetOrSlice is 'meet', set the larger of
    // scale-x and scale-y to the smaller.
    // Otherwise, if align is not 'none' and meetOrSlice is 'slice',
    // set the smaller of scale-x and scale-y to the larger.

    if (meetOrSlice === "meet") {
      scaleX = scaleY = Math.min(scaleX, scaleY);
    } else if (meetOrSlice === "slice") {
      scaleX = scaleY = Math.max(scaleX, scaleY);
    }

    // If align contains 'xMid', add (e-width - vb-width * scale-x) / 2 to
    // translate-x.
    if (align.includes("xMid")) {
      translateX += (eWidth - vbWidth * scaleX) / 2;
    }

    // If align contains 'xMax', add (e-width - vb-width * scale-x)
    // to translate-x.
    if (align.includes("xMax")) {
      translateX += eWidth - vbWidth * scaleX;
    }

    // If align contains 'yMid', add (e-height - vb-height * scale-y) / 2
    // to translate-y.
    if (align.includes("YMid")) {
      translateY += (eHeight - vbHeight * scaleY) / 2;
    }

    // If align contains 'yMax', add (e-height - vb-height * scale-y)
    // to translate-y.
    if (align.includes("YMax")) {
      translateY += eHeight - vbHeight * scaleY;
    }
  }

  // The transform applied to content contained by the element is given by
  // translate(translate-x, translate-y) scale(scale-x, scale-y).
  return {
    translateX,
    translateY,
    scaleX,
    scaleY,
    eRect,
  };
}

export const createIdentityTransform = () => ({
  scaleX: 1,
  skewX: 0,
  skewY: 0,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
});

export const createTranslationMatrix = (
  translateX: number,
  translateY: number
): ViewTransform => ({
  scaleX: 1,
  skewX: 0,
  skewY: 0,
  scaleY: 1,
  translateX: translateX,
  translateY: translateY,
});

export const createScalingMatrix = (scale: number): ViewTransform => ({
  scaleX: scale,
  skewX: 0,
  skewY: 0,
  scaleY: scale,
  translateX: 0,
  translateY: 0,
});

export function viewTransformMult(
  vtA: ViewTransform,
  vtB: ViewTransform
): ViewTransform {
  //Convert ViewTransform to conventional 3x3 matrices
  const mA = [
    vtA.scaleX,
    vtA.skewY,
    vtA.translateX,
    vtA.skewX,
    vtA.scaleY,
    vtA.translateY,
  ];
  const mB = [
    vtB.scaleX,
    vtB.skewY,
    vtB.translateX,
    vtB.skewX,
    vtB.scaleY,
    vtB.translateY,
  ];
  const mC = [];
  mC[0] = mA[0] * mB[0] + mA[1] * mB[3];
  mC[1] = mA[0] * mB[1] + mA[1] * mB[4];
  mC[2] = mA[0] * mB[2] + mA[1] * mB[5] + mA[2] * 1;
  mC[3] = mA[3] * mB[0] + mA[4] * mB[3];
  mC[4] = mA[3] * mB[1] + mA[4] * mB[4];
  mC[5] = mA[3] * mB[2] + mA[4] * mB[5] + mA[5] * 1;

  return {
    scaleX: mC[0],
    skewX: mC[3],
    skewY: mC[1],
    scaleY: mC[4],
    translateX: mC[2],
    translateY: mC[5],
  };
}

export function getBoundedPinchTransform(
  prev: ViewTransform,
  current: ViewTransform,
  minScale: number,
  maxScale: number
): ViewTransform {
  const bounded = { ...current };

  //Calculate scale bounds
  bounded.scaleX = Math.min(Math.max(bounded.scaleX, minScale), maxScale);
  bounded.scaleY = Math.min(Math.max(bounded.scaleY, minScale), maxScale);

  if (bounded.scaleX !== current.scaleX || bounded.scaleY !== current.scaleY) {
    bounded.translateX = prev.translateX;
    bounded.translateY = prev.translateY;
  }

  return bounded;
}

export function getBoundedTouchTransform(
  initial: ViewTransform,
  prev: ViewTransform,
  current: ViewTransform,
  viewDim: ViewDimensions,
  w: number,
  h: number
): ViewTransform {
  const bounded = { ...current };

  const scaledCanvas = {
    width: bounded.scaleX * w,
    height: bounded.scaleY * h,
  };

  let maxBounds: Point = {
    x: Infinity,
    y: Infinity,
  };

  let minBounds: Point = {
    x: -Infinity,
    y: -Infinity,
  };

  const zoomDisplacement: Point = {
    x: (w - scaledCanvas.width) / 2,
    y: (h - scaledCanvas.height) / 2,
  };

  const extendPercentage = 0.2;
  const extendLimit = viewDim.width * extendPercentage;

  //Entire Canvas can be seen within the view
  if (
    scaledCanvas.width < viewDim.width &&
    scaledCanvas.height < viewDim.height
  ) {
    maxBounds = {
      x: viewDim.width - scaledCanvas.width + extendLimit - zoomDisplacement.x,
      y:
        viewDim.height - scaledCanvas.height + extendLimit - zoomDisplacement.y,
    };

    minBounds = {
      x: -zoomDisplacement.x - extendLimit,
      y: -zoomDisplacement.y - extendLimit,
    };

    if (initial.translateX > maxBounds.x) {
      maxBounds.x = initial.translateX;
    }

    if (initial.translateX < minBounds.x) {
      minBounds.x = initial.translateX;
    }

    if (initial.translateY > maxBounds.y) {
      maxBounds.y = initial.translateY;
    }

    if (initial.translateY < minBounds.y) {
      minBounds.y = initial.translateY;
    }
  } else {
    maxBounds = {
      x: viewDim.width - zoomDisplacement.x - extendLimit,
      y: viewDim.height - zoomDisplacement.y - extendLimit,
    };

    minBounds = {
      x: -zoomDisplacement.x - scaledCanvas.width + extendLimit,
      y: -zoomDisplacement.y - scaledCanvas.height + extendLimit,
    };
  }

  bounded.translateX = Math.min(
    Math.max(bounded.translateX, minBounds.x),
    maxBounds.x
  );
  bounded.translateY = Math.min(
    Math.max(bounded.translateY, minBounds.y),
    maxBounds.y
  );

  return bounded;
}
