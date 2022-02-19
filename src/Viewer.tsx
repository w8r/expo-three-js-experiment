import * as React from "react";
import { useState, useRef } from "react";
import {
  ViewProps,
  PanResponderGestureState,
  PixelRatio,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { Canvas } from "./Canvas";
import {
  distance as calcDistance,
  center as calcCenter,
  clamp,
  bbox as graphBbox,
  getBoundsTransform,
} from "./utils";
import { usePanResponder } from "./usePanResponder";
import { Graph, GraphNode } from "./types";
import { useVis } from "./context";
import {} from "d3-zoom";

export interface ViewerProps extends ViewProps {
  width?: number;
  height?: number;
  minScale?: number;
  maxScale?: number;
  initialZoom?: number;
  canvasHeight?: number;
  canvasWidth?: number;
  onZoom?: (zoom: number) => void;
  graph: Graph;
}

interface ViewerState {
  isMoving: boolean;
  isScaling: boolean;
  isDragging: null | GraphNode;
  initialDistance: number;

  top: number;
  left: number;
  zoom: number;

  initialZoom: number;
  initialLeft: number;
  initialTop: number;
  initialX: number;
  initialY: number;
  dragOffsetX: number;
  dragOffsetY: number;
}

export function Viewer({
  width = 1080,
  height = 720,
  minScale = 0.0001,
  maxScale = 1000.0,
  initialZoom = 1.0,
  graph,
}: ViewerProps) {
  const containerRef = useRef<typeof Canvas>();
  const { app } = useVis();

  const dppx = PixelRatio.get();

  const { minX, minY, maxX, maxY } = graphBbox(graph);
  const transform = graph.nodes.length
    ? getBoundsTransform(
        minX,
        minY,
        maxX,
        maxY,
        width * dppx,
        height * dppx,
        20
      )
    : { x: 0, y: 0, k: 1 };

  initialZoom = transform.k;
  const top = transform.y;
  const left = transform.x;
  //this.setView(transform.x, transform.y, transform.k);

  const [state, setState] = useState<ViewerState>({
    isMoving: false,
    isScaling: false,
    isDragging: null,
    initialDistance: 1,

    top,
    left,
    zoom: initialZoom,

    initialZoom: 0,
    initialLeft: 0,
    initialTop: 0,
    initialX: 0,
    initialY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
  });

  let prTargetSelf: number, prTargetOuter: number;
  let dropNextEvt = 0;

  const processPinch = (x1: number, y1: number, x2: number, y2: number) => {
    const distance = calcDistance(x1, y1, x2, y2);
    const { x, y } = calcCenter(x1, y1, x2, y2);
    const { isScaling } = state;

    if (!isScaling) {
      setState({
        ...state,
        isScaling: true,
        initialX: x - width / 2,
        initialY: y - height / 2,
        initialTop: state.top,
        initialLeft: state.left,
        initialZoom: state.zoom,
        initialDistance: distance,
      });
    } else {
      const delta = distance / state.initialDistance;
      const dx = x - state.initialX;
      const dy = y - state.initialY;

      const left = (state.initialLeft + dx - x) * delta + x - width / 2;
      const top = (state.initialTop + dy - y) * delta + y - height / 2;
      const zoom = clamp(state.initialZoom * delta, minScale, maxScale);

      setState({ ...state, zoom, left, top });
    }
  };

  const processTouch = ({
    dx,
    dy,
    x0,
    y0,
    moveX,
    moveY,
  }: PanResponderGestureState) => {
    if (!app) return;
    if (state.isDragging) {
      const { isDragging, dragOffsetX, dragOffsetY } = state;
      const { x, y } = app.screenToWorld(moveX, moveY);
      app.moveNode(isDragging, x - dragOffsetX, y - dragOffsetY);
    } else if (!state.isMoving) {
      // figure out if we are on the node or not
      const el = app.getElementAt(moveX, moveY);
      if (el) {
        const pos = app.screenToWorld(moveX, moveY);
        const dragOffsetX = pos.x - el.attributes.x;
        const dragOffsetY = pos.y - el.attributes.y;

        return setState({ ...state, isDragging: el, dragOffsetX, dragOffsetY });
      }

      setState({
        ...state,
        isMoving: true,
        initialLeft: state.left,
        initialTop: state.top,
        initialX: x0,
        initialY: y0,
      });
    } else if (state.isMoving) {
      setState({
        ...state,

        left: state.left + dx,
        top: state.top + dy,
      });
    }
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
        setState({
          ...state,
          isMoving: false,
          isScaling: false,
          isDragging: null,
        });
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    },
    [state]
  );

  const onWheel = (evt: WheelEvent) => {};

  const onTap = ({ nativeEvent }: GestureResponderEvent) => {
    const el = app.getElementAt(nativeEvent.locationX, nativeEvent.locationY);
    if (el) {
      graph.nodes.forEach((n) => {
        if (n.id === el.id) {
          n.attributes.color = "cyan";
        }
      });
      app.setGraph(graph);
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <TouchableWithoutFeedback onPress={onTap}>
        <Canvas
          ref={containerRef}
          style={styles.canvas}
          onWheel={onWheel}
          graph={graph}
          dppx={dppx}
          transform={{ x: state.left, y: state.top, k: state.zoom }}
        />
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});
