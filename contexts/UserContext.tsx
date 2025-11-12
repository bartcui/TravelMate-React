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
import { auth } from "@/firebaseConfig";

// Preset avatars you can extend
export const AVATARS: Record<string, string> = {
  c5: "https://api.dicebear.com/7.x/bottts/png?seed=Rover&size=128&background=%23E3F2FD",
  c8: "https://api.dicebear.com/7.x/big-smile/png?seed=Sunny&size=128&background=%23F3E5F5",
  c3: "https://api.dicebear.com/7.x/micah/png?seed=Trailblazer&size=128&background=%23EDE7F6",
  c4: "https://api.dicebear.com/7.x/micah/png?seed=Voyager&size=128&background=%23FDE7E9",
};
const STORAGE_KEY = "tm_profile_v1";

type UpdateProfileInput = {
  displayName?: string | null;
  photoURL?: string | null;
};
type UserContextValue = {
  user: User | null;
  avatarId: string | null;
  setAvatarId: (id: string) => void;
  updateUserProfile: (updates: UpdateProfileInput) => Promise<void>;
  isLoaded: boolean;
  signOutUser: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
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
      setIsLoaded(true);
    });

    return unsubscribe;
  }, []);

  //Map current photoURl back to avatarId if it matches
  const avatarId = useMemo(() => {
    if (!user?.photoURL) return null;
    const match = Object.entries(AVATARS).find(
      ([_, url]) => url === user.photoURL
    );
    return match?.[0] ?? null;
  }, [user?.photoURL]);

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
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const updateUserProfile = async (updates: UpdateProfileInput) => {
    if (!auth.currentUser) return;
    await fbUpdateProfile(auth.currentUser, updates);
    await reloadAndSet(); // ensures user.photoURL/displayName refresh -> avatarId recalculates
  };

  const setAvatarId = async (id: string) => {
    const url = AVATARS[id];
    if (!url) throw new Error(`Unknown avatar id: ${id}`);
    await updateUserProfile({ photoURL: url });
  };

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      isLoaded,
      avatarId,
      setAvatarId,
      updateUserProfile,
      signOutUser,
    }),
    [user, isLoaded, avatarId]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
