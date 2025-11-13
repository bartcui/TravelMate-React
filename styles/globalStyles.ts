// styles/globalStyles.ts
import { StyleSheet } from "react-native";
import type { Theme } from "./colors";

export const makeGlobalStyles = (t: Theme) =>
  StyleSheet.create({
    // layout
    screen: { flex: 1, backgroundColor: t.bg, padding: 16 },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    // text
    h1: { fontSize: 22, fontWeight: "800", color: t.text, marginBottom: 12 },
    label: { fontSize: 13, color: t.text, marginTop: 8 },

    //link
    link: { textAlign: "center", color: "#007bff" },

    // container
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: "#fff",
    },

    // title
    title: {
      fontSize: 24,
      fontWeight: "600",
      marginBottom: 24,
      textAlign: "center",
    },
    // inputs
    input: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 6,
      color: t.text,
      backgroundColor: t.surface,
    },

    // date pickers
    dateBtn: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginTop: 6,
      backgroundColor: t.surface,
    },
    dateTxt: { color: t.text },

    // chips
    chipsRow: { flexDirection: "row", gap: 8, marginTop: 6 },
    chip: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: t.surface,
    },
    chipActive: { backgroundColor: t.primary, borderColor: t.primary },
    chipTxt: { fontWeight: "600", color: t.text },
    chipTxtActive: { color: t.primaryOn },

    // buttons
    primaryButton: {
      marginTop: 16,
      backgroundColor: t.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryButtonText: { color: t.primaryOn, fontWeight: "800" },
    h2: { fontSize: 20, fontWeight: "700", color: t.text },
    avatarWrap: { alignItems: "center", marginTop: 12, marginBottom: 8 },
    avatarLarge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 1,
      borderColor: "#ddd",
    },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
    cell: {
      width: 70,
      height: 70,
      borderRadius: 35,
      overflow: "hidden",
      borderWidth: 1,
    },
    img: { width: "100%", height: "100%" },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.25)",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: "#e5e5e5",
    },
    disabled: {
      backgroundColor: "#f2f2f2",
      color: "#666",
      borderColor: "#ddd",
    },
    scrollView: {
      paddingBottom: 40,
    },
    asterisk: {
      fontSize: 16,
      color: "red",
    },
  });
