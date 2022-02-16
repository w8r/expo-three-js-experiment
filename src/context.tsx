import * as React from "react";
import { createContext, FC, useContext, useState } from "react";
import { App } from "./App";

export type VisState = {
  app: App;
  setApp: (app: App) => void;
};

export const VisContext = createContext<VisState>({} as VisState);

export const VisProvider: FC<{ value?: VisState }> = ({ children }) => {
  const [app, setApp] = useState<App | null>(null);
  return (
    <VisContext.Provider value={{ app, setApp } as VisState}>
      {children}
    </VisContext.Provider>
  );
};

export const useVis = () => useContext<VisState>(VisContext);
