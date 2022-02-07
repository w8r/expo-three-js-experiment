import * as React from "react";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Renderer, THREE } from "expo-three";

class Canvas {
  private gl: ExpoWebGLRenderingContext;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;

  constructor(gl: ExpoWebGLRenderingContext) {
    this.gl = gl;

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const sceneColor = 0x10505b;

    const renderer = (this.renderer = new Renderer({ gl }));
    const scene = (this.scene = new THREE.Scene());
    const camera = new THREE.PerspectiveCamera(80, width / height, 0.01, 1000);

    renderer.setSize(width, height);
    renderer.setClearColor(sceneColor);

    camera.position.set(2, 5, 5);

    renderer.render(scene, camera);

    gl.endFrameEXP();
  }
}

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
      <GLView
        style={styles.canvas}
        onContextCreate={(gl: ExpoWebGLRenderingContext) => {
          const canvas = new Canvas(gl);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  canvas: {
    flex: 1,
    width: "100%",
    borderColor: "red",
    borderWidth: 1,
  },
});
