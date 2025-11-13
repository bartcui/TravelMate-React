import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

// Preset avatars you can extend
export const AVATARS: Record<string, string> = {
  c0: "https://i.pravatar.cc/100?img=12",
  c5: "https://api.dicebear.com/7.x/bottts/png?seed=Rover&size=128&background=%23E3F2FD",
  c8: "https://api.dicebear.com/7.x/big-smile/png?seed=Sunny&size=128&background=%23F3E5F5",
  c3: "https://api.dicebear.com/7.x/micah/png?seed=Trailblazer&size=128&background=%23EDE7F6",
  c4: "https://api.dicebear.com/7.x/micah/png?seed=Voyager&size=128&background=%23FDE7E9",
};

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

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
export const cleanStr = (v: unknown, max = 120): string | null => {
  if (typeof v !== "string" || v=="") return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
};

export const cleanEmail = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  // super-light validation; rely on server rules for stricter checks
  return s.includes("@") ? s.slice(0, 254) : null;
};

export const cleanAge = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  return v;
};
