import { doc, setDoc, SetOptions } from "firebase/firestore";
import { Firestore } from "firebase/firestore";
import { removeUndefined } from "./utils";

/**
 * Client-side helper to set a Firestore document with automatic undefined removal
 * This prevents Firestore errors when undefined values are present
 */
export const safeSetDoc = async (
  db: Firestore,
  collectionPath: string,
  documentId: string,
  data: Record<string, any>,
  options?: SetOptions
) => {
  const docRef = doc(db, collectionPath, documentId);
  const cleanedData = removeUndefined(data);
  return setDoc(docRef, cleanedData, options);
};

