import React, { useRef } from "react";
import Constants from "expo-constants";
import GooglePlacesTextInput, {
  GooglePlacesTextInputStyles,
  Place,
} from "react-native-google-places-textinput";
import { useColorScheme } from "react-native";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { Keyboard } from "react-native";

const TOKEN =
  (Constants.expoConfig as any)?.extra?.googlePlacesApiKey ||
  (Constants.manifest as any)?.extra?.googlePlacesApiKey; // fallback for classic

type Props = {
  placeholder?: string;
  onChange: (value: string) => void;
  value?: string;
};

export const GooglePlacesInput: React.FC<Props> = React.memo(
  ({ placeholder, onChange, value = "" }) => {
    const scheme = useColorScheme();
    const t = getTheme(scheme);
    const gs = makeGlobalStyles(t);

    const inputRef = useRef<any>(null);

    const handlePlaceSelect = (place: Place) => {
      const details: any = place.details;

      let fullText = "";
      //console.log(place);
      // Prefer formatted_address (e.g. "Toronto, ON, Canada")
      if (details?.formatted_address) {
        fullText = details.formatted_address;
      }
      // Otherwise fall back to "name, vicinity" if available
      else if (details?.name && details?.vicinity) {
        fullText = `${details.name}, ${details.vicinity}`;
      }
      // Or just the name
      else if (details?.name) {
        fullText = details.name;
      }
      // Or the autocomplete description (e.g. "Toronto, ON, Canada")
      else if ((place as any).description) {
        fullText = (place as any).description;
      } else if ((place as any).text?.text) {
        fullText = (place as any).text.text;
      }
      // Last resort: whatever is currently in the input
r

      console.log("Selcted (AutoComplete):", fullText);
      // Send selected text to parent
      setTimeout(() => {
        onChange(fullText);
      }, 100);
    };

    const styles: GooglePlacesTextInputStyles = {
      container: {
        width: "100%",
      },
      input: {
        ...gs.input, // reuse your app-wide input style
        borderColor: t.border,
        color: t.text,
        backgroundColor: t.surface,
      },
      suggestionsContainer: {
        position: "absolute",
        top: "90%", // directly under the input
        left: 0,
        right: 0,
        marginTop: 4,

        backgroundColor: t.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: t.border,

        // make it float over other content
        zIndex: 30,
        shadowColor: "#000",
        shadowOpacity: scheme === "dark" ? 0.4 : 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6, // Android shadow
      },
      placeholder: {
        color: t.textMuted ?? "#888888",
      },
      suggestionItem: {
        backgroundColor: t.surface,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        paddingVertical: 8,
        paddingHorizontal: 12,
      },
      suggestionText: {
        main: {
          color: t.text,
        },
        secondary: {
          color: t.textMuted ?? "#9CA3AF",
        },
      },
    };

    return (
      <GooglePlacesTextInput
        autoCapitalize="words"
        ref={inputRef}
        placeHolderText={placeholder ?? "Search a place…"}
        value={value}
        hideOnKeyboardDismiss={true}
        onTextChange={onChange}
        autoCorrect={false}
        style={styles}
        keyboardType="default"
        returnKeyType="search"
        textContentType="location"
        apiKey={TOKEN}
        onPlaceSelect={handlePlaceSelect}
      />
    );
  }
);
