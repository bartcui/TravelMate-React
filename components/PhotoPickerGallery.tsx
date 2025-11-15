// components/PhotoPickerGallery.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/firebaseConfig";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { useColorScheme } from "react-native";

const storage = getStorage(app);

type Props = {
  /** Current list of photo URLs (from Firestore). */
  photos: string[];

  /** Called when photos change (add/remove) so parent can persist. */
  onChange: (photos: string[]) => void;

  /** Base path in Storage, e.g. `users/${uid}/trips/${tripId}/steps/${stepId}` */
  storageBasePath: string;

  /** Optional title above the gallery */
  title?: string;

  /** Max number of photos allowed (default: 10). */
  maxPhotos?: number;
};

export const PhotoPickerGallery: React.FC<Props> = ({
  photos,
  onChange,
  storageBasePath,
  title = "Photos",
  maxPhotos = 10,
}) => {
  const [uploading, setUploading] = useState(false);
  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const canAddMore = photos.length < maxPhotos;

  const handleAddPhoto = async () => {
    if (!canAddMore) {
      Alert.alert(
        "Limit reached",
        `You can only add up to ${maxPhotos} photos.`
      );
      return;
    }

    try {
      setUploading(true);

      // request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow photo access to upload pictures."
        );
        return;
      }

      // pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      // convert uri → blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // upload to Firebase Storage
      const filename = `${
        Date.now() + "-" + Math.random().toString(36).slice(2)
      }.jpg`;
      const fullPath = `${storageBasePath}/${filename}`;

      const storageRef = ref(storage, fullPath);
      await uploadBytes(storageRef, blob);

      // get download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // update parent
      onChange([...photos, downloadUrl]);
    } catch (err: any) {
      console.error("Failed to upload photo:", err);
      Alert.alert(
        "Upload failed",
        "Could not upload the photo. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (url: string) => {
    Alert.alert("Remove photo", "Do you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          onChange(photos.filter((p) => p !== url));
        },
      },
    ]);
  };

  return (
    <View>
      <View style={gs.headerRow}>
        <Text style={gs.label}>Upload photos</Text>
        {uploading && <ActivityIndicator size="small" />}
      </View>

      <View style={gs.grid}>
        {photos.map((url) => (
          <Pressable
            key={url}
            onLongPress={() => handleRemovePhoto(url)}
            style={styles.photoWrapper}
          >
            <Image source={{ uri: url }} style={styles.photo} />
          </Pressable>
        ))}

        {canAddMore && (
          <Pressable
            onPress={handleAddPhoto}
            style={styles.addTile}
            disabled={uploading}
          >
            <Text style={styles.addIcon}>＋</Text>
            <Text style={styles.addText}>Add photo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  photoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  addTile: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  addIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  addText: {
    fontSize: 11,
    textAlign: "center",
    color: "#4b5563",
  },
});
