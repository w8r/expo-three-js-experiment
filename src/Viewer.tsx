import * as React from "react";
import { useState, useRef } from "react";
import { PanResponder, ViewProps, Animated, View } from "react-native";
import { Canvas } from "./Canvas";
import {
  createTranslationMatrix,
  distance as calcDistance,
  getTransform,
  viewTransformMult,
  ViewTransform,
  createScalingMatrix,
  ViewDimensions,
  createIdentityTransform,
} from "./utils";

export interface ViewerProps extends ViewProps {
  width?: number;
  height?: number;
  minScale?: number;
  maxScale?: number;
  initialZoom?: number;
  canvasHeight?: number;
  canvasWidth?: number;
  onZoom?: (zoom: number) => void;
}

const noop = (zoom: number) => {};

function getInitialViewTransform(
  canvasWidth: number,
  canvasHeight: number,
  scale: number
): ViewTransform {
  return viewTransformMult(
    createTranslationMatrix(
      -(canvasWidth - canvasWidth * scale) / 2,
      -(canvasHeight - canvasHeight * scale) / 2
    ),
    createScalingMatrix(scale)
  );
}

export function Viewer({
  width = 1080,
  height = 720,
  minScale = 0.5,
  maxScale = 1.0,
  initialZoom = 0.7,
  onZoom = noop,
}: ViewerProps) {
  const originalTransform = getInitialViewTransform(width, height, initialZoom);
  const mainViewRef = useRef();

  //Layout state
  const [layoutKnown, setLayoutKnown] = useState(false);
  const [viewDimensions, setViewDimensions] = useState<ViewDimensions>({
    height: 0,
    width: 0,
    pageX: 0,
    pageY: 0,
  });

  //ViewTransform state
  const [viewTransform, setViewTransform] = useState(originalTransform);

  const [isScaling, setIsScaling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [initialDistance, setInitialDistance] = useState(1);
  const [initialTransform, setInitialTransform] = useState(
    createIdentityTransform()
  );
  //const [initialScale] = useState(initialZoom);
  //const [initialTranslation] = useState({ x: 0, y: 0 });

  const [initialGestureState, setGestureState] = useState({ dx: 0, dy: 0 });

  //ViewTransform animation state
  const translationAnimation = useRef(
    new Animated.ValueXY({
      x: originalTransform.translateX,
      y: originalTransform.translateY,
    })
  ).current;
  const scaleAnimation = useRef(
    new Animated.Value(originalTransform.scaleX)
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    })
  ).current;

  const onLayout = () => {};

  return (
    <Canvas
      ref={mainViewRef}
      onLayout={onLayout}
      {...panResponder.panHandlers}
    />
  );
}
