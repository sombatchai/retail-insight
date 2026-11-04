// Demo stand-in for "firebase/firestore": the calls the app makes, writing to the in-memory store.
import { store } from "./store.js";

export const collection = (db, name) => ({ name });
export const doc = (col) => ({ col });
export const query = (col) => col;
export const orderBy = () => null;
export const limit = () => null;

export async function addDoc(col, data) {
  store.add([data]);
  return { id: "demo" };
}

export function writeBatch() {
  const pending = [];
  return {
    set: (ref, data) => { pending.push(data); },
    commit: async () => { store.add(pending); },
  };
}

export function onSnapshot(q, next) {
  const emit = () => next({ docs: store.get().map((r) => ({ id: r.id, data: () => r })) });
  emit();
  return store.subscribe(emit);
}
