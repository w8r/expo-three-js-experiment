import * as React from "react";
import { useState, useRef, useCallback } from "react";
import {
  PanResponder,
  ViewProps,
  Animated,
  View,
  LayoutChangeEvent,
  PanResponderGestureState,
} from "react-native";
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
  getBoundedPinchTransform,
  Point,
  center as calcCenter,
  getBoundedTouchTransform,
} from "./utils";
import { usePanResponder } from "./usePanResponder";

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
  minScale = 0.0001,
  maxScale = 10.0,
  initialZoom = 1.0,
  onZoom = noop,
}: ViewerProps) {
  const originalTransform = getInitialViewTransform(width, height, initialZoom);
  const mainViewRef = useRef<typeof Canvas>();

  const [state, setState] = useState({
    isMoving: false,
    isScaling: false,
    initialGestureState: { dx: 0, dy: 0 },
    initialDistance: 1,
    viewTransform: originalTransform,
    initialTransform: createIdentityTransform(),
    viewDimensions: {
      height: 0,
      width: 0,
      pageX: 0,
      pageY: 0,
    },
  });

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

  let prTargetSelf: number, prTargetOuter: number;
  let dropNextEvt = 0;

  const processPinch = (x1: number, y1: number, x2: number, y2: number) => {
    const distance = calcDistance(x1, y1, x2, y2);

    if (!state.isScaling) {
      setState({
        ...state,
        isScaling: true,
        initialDistance: distance,
        initialTransform: state.viewTransform,
      });
      return;
    }

    const center = calcCenter(x1, y1, x2, y2);

    const touchZoom = distance / state.initialDistance;
    const zoomScale =
      (touchZoom * state.initialTransform.scaleX) / state.viewTransform.scaleX;

    const panOffset: Point = {
      x: state.initialTransform.translateX + state.viewDimensions.pageX,
      y: state.initialTransform.translateY + state.viewDimensions.pageY,
    };

    const pinchCenterPoint: Point = {
      x: center.x - panOffset.x,
      y: center.y - panOffset.y,
    };

    const canvasCenter: Point = {
      x: width / 2,
      y: height / 2,
    };

    //When initial scale of canvas is different from 1, the pinch center point will be translated.
    //This is due to screen center and canvas center differs if the size of them arent equal
    const initialZoomDisplacement: Point = {
      x:
        pinchCenterPoint.x -
        canvasCenter.x -
        (pinchCenterPoint.x - canvasCenter.x) / state.initialTransform.scaleX,
      y:
        pinchCenterPoint.y -
        canvasCenter.y -
        (pinchCenterPoint.y - canvasCenter.y) / state.initialTransform.scaleY,
    };

    const zoomPoint: Point = {
      x: canvasCenter.x - pinchCenterPoint.x + initialZoomDisplacement.x,
      y: canvasCenter.y - pinchCenterPoint.y + initialZoomDisplacement.y,
    };

    const zoomDisplacement: Point = {
      x: -(zoomPoint.x - zoomPoint.x * zoomScale),
      y: -(zoomPoint.y - zoomPoint.y * zoomScale),
    };

    const scalingMatrix: ViewTransform = createScalingMatrix(zoomScale);
    const tranlationMatrix: ViewTransform = createTranslationMatrix(
      zoomDisplacement.x,
      zoomDisplacement.y
    );

    const transform: ViewTransform = viewTransformMult(
      tranlationMatrix,
      scalingMatrix
    );

    const newTransform: ViewTransform = getBoundedPinchTransform(
      state.viewTransform,
      viewTransformMult(state.viewTransform, transform),
      minScale,
      maxScale
    );

    Animated.parallel([
      Animated.timing(translationAnimation, {
        toValue: { x: newTransform.translateX, y: newTransform.translateY },
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: newTransform.scaleX,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
    setState({
      ...state,
      viewTransform: newTransform,
    });
  };

  const processTouch = ({ dx, dy }: PanResponderGestureState) => {
    if (!state.isMoving) {
      setState({
        ...state,
        isMoving: true,
        initialTransform: state.viewTransform,
        initialGestureState: { dx: 0, dy: 0 },
      });
      return;
    }

    // gestureState holds total displacement since pan started.
    // Here we calculate difference since last call of processTouch
    const displacement = {
      x: (dx - state.initialGestureState.dx) / state.viewTransform.scaleX,
      y: (dy - state.initialGestureState.dy) / state.viewTransform.scaleY,
    };

    const tranlationMatrix = createTranslationMatrix(
      displacement.x,
      displacement.y
    );

    const newTransform = getBoundedTouchTransform(
      state.initialTransform,
      state.viewTransform,
      viewTransformMult(state.viewTransform, tranlationMatrix),
      state.viewDimensions,
      width,
      height
    );

    Animated.timing(translationAnimation, {
      toValue: {
        x: newTransform.translateX,
        y: newTransform.translateY,
      },
      duration: 0,
      useNativeDriver: true,
    }).start();

    setState({
      ...state,
      viewTransform: newTransform,
      initialGestureState: { dx, dy },
    });
  };

  const panResponder = usePanResponder(
    {
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,

      onPanResponderGrant: (evt, gestureState) => {
        // Set self for filtering events from other PanResponderTargets
        if (prTargetSelf == null) {
          if (prTargetOuter == null) prTargetOuter = evt.currentTarget;
          if (evt.target !== evt.currentTarget) prTargetSelf = evt.target;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (dropNextEvt > 0) {
          dropNextEvt--;
          return;
        }

        // Child element events are bubbled up but are not valid in out context. Sort them out
        // if (evt.target !== prTargetSelf && evt.target !== prTargetOuter) {
        //   console.log("drop ch");
        //   dropNextEvt++;
        //   return;
        // }

        // HACK: the native event has some glitches with far-off coordinates.
        // Sort out the worst ones
        if (Math.abs(gestureState.vx + gestureState.vy) > 6) {
          dropNextEvt++;
          return;
        }

        if (touches.length === 2) {
          const [t0, t1] = touches;
          processPinch(t0.pageX, t0.pageY, t1.pageX, t1.pageY);
        } else if (touches.length === 1 && !state.isScaling) {
          processTouch(gestureState);
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
        setState({ ...state, isMoving: false, isScaling: false });
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
    },
    [state]
  );

  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { x, y, width, height },
      },
    }: LayoutChangeEvent) => {
      setState({
        ...state,
        viewDimensions: { pageX: x, pageY: y, width, height },
      });
    },
    [state, width, height]
  );

  //console.log(state);
  return (
    <Canvas
      ref={mainViewRef}
      onLayout={onLayout}
      transform={state.viewTransform}
      {...panResponder.panHandlers}
    />
  );
}
