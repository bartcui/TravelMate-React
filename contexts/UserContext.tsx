import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "tm_profile_v1";

export type UserProfile = {
  email: string;
  name: string;
  password: string;      
  avatarId: string;     
};

type UserContextValue = {
  profile: UserProfile | null;
  isLoaded: boolean;
  setProfile: (p: UserProfile) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProfileState(JSON.parse(raw));
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persist = async (p: UserProfile | null) => {
    if (!p) await AsyncStorage.removeItem(STORAGE_KEY);
    else await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  };

  const setProfile = async (p: UserProfile) => {
    setProfileState(p);
    await persist(p);
  };

  const updateProfile = async (patch: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const next = { ...(prev ?? { email: "", name: "", password: "", avatarId: "a1" }), ...patch };
      persist(next);
      return next;
    });
  };

  const signOut = async () => {
    setProfileState(null);
    await persist(null);
  };

  const value = useMemo(() => ({ profile, isLoaded, setProfile, updateProfile, signOut }), [profile, isLoaded]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

// Preset avatars you can extend
export const AVATARS: Record<string, string> = {
  c5: "https://api.dicebear.com/7.x/bottts/png?seed=Rover&size=128&background=%23E3F2FD",
  c8: "https://api.dicebear.com/7.x/big-smile/png?seed=Sunny&size=128&background=%23F3E5F5",
  c3: "https://api.dicebear.com/7.x/micah/png?seed=Trailblazer&size=128&background=%23EDE7F6",
  c4: "https://api.dicebear.com/7.x/micah/png?seed=Voyager&size=128&background=%23FDE7E9",
};
