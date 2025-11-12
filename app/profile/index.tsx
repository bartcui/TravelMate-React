// app/settings/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "expo-router";
import { useUser, AVATARS } from "../../contexts/UserContext";
import { useColorScheme } from "react-native";
import { getTheme } from "../../styles/colors";
import { makeGlobalStyles } from "../../styles/globalStyles";
import { auth } from "@/firebaseConfig";
import {
  updateEmail,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {
    user,
    isLoaded,
    avatarId,
    setAvatarId,
    updateUserProfile,
    signOutUser,
  } = useUser();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.displayName ?? "");

  useEffect(() => {
    navigation.setOptions({ title: "Profile" });
  }, [navigation]);

  if (!isLoaded) {
    return (
      <View
        style={[gs.screen, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    // Gate will redirect to /(auth)/login; we just render a lightweight state
    return (
      <View style={gs.screen}>
        <Text style={gs.label}>Not signed in.</Text>
      </View>
    );
  }

  const onSave = async () => {
    try {
      const updates: { displayName?: string | null; photoURL?: string | null } =
        {};
      const chosenPhotoURL =
        avatarId == null ? user.photoURL : AVATARS[avatarId];

      if (name !== user.displayName) updates.displayName = name.trim() || null;
      if (chosenPhotoURL && chosenPhotoURL !== user.photoURL)
        updates.photoURL = chosenPhotoURL;

      if (updates.displayName !== undefined || updates.photoURL !== undefined) {
        await updateUserProfile({
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      if (email.trim() && email.trim() !== (user.email ?? "")) {
        try {
          await updateEmail(user, email.trim());
        } catch (e: any) {
          // Commonly requires recent login
          Alert.alert(
            "Email not updated",
            e?.message?.toString?.() ??
              "We couldn’t update your email. You may need to sign in again (re-authentication is required for sensitive changes)."
          );
        }
      }

      Alert.alert("Saved", "Profile updated.");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.message?.toString?.() ?? "Failed to update profile."
      );
    }
  };

  const onResetPassword = async () => {
    try {
      if (!user.email) {
        Alert.alert(
          "No email",
          "Your account doesn’t have an email address to send a reset link to."
        );
        return;
      }
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Check your inbox", "We’ve sent you a password reset email.");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.message?.toString?.() ?? "Failed to send password reset email."
      );
    }
  };

  return (
    <View style={gs.screen}>
      <Text style={gs.h1}>Your Profile</Text>

      <Text style={gs.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={gs.input}
        placeholderTextColor={t.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={gs.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      <Pressable
        style={[gs.primaryButton, { marginTop: 8 }]}
        onPress={onResetPassword}
      >
        <Text style={gs.primaryButtonText}>Send Password Reset Email</Text>
      </Pressable>

      <Text style={[gs.label, { marginTop: 12 }]}>Avatar</Text>
      <View style={styles.grid}>
        {Object.entries(AVATARS).map(([id, url]) => (
          <Pressable
            key={id}
            style={[
              styles.cell,
              avatarId === id && { borderColor: t.primary, borderWidth: 2 },
            ]}
            onPress={() => setAvatarId(id as any)}
          >
            <Image source={{ uri: url }} style={styles.img} />
          </Pressable>
        ))}
      </View>

      <Pressable style={[gs.primaryButton, { marginTop: 16 }]} onPress={onSave}>
        <Text style={gs.primaryButtonText}>Save Changes</Text>
      </Pressable>

      <Pressable
        style={[gs.primaryButton, { backgroundColor: "#eb5757", marginTop: 8 }]}
        onPress={() => {
          Alert.alert(
            "Sign out?",
            "You will need to sign in again to continue.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => signOutUser(),
              },
            ]
          );
        }}
      >
        <Text style={gs.primaryButtonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  cell: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  img: { width: "100%", height: "100%" },
});
