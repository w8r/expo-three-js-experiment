import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer, THREE } from "expo-three";
import { positionThreeCamera } from "./utils";

export class App {
  private gl: ExpoWebGLRenderingContext;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  //private camera: THREE.OrthographicCamera;
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
      10000
    ));

    // const camera = (this.camera = new THREE.OrthographicCamera(
    //   -width / 2,
    //   width / 2,
    //   height / 2,
    //   -height / 2,
    //   0.01,
    //   1000
    // ));

    renderer.setSize(width, height);
    renderer.setClearColor(sceneColor);
    camera.position.set(0, 0, 1);

    const circle = new THREE.CircleGeometry(100, 32);
    const c = new THREE.Mesh(
      circle,
      new THREE.MeshBasicMaterial({
        color: 0xe0e0e0,
        opacity: 0.8,
      })
    );

    c.position.x = width / 4;
    c.position.y = -height / 4;
    c.position.z = 0;

    this.c = c;

    scene.add(c);

    const d = new THREE.Mesh(
      circle,
      new THREE.MeshBasicMaterial({
        color: 0xe0e0e0,
        opacity: 0.8,
      })
    );
    d.position.x = -width / 4;
    d.position.y = -height / 4;
    d.position.z = 0;

    scene.add(d);

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
    positionThreeCamera(
      this.camera,
      { x, y, k },
      this.gl.drawingBufferWidth / 2,
      this.gl.drawingBufferHeight / 2,
      80
    );
    //console.log(this.camera.position);
    // this.camera.position.x = -tx;
    // this.camera.position.y = ty;
    // this.camera.position.z = z;
  }

  frame = () => {
    if (!this.gl) return;

    //this.camera.position.x -= 0.5;

    this.renderer.render(this.scene, this.camera);
    this.gl.endFrameEXP();
    this.frameTimer = requestAnimationFrame(this.frame);
  };

  _frame = () => {
    if (!this.gl) return;
    console.log("frame");
    // this.c.position.x += 0.1;
    // this.c.position.y += 0.1;
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
