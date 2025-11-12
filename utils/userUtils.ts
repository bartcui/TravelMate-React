import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export async function upsertUserProfile(
  uid: string,
  data: {
    displayName: string;
    email: string;
    photoURL: string;
    provider: string;
  }
) {
  await setDoc(
    doc(db, "users", uid),
    { ...data, updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
    { merge: true }
  );
}
