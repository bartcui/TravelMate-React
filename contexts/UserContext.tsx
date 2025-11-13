import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  onAuthStateChanged,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
} from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
} from "firebase/firestore";
import { AVATARS } from "@/utils/userUtils";

const STORAGE_KEY = "tm_profile_v1";

type UpdateProfileInput = {
  displayName?: string | null;
  photoURL?: string | null;
};

// firestore user document
export type UserDoc = {
  id: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: any;
  updatedAt?: any;

  country?: string | null;
  province?: string | null;
  city?: string | null;
  age?: number | null;
  photoOriginalURL: string | null;
  hasCompletedOnboarding: boolean;
};

type UserContextValue = {
  user: User | null;
  /* firestore user document */
  userDoc: UserDoc | null;
  avatarId: string | null;
  setAvatarId: (id: string) => Promise<void>;
  baseAvatarUri: string;
  updateUserProfile: (updates: UpdateProfileInput) => Promise<void>;
  updateUserDoc: (updates: Partial<UserDoc>) => Promise<void>;
  isLoaded: boolean; //becomes true after initial load
  signOutUser: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [docLoaded, setDocLoaded] = useState(false);

  // Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoaded(true);

      //light weight cache for quick UI boot
      if (u) {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          })
        );
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    });
    return unsubscribe;
  }, []);

  //fire store user doc subscription
  useEffect(() => {
    let unsub: Unsubscribe | undefined;
    setUserDoc(null);
    setDocLoaded(false);

    const attach = async () => {
      if (!user) {
        setDocLoaded(false);
        return;
      }
      const ref = doc(db, "users", user.uid);

      //Exsure it exists at least once
      const snap = await getDoc(ref);

      //Check whether to add missing fields
      const exists = snap.exists;
      const data = snap.data() as UserDoc | undefined;

      const needsOnboarding = !exists || data?.id == null || data.id === "";
      // console.log("photoOriginalURL", !user.photoURL );
      // console.log("NeedsOnboarding", needsOnboarding);
      if (needsOnboarding) {
        await setDoc(
          ref,
          {
            id: user.uid,
            email: user.email ?? null,
            displayName: user.displayName ?? null,
            photoURL: !user.photoURL ? AVATARS["c0"] : user.photoURL,
            photoOriginalURL: user.photoURL,
            country: null,
            province: null,
            city: null,
            age: null,
            hasCompletedOnboarding: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      unsub = onSnapshot(
        ref,
        (snapshot) => {
          setUserDoc((snapshot.data() as UserDoc) ?? null);
          setDocLoaded(true);
        },
        (err) => {
          if (err.code === "permission-denied" && !auth.currentUser) {
            setUserDoc(null);
            setDocLoaded(false);
            return;
          }
          console.error("[UserContext] onSnapshot error:", err);
          setDocLoaded(false);
        }
      );
    };

    attach();

    return () => {
      if (unsub) unsub();
    };
  }, [user?.uid]);

  // Map current photoURL back to avatarId if it matches a preset
  const avatarId = useMemo(() => {
    const photoURL = user?.photoURL ?? userDoc?.photoURL ?? null;
    if (!photoURL) return null;
    const match = Object.entries(AVATARS).find(([, url]) => url === photoURL);
    return match?.[0] ?? null;
  }, [user?.photoURL, userDoc?.photoURL]);

  // Helper: force-refresh the user from Firebase after profile updates
  const reloadAndSet = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
    }
  };

  const signOutUser = async () => {
    await fbSignOut(auth);
    setUser(null);
    setUserDoc(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  //update both auth profile and user doc
  const updateUserProfile = async (updates: UpdateProfileInput) => {
    if (!auth.currentUser) return;

    await fbUpdateProfile(auth.currentUser, {
      displayName: updates.displayName ?? null,
      photoURL: updates.photoURL ?? null,
    });

    // sync Firestore with Auth changes
    await updateUserDoc({
      displayName: updates.displayName ?? null,
      photoURL: updates.photoURL ?? null,
      email: auth.currentUser.email ?? null,
    });

    await reloadAndSet();
  };

  //Update fireStore User Doc
  const updateUserDoc = async (patch: Partial<UserDoc>) => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    await setDoc(
      ref,
      {
        ...patch,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // Always a string, thanks to final fallback
  const baseAvatarUri: string = useMemo(() => {
    const src =
      (avatarId && AVATARS[avatarId]) ??
      user?.photoURL ??
      userDoc?.photoURL ??
      AVATARS["c0"];
    return src;
  }, [avatarId, user?.photoURL, userDoc?.photoURL]);

  const setAvatarId = async (id: string) => {
    let url: string | null = null;
    if (id == "_original_") {
      url = userDoc?.photoOriginalURL ?? null;
    } else {
      url = AVATARS[id];
    }
    if (!url) throw new Error(`Unknown avatar id: ${id}`);
    await updateUserProfile({ photoURL: url });
  };

  // isLoaded means: auth loaded AND (if signed in) the user doc has loaded at least once
  const isLoaded = authLoaded && (!!user ? docLoaded : true);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      userDoc,
      avatarId,
      setAvatarId,
      baseAvatarUri,
      updateUserProfile,
      updateUserDoc,
      isLoaded,
      signOutUser,
    }),
    [user, userDoc, avatarId, baseAvatarUri, isLoaded]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
