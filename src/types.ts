export interface IGraphNode {
  id: number;
  attributes: IGraphNodeAttributes;
}
export interface IGraphNodeAttributes {
  x: number;
  y: number;
  r: number;
  color: string;
  selected: boolean;
}
export interface GraphEdge {
  id: number;
  source: number;
  target: number;
  attributes: { color: string; width: number };
}

export class GraphNode implements IGraphNode {
  private _id: number;
  private _attributes: IGraphNodeAttributes;

  constructor(id: number, attributes: IGraphNodeAttributes) {
    this._id = id;
    this._attributes = attributes;
  }

  get id() {
    return this._id;
  }

  set id(id: number) {
    this._id = id;
  }

  get attributes() {
    return this._attributes;
  }

  set attributes(attributes: IGraphNodeAttributes) {
    this._attributes = attributes;
  }

  public select(): void {
    this._attributes.selected = !this._attributes.selected;
  }
 }

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
