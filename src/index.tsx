import React, { FC } from "react";
import { VisProvider } from "./context";
import { Viewer } from "./Viewer";

type VisProps = { width: number; height: number };

export const Vis: FC<VisProps> = ({ width, height }) => {
  return (
    <VisProvider>
      <Viewer width={width} height={height} />
    </VisProvider>
  );
};
