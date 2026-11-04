// Demo stand-in for src/context/AnalysisContext.jsx: same API, reads the in-memory sample store.
import { createContext, useContext, useSyncExternalStore } from "react";
import { store } from "./store.js";

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const records = useSyncExternalStore(store.subscribe, store.get);
  return (
    <AnalysisContext.Provider value={{ analysisData: { sales_records: records }, salesRecords: records, isLoading: false }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export const useAnalysis = () => useContext(AnalysisContext);
