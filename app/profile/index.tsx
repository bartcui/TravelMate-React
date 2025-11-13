// app/settings/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { AVATARS } from "@/utils/userUtils";
import { useNavigation } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useColorScheme } from "react-native";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { auth } from "@/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import { cleanStr, cleanEmail, cleanAge } from "@/utils/userUtils";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {
    user,
    userDoc,
    isLoaded,
    avatarId,
    setAvatarId,
    updateUserProfile,
    updateUserDoc,
    signOutUser,
    baseAvatarUri,
  } = useUser();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.displayName ?? "");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: "Profile" });
  }, [navigation]);

  // Sync local form state from user + userDoc when they load/change
  useEffect(() => {
    if (!user) return;

    setEmail(userDoc?.email ?? user.email ?? "");
    setName(userDoc?.displayName ?? user.displayName ?? "");

    setCountry(userDoc?.country ?? "");
    setProvince(userDoc?.province ?? "");
    setCity(userDoc?.city ?? "");

    if (typeof userDoc?.age === "number" && Number.isFinite(userDoc.age)) {
      setAge(String(userDoc.age));
    } else {
      setAge("");
    }
  }, [user, userDoc]);

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
    return (
      <View style={gs.screen}>
        <Text style={gs.label}>Not signed in.</Text>
      </View>
    );
  }

  const onSave = async () => {
    try {
      setSaving(true);
      let updatesMade = false;

      // --- Auth profile updates (name, avatar/photoURL) ---
      const updates: { displayName?: string | null; photoURL?: string | null } =
        {};
      const chosenPhotoURL =
        avatarId == null ? user.photoURL : AVATARS[avatarId];

      if (name !== (user.displayName ?? userDoc?.displayName ?? "")) {
        updates.displayName = name.trim() || null;
      }
      if (chosenPhotoURL && chosenPhotoURL !== user.photoURL) {
        updates.photoURL = chosenPhotoURL;
      }

      if (updates.displayName !== undefined || updates.photoURL !== undefined) {
        updatesMade = true;
        //console.log("Updates length:", updates);
        await updateUserProfile({
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // --- Validate extra fields before sending to Firestore via updateUserDoc ---
      const trimmedCountry = cleanStr(country, 100);
      const trimmedProvince = cleanStr(province, 100);
      const trimmedCity = cleanStr(city, 100);
      const ageStr = cleanAge(age);

      if (trimmedCountry !== null && trimmedCountry.length > 100) {
        Alert.alert("Invalid country", "Country name is too long.");
        return;
      }
      if (trimmedProvince !== null && trimmedProvince.length > 100) {
        Alert.alert("Invalid province", "Province name is too long.");
        return;
      }
      if (trimmedCity !== null && trimmedCity.length > 100) {
        Alert.alert("Invalid city", "City name is too long.");
        return;
      }

      let ageNumber: number | null = null;
      if (ageStr !== null) {
        const n = Number(ageStr);
        ageNumber = n;
      }
      if (
        ageNumber !== null &&
        (!Number.isFinite(ageNumber) ||
          !Number.isInteger(ageNumber) ||
          ageNumber < 0 ||
          ageNumber > 120)
      ) {
        Alert.alert(
          "Invalid age",
          "Please enter a whole number between 0 and 120."
        );
        return;
      }

      // Only send patch if it actually changes
      const patch: any = {};
      if (trimmedCountry !== userDoc?.country) {
        patch.country = trimmedCountry || null;
      }
      if (trimmedProvince !== userDoc?.province) {
        patch.province = trimmedProvince || null;
      }
      if (trimmedCity !== userDoc?.city) {
        patch.city = trimmedCity || null;
      }
      const prevAgeStr =
        typeof userDoc?.age === "number" && Number.isFinite(userDoc.age)
          ? String(userDoc.age)
          : "";
      if (ageStr !== prevAgeStr) {
        patch.age = ageStr === "" ? null : ageNumber;
      }

      if (Object.keys(patch).length > 0) {
        updatesMade = true;
        //console.log("keys length:", Object.keys(patch).length );
        await updateUserDoc(patch);
      }
      if (updatesMade) {
        Alert.alert("Saved", "Profile updated.");
      } else {
        Alert.alert("Saved", "No changes made.");
      }
    } catch (e: any) {
      console.warn("[SettingsScreen] onSave error:", e);
      Alert.alert(
        "Error",
        e?.message?.toString?.() ?? "Failed to update profile."
      );
    } finally {
      setSaving(false);
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
    <ScrollView
      style={gs.screen}
      contentContainerStyle={gs.scrollView}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[gs.label, { marginTop: 12 }]}>Avatar</Text>
      <Pressable
        style={[gs.avatarWrap]}
        onPress={() => setPickerOpen(true)}
        disabled={saving}
      >
        <Image source={{ uri: baseAvatarUri }} style={gs.avatarLarge} />
        <Text style={[gs.label, { textAlign: "center", marginTop: 8 }]}>
          Tap to change photo
        </Text>
      </Pressable>

      {/* Avatar picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={gs.modalBackdrop}>
          <View style={[gs.modalCard]}>
            <Text style={[gs.h2, { marginBottom: 8 }]}>Choose an avatar</Text>

            <View style={styles.grid}>
              {userDoc?.photoOriginalURL ? (
                <Pressable
                  key="original"
                  style={[
                    styles.cell,
                    { borderColor: t.border },
                    userDoc.photoURL == userDoc.photoOriginalURL && {
                      borderColor: t.primary,
                      borderWidth: 2,
                    },
                  ]}
                  disabled={saving}
                  onPress={async () => {
                    try {
                      setSaving(true);
                      await setAvatarId('_original_');
                      setPickerOpen(false);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <Image
                    source={{ uri: userDoc.photoOriginalURL }}
                    style={styles.img}
                  />
                </Pressable>
              ) : null}
              {Object.entries(AVATARS).map(([id, url]) => (
                <Pressable
                  key={id}
                  style={[
                    styles.cell,
                    { borderColor: t.border },
                    avatarId === id && {
                      borderColor: t.primary,
                      borderWidth: 2,
                    },
                  ]}
                  disabled={saving}
                  onPress={async () => {
                    try {
                      setSaving(true);
                      await setAvatarId(id); // updates Firebase photoURL + reloads context
                      setPickerOpen(false);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <Image source={{ uri: url }} style={styles.img} />
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[gs.primaryButton, { marginTop: 12 }]}
              onPress={() => setPickerOpen(false)}
              disabled={saving}
            >
              <Text style={gs.primaryButtonText}>
                {saving ? "Saving..." : "Cancel"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Text style={gs.label}>Email</Text>
      <TextInput
        editable={false}
        value={email}
        onChangeText={setEmail}
        style={[gs.input, gs.disabled]}
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

      <Text style={gs.label}>Country</Text>
      <TextInput
        value={country}
        onChangeText={setCountry}
        style={gs.input}
        placeholder="e.g., Canada"
        placeholderTextColor={t.textMuted}
      />

      <Text style={gs.label}>Province / State</Text>
      <TextInput
        value={province}
        onChangeText={setProvince}
        style={gs.input}
        placeholder="e.g., Ontario"
        placeholderTextColor={t.textMuted}
      />

      <Text style={gs.label}>City</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        style={gs.input}
        placeholder="e.g., Toronto"
        placeholderTextColor={t.textMuted}
      />

      <Text style={gs.label}>Age</Text>
      <TextInput
        value={age}
        onChangeText={setAge}
        style={gs.input}
        placeholder="e.g., 29"
        placeholderTextColor={t.textMuted}
        keyboardType="number-pad"
      />

      <TouchableOpacity onPress={onResetPassword}>
        <Text style={gs.link}>Send Password Reset Email</Text>
      </TouchableOpacity>

      <Pressable
        style={[gs.primaryButton, { marginTop: 16 }]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={gs.primaryButtonText}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
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
    </ScrollView>
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
