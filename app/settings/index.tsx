// app/settings/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Image, StyleSheet, Alert } from "react-native";
import { useNavigation } from "expo-router";
import { useUser, AVATARS } from "../../contexts/UserContext";
import { useColorScheme } from "react-native";
import { getTheme } from "../../styles/colors";
import { makeGlobalStyles } from "../../styles/globalStyles";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { profile, updateProfile, signOut } = useUser();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const [email, setEmail] = useState(profile?.email ?? "");
  const [name, setName] = useState(profile?.name ?? "");
  const [pwd, setPwd] = useState(profile?.password ?? "");
  const [avatarId, setAvatarId] = useState(profile?.avatarId ?? "a1");

  useEffect(() => {
    navigation.setOptions({ title: "Settings" });
  }, [navigation]);

  if (!profile) {
    return <View style={gs.screen}><Text style={gs.label}>No profile yet.</Text></View>;
  }

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

      <Text style={gs.label}>Password (demo)</Text>
      <TextInput
        value={pwd}
        onChangeText={setPwd}
        style={gs.input}
        secureTextEntry
        placeholderTextColor={t.textMuted}
      />

      <Text style={[gs.label, { marginTop: 8 }]}>Avatar</Text>
      <View style={styles.grid}>
        {Object.entries(AVATARS).map(([id, url]) => (
          <Pressable key={id} style={[styles.cell, avatarId === id && { borderColor: t.primary, borderWidth: 2 }]}
            onPress={() => setAvatarId(id as any)}>
            <Image source={{ uri: url }} style={styles.img} />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[gs.primaryButton, { marginTop: 16 }]}
        onPress={async () => {
          await updateProfile({ email: email.trim(), name: name.trim(), password: pwd, avatarId });
          Alert.alert("Saved", "Profile updated.");
        }}
      >
        <Text style={gs.primaryButtonText}>Save Changes</Text>
      </Pressable>

      <Pressable
        style={[gs.primaryButton, { backgroundColor: "#eb5757", marginTop: 8 }]}
        onPress={() => {
          Alert.alert("Sign out?", "You will be asked to create a profile next launch.", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: () => signOut() },
          ]);
        }}
      >
        <Text style={gs.primaryButtonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  cell: { width: 70, height: 70, borderRadius: 35, overflow: "hidden", borderColor: "#ddd", borderWidth: 1 },
  img: { width: "100%", height: "100%" },
});
