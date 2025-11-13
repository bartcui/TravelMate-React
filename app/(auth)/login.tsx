// app/auth/login.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { useColorScheme, Platform } from "react-native";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
  isErrorWithCode,
} from "@react-native-google-signin/google-signin";
import { upsertUserProfile } from "@/utils/userUtils";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={gs.container}>
      <Text style={gs.title}>Welcome back!</Text>

      <TextInput
        style={gs.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={gs.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={loading ? "Logging in..." : "Login"}
        onPress={handleLogin}
      />

      <Text style={styles.register} onPress={() => router.push("/register")}>
        Don’t have an account? Register
      </Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  register: {
    textAlign: "center",
    color: "#007bff",
    marginTop: 16,
  },
  sepRow: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  googleBtn: { width: "100%", height: 48 },
  sep: { flex: 1, height: 1, backgroundColor: "#eee" },
  sepText: { marginHorizontal: 8, color: "#888" },
});
