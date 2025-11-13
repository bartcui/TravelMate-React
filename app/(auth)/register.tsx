// app/auth/register/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useColorScheme } from "react-native";
import { upsertUserProfile } from "@/utils/userUtils";

import { auth } from "@/firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

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
      <Text style={gs.title}>Let's get you started</Text>

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

      <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={gs.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}
