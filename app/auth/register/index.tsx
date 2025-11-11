// app/auth/register/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useColorScheme } from "react-native";

import { auth, db } from "@/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
  isErrorWithCode,
} from "@react-native-google-signin/google-signin";

import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";

// ---- IDs ----
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  // Configure Google Signin once
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: false, // set true only if you need server auth code
      forceCodeForRefreshToken: false,
    });
  }, []);

  // ---------- Google Native Sign-In ----------
  const signInWithGoogleNative = async () => {
    try {
      setBusy(true);

      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      const response = await GoogleSignin.signIn();
      if (!response.data?.idToken) {
        throw new Error("Google Sign-In did not return an ID token.");
      }

      const credential = GoogleAuthProvider.credential(response.data?.idToken);
      const cred = await signInWithCredential(auth, credential);

      await upsertUserProfile(cred.user.uid, {
        displayName: cred.user.displayName || "",
        email: cred.user.email || "",
        photoURL: cred.user.photoURL || "",
        provider: "google",
      });

      router.replace("/");
      return cred;
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // user cancelled; no need to alert
            break;
          case statusCodes.IN_PROGRESS:
            Alert.alert(
              "Google Sign-In",
              "A sign-in operation is already in progress."
            );
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              "Google Play Services",
              "Not available or out of date."
            );
            break;
          default:
            Alert.alert(
              "Google Sign-In failed",
              error.message ?? String(error)
            );
        }
      } else {
        Alert.alert("Google Sign-In failed", error?.message ?? String(error));
      }
    } finally {
      setBusy(false);
    }
  };

  // ---------- Email/Password Sign Up ----------
  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Email and password are required.");
      return;
    }
    try {
      setBusy(true);
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      await upsertUserProfile(cred.user.uid, {
        displayName: displayName || cred.user.displayName || "",
        email: cred.user.email ?? "",
        photoURL: cred.user.photoURL ?? "",
        provider: "password",
      });
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Registration failed", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={gs.container}>
      <Text style={gs.title}>Create your TravelMate account</Text>

      <TextInput
        placeholder="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        style={gs.input}
      />
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={gs.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={gs.input}
      />

      <Button
        title={busy ? "Creating..." : "Create account"}
        onPress={handleRegister}
        disabled={busy}
      />

      <View style={styles.sepRow}>
        <View style={styles.sep} />
        <Text style={styles.sepText}>or</Text>
        <View style={styles.sep} />
      </View>

      <GoogleSigninButton
        style={styles.googleBtn}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Light}
        onPress={signInWithGoogleNative}
      />

      <TouchableOpacity onPress={() => router.replace("/auth/login")}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- Helpers ----------
async function upsertUserProfile(
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

// ---------- Styles ----------
const styles = StyleSheet.create({
  sepRow: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  googleBtn: { width: "100%", height: 48 },
  sep: { flex: 1, height: 1, backgroundColor: "#eee" },
  sepText: { marginHorizontal: 8, color: "#888" },
  link: { textAlign: "center", color: "#007bff" },
});
