import * as React from "react";
import { useState, FC, forwardRef } from "react";
import { GLView } from "expo-gl";
import { Dimensions, StyleSheet, ViewProps } from "react-native";
import { App } from "./App";
import { Transform } from "./utils";

type CanvasProps = ViewProps & {
  transform?: Transform;
};

export const Canvas = forwardRef(
  (
    {
      transform = { translateX: 0, translateY: 0, scaleX: 0, scaleY: 0 },
    }: CanvasProps,
    ref
  ) => {
    const [app, setApp] = useState<App | null>(null);
    const [viewport, setViewport] = useState(null);
    const [gl, setGl] = useState(null);

    if (viewport) {
      requestAnimationFrame(() => {
        const { translateX, translateY, scaleX } = transform;
        console.log({ x: translateX, y: translateY, z: scaleX });
        //viewport.setTransform(translateX, translateY, scaleX, scaleX);

        // call app frame
      });
    }

    return (
      <GLView
        style={styles.container}
        onContextCreate={async (context) => {
          const app = new App(context);
          // setGl(gl);
          // setApp(app);
          app.start();
        }}
      />
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: "red",
    width: "100%",
    height: "100%",
  },
  canvas: {
    flex: 1,
    width: "100%",
  },
});
