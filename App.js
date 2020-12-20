import React, { Component } from 'react';
import { Renderer } from 'expo-three';
import { GLView } from 'expo-gl';
import { GridHelper, PerspectiveCamera, Scene } from 'three';

class Canvas extends Component {
  animate = () => {
    this._grid.rotation.z += 0.01;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
    this._gl.endFrameEXP();
  }

  _onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const sceneColor = 0x10505b;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(sceneColor);

    const camera = new PerspectiveCamera(80, width / height, 0.01, 1000);
    camera.position.set(2, 5, 5);

    const scene = new Scene();
    this._grid = new GridHelper(10, 10);
    scene.add(this._grid);
    this._start = 0;

    renderer.render(scene, camera);

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this._gl = gl;

    this.animate();
    gl.endFrameEXP();
  }

  render() {
    return (
      <GLView
        style={{ flex: 1 }}
        onContextCreate={this._onContextCreate}
      />
    );
  }
}

export default function App () {
  return (
    <Canvas />
  );
}
