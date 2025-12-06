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
      config: {
        googleMapsApiKey:  process.env.GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
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
      MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
      googlePlacesApiKey: process.env.GOOGLE_MAPS_API_KEY,
      router: {},
      eas: {
        projectId: "c410be8c-4ab7-4ac0-8163-8420a6259499",
      },
    },

    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin",
      "expo-notifications",
      "expo-image-picker",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            //deploymentTarget: "18.6",
          },
        },
      ]
    ],

    owner: "liloliver",
  },
});
