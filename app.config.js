export default ({ config }) => ({
  ...config,
  expo: {
    name: "TravelMate-React",
    slug: "TravelMate-React",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "travelmate",

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ece1778.travelmate",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.ece1778.travelmate",
      googleServicesFile: "./google-services.json",
    },

    web: {
      favicon: "./assets/favicon.png",
    },

    extra: {
      MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
      router: {},
      eas: {
        projectId: "c410be8c-4ab7-4ac0-8163-8420a6259499",
      },
    },

    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin",

      [
        "react-native-maps",
        {
          iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      ],

      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            deploymentTarget: "18.6",
          },
        },
      ],
    ],

    owner: "liloliver",
  },
});
