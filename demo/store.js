// In-memory stand-in for the "sales_records" collection: starts with the repo's sample data,
// and anything imported or entered in the demo is added here (it lives only in this browser tab).
import seed from "./sample-records.json";

let records = seed.slice();
const listeners = new Set();

export const store = {
  get: () => records,
  add(items) {
    const stamped = items.map((r, i) => ({ id: "demo-" + Date.now() + "-" + i, ...r }));
    records = [...stamped, ...records];
    listeners.forEach((l) => l());
  },
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
};
