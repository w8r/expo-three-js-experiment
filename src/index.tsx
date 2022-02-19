import React, { FC } from "react";
import { useEffect } from "react";
import {Graph, GraphNode} from './types';
import { useVis, VisProvider } from "./context";
import { Viewer } from "./Viewer";

const graph1: Graph = {
  nodes: [
    new GraphNode(0, {x: 0, y: 0, r: 2, color: "red", selected: false}),
    new GraphNode(1, {x: 10, y: 10, r: 5, color: "blue", selected: false }),
    new GraphNode(2, {x: -10, y: 10, r: 3, color: "green", selected: false }),
  ],
  edges: [
    {
      id: 3,
      source: 0,
      target: 1,
      attributes: { color: "black", width: 3 },
    },
    {
      id: 4,
      source: 1,
      target: 2,
      attributes: { color: "black", width: 2 },
    },
    {
      id: 5,
      source: 2,
      target: 0,
      attributes: { color: "black", width: 1 },
    },
  ],
};

type VisProps = { width: number; height: number };

const Wrapper = ({ width, height }: VisProps) => {
  const { graph, setGraph } = useVis();
  useEffect(() => {
    setGraph(graph1);
  });
  if (graph.nodes.length === 0) return null;
  return <Viewer width={width} height={height} graph={graph} />;
};

export const Vis: FC<VisProps> = ({ width, height }) => {
  return (
    <VisProvider>
      <Wrapper width={width} height={height} />
    </VisProvider>
  );
};
