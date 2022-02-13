import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer } from "expo-three";
import { positionThreeCamera } from "./utils";
import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  CircleGeometry,
  Mesh,
  MeshBasicMaterial,
} from "three";

const FOV = 80;

export class App {
  private gl: ExpoWebGLRenderingContext;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private c: Mesh;

  private frameTimer = 0;

  constructor(gl: ExpoWebGLRenderingContext) {
    this.gl = gl;

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const sceneColor = 0x10505b;

    const renderer = (this.renderer = new Renderer({ gl }));
    const scene = (this.scene = new Scene());
    const aspect = width / height;
    const camera = (this.camera = new PerspectiveCamera(
      FOV,
      aspect,
      1e-5,
      1e6
    ));

    renderer.setSize(width, height);
    renderer.setClearColor(sceneColor);
    camera.position.set(0, 0, 1);

    const circle = new CircleGeometry(10, 32);
    const mat = new MeshBasicMaterial({
      color: 0xe0e0e0,
      opacity: 0.8,
    });
    const c = new Mesh(circle, mat);

    c.position.x = 0;
    c.position.y = 0;
    c.position.z = 0;

    this.c = c;

    scene.add(c);

    const d = new Mesh(circle, mat);
    d.position.x = -width / 4;
    d.position.y = -height / 4;
    d.position.z = 0;

    scene.add(d);

    Array(100)
      .fill(0)
      .forEach((_, i) => {
        const m = new Mesh(circle, mat);
        m.position.x = (Math.random() - 0.5) * (width / 2);
        m.position.y = (Math.random() - 0.5) * (height / 2);
        //m.position.z = Math.random() * 1000;
        scene.add(m);
      });

    renderer.render(scene, camera);

    gl.endFrameEXP();
    this.start();
  }

  start() {
    this.frame();
    return this;
  }

  stop() {
    cancelAnimationFrame(this.frameTimer);
  }

  update() {
    // this.frame();
    // move items here
  }

  setView(x: number, y: number, k: number) {
    if (!this.gl) return;
    // rotation around Z can be added here
    positionThreeCamera(
      this.camera,
      { x, y, k },
      this.gl.drawingBufferWidth / 2,
      this.gl.drawingBufferHeight / 2,
      FOV
    );
  }

  frame = () => {
    if (!this.gl) return;
    this.renderer.render(this.scene, this.camera);
    this.gl.endFrameEXP();
    this.frameTimer = requestAnimationFrame(this.frame);
  };

  _frame = () => {
    if (!this.gl) return;
    this.update();
    this.renderer.render(this.scene, this.camera);
    this.gl.endFrameEXP();
  };

  async destroy() {
    this.renderer.dispose();
    // @ts-ignore
    delete this.gl;
  }
}
