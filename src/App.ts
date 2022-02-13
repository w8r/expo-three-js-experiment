import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer } from "expo-three";
import {
  positionThreeCamera,
  pointOnLine,
  getBoundsTransform,
  bbox,
} from "./utils";
import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  CircleGeometry,
  BufferGeometry,
  Line,
  Vector3,
  Mesh,
  MeshBasicMaterial,
  Color,
  LineBasicMaterial,
} from "three";
import { quadtree } from "d3-quadtree";
import { Graph, GraphEdge, GraphNode } from "./types";

const FOV = 80;

export class App {
  private gl: ExpoWebGLRenderingContext;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private nodeMeshes: Mesh[] = [];
  private edgeMeshes: Line[] = [];
  private width: number = 0;
  private height: number = 0;
  private idToMesh = new Map<number, Mesh>();

  private frameTimer = 0;
  private dppx = 1;

  constructor(
    gl: ExpoWebGLRenderingContext,
    dppx: number,
    sceneColor = 0x10505b
  ) {
    this.gl = gl;
    this.dppx = dppx;

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    this.width = width;
    this.height = height;

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

    renderer.render(scene, camera);

    gl.endFrameEXP();
    this.start();
  }

  setGraph({ nodes, edges }: Graph) {
    const { scene, width, height } = this;
    scene.clear();

    const circle = new CircleGeometry(1, 32);

    const idToMesh = new Map<number, Mesh | Line>();
    const idToNode = new Map<number, GraphNode>();

    const quadtreeNodes = quadtree<GraphNode>();
    nodes.forEach((node, i) => {
      const {
        id,
        attributes: { x, y, r, color: rgbColor },
      } = node;
      const material = new MeshBasicMaterial({
        color: new Color(rgbColor),
      });
      const mesh = new Mesh(circle, material);
      mesh.renderOrder = 1;
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = 0;
      mesh.scale.x = mesh.scale.y = r;

      idToMesh.set(id, mesh);
      idToNode.set(id, node);

      this.nodeMeshes.push(mesh);
      scene.add(mesh);
    });

    const idToEdge = new Map<number, GraphEdge>();
    edges.forEach((edge, i) => {
      const {
        id,
        source,
        target,
        attributes: { color: rgbColor, width },
      } = edge;
      const sourceNode = idToNode.get(source) as GraphNode;
      const targetNode = idToNode.get(target) as GraphNode;

      const sx = sourceNode.attributes.x;
      const sy = sourceNode.attributes.y;
      const tx = targetNode.attributes.x;
      const ty = targetNode.attributes.y;
      const sr = sourceNode.attributes.r;
      const tr = targetNode.attributes.r;

      const d = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
      const arrowLength = d * 0.1;
      const t1 = sr / d;
      const t2 = 1 - tr / d;
      const t3 = 1 - (tr + arrowLength) / d;

      const p0 = pointOnLine(sx, sy, tx, ty, t1);
      const p1 = pointOnLine(sx, sy, tx, ty, t2);

      const geometry = new BufferGeometry().setFromPoints([
        // new Vector3(sourceNode.attributes.x, sourceNode.attributes.y, 0),
        // new Vector3(targetNode.attributes.x, targetNode.attributes.y, 0),
        new Vector3(p0.x, p0.y, 0),
        new Vector3(p1.x, p1.y, 0),
      ]);

      const material = new LineBasicMaterial({
        color: new Color(rgbColor),
        linewidth: 10,
      });

      const line = new Line(geometry, material);
      line.renderOrder = 0;
      idToMesh.set(id, line);
      idToEdge.set(id, edge);

      this.edgeMeshes.push(line);
      scene.add(line);

      // arrows
      //const dir = new Vector3(tx - sx, ty - sy, 0);
      //const p2 = pointOnLine(sx, sy, tx, ty, t3);
      //normalize the direction vector (convert to vector of length 1)
      //dir.normalize();
      // const origin = new Vector3(p2.x, p2.y, 0);
      // const hex = 0xffff00;
      // const arrowHelper = new ArrowHelper(dir, origin, arrowLength, hex);
      // arrowHelper.renderOrder = 3;
      // scene.add(arrowHelper);
    });
  }

  selectNode() {}

  getNodeAt(x: number, y: number) {}

  moveNode(node: Mesh, x: number, y: number) {
    node.position.x = x;
    node.position.y = y;
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
