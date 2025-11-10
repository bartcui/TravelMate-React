import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Image, StyleSheet, ScrollView } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useUser, AVATARS } from "../contexts/UserContext";
import { useColorScheme } from "react-native";
import { getTheme } from "../styles/colors";
import { makeGlobalStyles } from "../styles/globalStyles";

export default function Onboarding() {
  const navigation = useNavigation();
  const router = useRouter();
  const { setProfile } = useUser();

  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  const [avatarId, setAvatarId] = useState<keyof typeof AVATARS>("a1");

  useEffect(() => {
    navigation.setOptions({ title: "Create Profile" });
  }, [navigation]);

  const canContinue = email.trim() && name.trim() && pwd.length >= 4;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: t.bg }} keyboardShouldPersistTaps="handled">
      <Text style={gs.h1}>Welcome 👋</Text>

      <Text style={gs.label}>Email</Text>
      <TextInput
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      <Text style={gs.label}>Name</Text>
      <TextInput
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      <Text style={gs.label}>Password</Text>
      <TextInput
        placeholder="••••"
        value={pwd}
        onChangeText={setPwd}
        secureTextEntry
        style={gs.input}
        placeholderTextColor={t.textMuted}
      />

      <Text style={[gs.label, { marginTop: 8 }]}>Choose an avatar</Text>
      <View style={styles.grid}>
        {Object.entries(AVATARS).map(([id, url]) => (
          <Pressable key={id} style={[styles.cell, avatarId === id && { borderColor: t.primary, borderWidth: 2 }]}
            onPress={() => setAvatarId(id as any)}>
            <Image source={{ uri: url }} style={styles.img} />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[gs.primaryButton, !canContinue && { opacity: 0.5 }]}
        disabled={!canContinue}
        onPress={async () => {
          await setProfile({ email: email.trim(), name: name.trim(), password: pwd, avatarId });
          router.replace("/");
        }}
      >
        <Text style={gs.primaryButtonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  cell: { width: 70, height: 70, borderRadius: 35, overflow: "hidden", borderColor: "#ddd", borderWidth: 1 },
  img: { width: "100%", height: "100%" },
});
