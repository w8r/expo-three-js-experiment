import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer } from "expo-three";
import { positionThreeCamera, pointOnLine, mouseToThree } from "./utils";
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
// @ts-ignore
import { Text } from "troika-three-text";
import { Quadtree, quadtree } from "d3-quadtree";
import { Graph, GraphEdge, GraphNode } from "./types";

const FOV = 80;

function getEdgePoints(source: GraphNode, target: GraphNode) {
  const sx = source.attributes.x;
  const sy = source.attributes.y;
  const tx = target.attributes.x;
  const ty = target.attributes.y;
  const sr = source.attributes.r;
  const tr = target.attributes.r;

  const d = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
  //const arrowLength = d * 0.1;
  const t1 = sr / d;
  const t2 = 1 - tr / d;
  //const t3 = 1 - (tr + arrowLength) / d;

  const p0 = pointOnLine(sx, sy, tx, ty, t1);
  const p1 = pointOnLine(sx, sy, tx, ty, t2);

  return [new Vector3(p0.x, p0.y, 0), new Vector3(p1.x, p1.y, 0)];
}

export class App {
  // TODO: solve later
  // @ts-ignore
  private gl: ExpoWebGLRenderingContext;
  // @ts-ignore
  private renderer: WebGLRenderer;

  private scene: Scene = new Scene();
  private camera: PerspectiveCamera = new PerspectiveCamera();
  private nodeMeshes: Mesh[] = [];
  private edgeMeshes: Line[] = [];
  private width: number = 0;
  private height: number = 0;
  private idToMesh = new Map<number, Mesh | Line>();
  private idToText = new Map<number, Text>();
  private edgesBySource = new Map<number, GraphEdge[]>();
  private edgesByTarget = new Map<number, GraphEdge[]>();
  private idToNode = new Map<number, GraphNode>();
  private idToEdge = new Map<number, GraphEdge>();
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  // @ts-ignore;
  private nodeQ: Quadtree<GraphNode>;

  private frameTimer = 0;
  private dppx = 1;

  private x = 0;
  private y = 0;
  private k = 0;

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
    renderer.pixelRatio = dppx;
    renderer.setClearColor(sceneColor);

    camera.position.set(0, 0, 1);

    renderer.render(scene, camera);

    gl.endFrameEXP();
    this.start();
    return this;
  }

  setGraph({ nodes, edges }: Graph) {
    const { scene, width, height } = this;
    scene.clear();

    this.edgeMeshes = [];
    this.nodeMeshes = [];
    this.idToMesh.clear();
    this.idToText.clear();
    this.edgesBySource.clear();
    this.edgesByTarget.clear();
    this.idToNode.clear();
    this.idToEdge.clear();

    const circle = new CircleGeometry(1, 32);

    const idToMesh = this.idToMesh;
    const idToNode = this.idToNode;

    this.nodeQ = quadtree<GraphNode>()
      .x((d) => d.attributes.x)
      .y((d) => d.attributes.y);
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

      // const text = new Text();

      // text.renderOrder = 2;
      // // Set properties to configure:
      // text.text = "Hello world!";
      // text.fontSize = 2;
      // text.position.z = 0;
      // text.position.x = x;
      // text.position.y = y - r;
      // text.anchorX = "center";
      // text.anchorY = "top";
      // text.color = new Color(0xffffff);

      // Update the rendering:
      //text.sync();

      this.nodeMeshes.push(mesh);
      //this.idToText.set(id, text);
      //scene.add(text);
      scene.add(mesh);
      this.nodeQ.add(node);
    });

    const idToEdge = this.idToEdge;
    const edgesBySource = this.edgesBySource;
    const edgesByTarget = this.edgesByTarget;

    edges.forEach((edge) => {
      const {
        id,
        source,
        target,
        attributes: { color: rgbColor, width },
      } = edge;
      const sourceNode = idToNode.get(source) as GraphNode;
      const targetNode = idToNode.get(target) as GraphNode;

      // adjacent edges
      let edgeSet = edgesBySource.get(source) || [];
      edgesBySource.set(source, edgeSet);
      edgeSet.push(edge);
      edgeSet = edgesByTarget.get(target) || [];
      edgesByTarget.set(target, edgeSet);
      edgeSet.push(edge);

      const points = getEdgePoints(sourceNode, targetNode);
      const geometry = new BufferGeometry().setFromPoints(points);

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

    this.edgesBySource = edgesBySource;
    this.edgesByTarget = edgesByTarget;
    this.idToNode = idToNode;
    this.idToEdge = idToEdge;

    this.nodes = nodes;
    this.edges = edges;
  }

  selectNode() {}

  moveNode(node: GraphNode, x: number, y: number) {
    node.attributes.x = x;
    node.attributes.y = y;
    const nodeMesh = this.idToMesh.get(node.id) as Mesh;
    nodeMesh.position.x = x;
    nodeMesh.position.y = y;

    let edgeSet = [
      ...(this.edgesBySource.get(node.id) || []),
      ...(this.edgesByTarget.get(node.id) || []),
    ];
    edgeSet?.forEach((edge) => {
      const s = this.idToNode.get(edge.source) as GraphNode;
      const t = this.idToNode.get(edge.target) as GraphNode;
      const mesh = this.idToMesh.get(edge.id) as Line;
      const points = getEdgePoints(s, t);
      mesh.geometry.setFromPoints(points);
    });
    // const textMesh = this.idToText.get(node.id);
    // textMesh.position.x = x;
    // textMesh.position.y = y - node.attributes.r;
    // textMesh.sync();
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

  getElementAt(x: number, y: number) {
    const pos = this.screenToWorld(x, y);
    const node = this.nodeQ.find(pos.x, pos.y, 10);
    if (node) {
      const dx = node.attributes.x - pos.x;
      const dy = node.attributes.y - pos.y;
      const r = node.attributes.r;
      if (dx * dx + dy * dy > r * r) return null;
    }
    return node;
  }

  screenToWorld(sx: number, sy: number) {
    const x = (sx - this.width / (2 * this.dppx) - this.x) / this.k;
    const y = -(sy - this.height / (2 * this.dppx) - this.y) / this.k;
    return { x, y };
  }

  setView(x: number, y: number, k: number) {
    if (!this.gl) return;
    this.x = x;
    this.y = y;
    this.k = k;

    // rotation around Z can be added here
    positionThreeCamera(
      this.camera,
      { x, y, k },
      this.gl.drawingBufferWidth / this.dppx,
      this.gl.drawingBufferHeight / this.dppx,
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
