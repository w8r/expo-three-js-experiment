import * as React from "react";
import { useState, forwardRef } from "react";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { StyleSheet, ViewProps } from "react-native";
import { App } from "./App";
import { Transform } from "./utils";
import { useEffect } from "react";

type CanvasProps = ViewProps & {
  onWheel?: (e: WheelEvent) => void;
  transform?: Transform;
};

export const Canvas = forwardRef(
  ({ transform = { x: 0, y: 0, k: 1 }, ...rest }: CanvasProps, ref) => {
    const [app, setApp] = useState<App | null>(null);
    const [gl, setGl] = useState<ExpoWebGLRenderingContext | null>(null);

    app?.setView(transform.x, transform.y, transform.k);

    useEffect(() => {
      return () => {
        app?.destroy();
        if (gl) GLView.destroyContextAsync(gl);
      };
    }, [gl]);

    const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
      //setGl(gl);
      setApp(new App(gl));
    };

    return (
      <GLView
        style={styles.container}
        onContextCreate={onContextCreate}
        {...rest}
      />
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
