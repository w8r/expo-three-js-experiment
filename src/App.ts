import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer, THREE } from "expo-three";

export class App {
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

    const circle = new THREE.CircleGeometry(1, 132);
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
    return this;
  }

  stop() {
    cancelAnimationFrame(this.frameTimer);
  }

  update() {
    // this.frame();
    // move items here
  }

  setView(tx: number, ty: number, z: number) {
    console.log(tx);
    this.camera.position.x += tx;
    this.frame();
  }

  frame = () => {
    this.frameTimer = requestAnimationFrame(this._frame);
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
