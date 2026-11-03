import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase.js";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [salesRecords, setSalesRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูล Realtime จาก Firebase Firestore
  useEffect(() => {
    const q = query(
      collection(db, "sales_records"),
      orderBy("date", "desc"),
      limit(1000)
    );

    // ใช้ onSnapshot เพื่อให้ข้อมูลอัปเดตซิงก์กันทุกหน้าโดยอัตโนมัติ
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSalesRecords(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to Firestore:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysisData: { sales_records: salesRecords },
        salesRecords,
        isLoading,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export const useAnalysis = () => useContext(AnalysisContext);