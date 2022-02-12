import * as React from "react";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Renderer, THREE } from "expo-three";

class Canvas {
  private gl: ExpoWebGLRenderingContext;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private c: THREE.Mesh;

  private frameTimer = 0;

  constructor(gl: ExpoWebGLRenderingContext) {
    this.gl = gl;

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const sceneColor = 0x10505b;

    const renderer = (this.renderer = new Renderer({ gl }));
    const scene = (this.scene = new THREE.Scene());
    const camera = (this.camera = new THREE.PerspectiveCamera(
      80,
      width / height,
      0.01,
      1000
    ));

    renderer.setSize(width, height);
    renderer.setClearColor(sceneColor);
    camera.position.set(0, 0, 5);

    const circle = new THREE.CircleGeometry(1, 32);
    const c = new THREE.Mesh(
      circle,
      new THREE.MeshBasicMaterial({
        color: 0xe0e0e0,
        opacity: 0.8,
      })
    );

    c.position.x = 0;
    c.position.y = 0;
    c.position.z = 0;

    this.c = c;

    scene.add(c);

    renderer.render(scene, camera);

    gl.endFrameEXP();
    this.start();
  }

  start() {
    this.frame();
  }

  stop() {
    cancelAnimationFrame(this.frameTimer);
  }

  update() {}

  private frame = () => {
    this.frameTimer = requestAnimationFrame(this.frame);
    // this.c.position.x += 0.01;
    // this.c.position.y += 0.01;
    this.update();
    this.renderer.render(this.scene, this.camera);
    this.gl.endFrameEXP();
  };
}

export default function App() {
  return (
    <View style={styles.container}>
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
  },
});
