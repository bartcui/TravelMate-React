## **TravelMate – A Trip Planning Mobile App**

### **Team Information:**
Yijun Chen, 1003045518, liloliver.chen@mail.utoronto.ca

Bart Cui, 1011827908, bart.cui@mail.utoronto.ca

### **1. Motivation**

Traveling is one of the most fulfilling ways to experience life and collecting memories that shape who we are. However, the way we plan and remember trips often feels fragmented. Many travelers still rely on spreadsheets, Google Docs, or notes to organize itineraries and reminders. These tools might work early on, but as the details grow, adding flights, checklists, restaurants, and maps etc, it becomes easy to lose track of everything. Even worse, once the trip begins, these tools rarely evolve into something that captures what the journey felt like. And while photos are the main way we document our experiences, our phone galleries quickly become a chaotic collection of hundreds of unorganized pictures. The emotional context, where the photo was taken, what we felt, who we were with often gets lost. Social media offers a glimpse of the highlights, but not a private, immersive way to revisit our memories.

#### **Existing solutions and limitations**

1. **TripIt** – Automatically builds a master itinerary by importing confirmation emails for flights, hotels, and cars. It's useful for frequent travelers who want to consolidate all their bookings in one place. It's an execllent tool for trip planning but lack of tracking and memory building features.
2. **Wanderlog** – A full-featured app for group trip planning, it is great for tracking trips with friends. It is overall what we are aiming for but its strong focus on group coordiation might make it sightly too complicated for users who just want to record trips personally.
3. **Google Maps** – Useful for saving places, and navagating around cities and driving but lacks trip timelines, journaling, or reminders.

Our project, TravelMate, aims to bridge this gap by creating a travel companion that grows with you, from planning the trip to reliving it afterward. It simplifies travel organization, helps you track your journey in real time, and transforms your memories into an interactive, location-aware diary you can return to anytime. TravelMate isn’t just about where you go, it’ll be about the story you build along the way. This final report summarizes what was completed, what functionality works, and how other developers can reproduce and test the application on their own machines.

---

### **2. Objectives**

The primary objective of TravelMate is to design and develop a fully functional and engaging travel planning application using React Native and Expo. The app aims to meet and exceed all core technical requirements of the course by demonstrating proficiency in multi-screen mobile development, state management, backend integration, and modern mobile UX patterns.

More specifically, the project seeks to:

- Build a multi-screen, intuitive travel planner that allows users to create, view, and manage trips within a seamless navigation flow.
- Fulfill all Core Technical Requirements, including React Navigation, global state handling, persistent storage, notifications, and external service integration.
- Implement backend connectivity using Firebase, enabling secure user authentication and synchronized storage of trip data.
- Deliver creative, user-centered enhancements—such as map-based trip visualization, photo journaling, and calendar-based itinerary planning—to elevate the overall travel planning experience.

In summary, TravelMate’s objective is to showcase the ability to build a polished mobile application that combines frontend functionality, backend services, and thoughtful user experience design into a practical travel companion tool.

### **2. Technical Stack**

TravelMate was developed using **React Native using TypeScript** and **Expo** with additional libraries, and cloud services integrated to support navigation, state management, backend authentication, mapping, notifications, and external data sources. The app’s navigation is powered by **Expo Router** and for global application data, Trip and Step information is managed via **React Context** combined with **useReducer**. **AsyncStorage** ensures persistent local data across app reloads and device restarts. Push notifications are implemented using **Expo Notifications**, enabling real device reminders for upcoming trips. **Firebase** is used for authentication and backend connectivity and Google OAuth **Expo AuthSession** for sign-in. **Google Places Autocomplete**, **Mapbox Geocoding**, and **react-native-maps** for location search, geospatial processing, and interactive map visualization. **react-native-calendars** to provide mobile-optimized date selection UI.

In the next Features section, each of these technologies will be discussed in detail, along with how they support specific app functionalities.

### **2. Features**
#### **Core Features**

##### **(1) React Native and Expo Development**

TravelMate was fully implemented using React Native with Expo and written in **TypeScript**. The project was created with create-expo-app and structured using Expo’s recommended TypeScript template. Every component and screen uses TypeScript interfaces for props, state, and navigation types. Core **React Native components** were used throughout the app such as:
Text, View, Pressable, TextInput, FlatList, ScrollView, Image, etc. **Hooks** such as useState, useEffect, useMemo, and useReducer are used for business logic and UI updates.

All code adheres to TypeScript typing:
- Trip and Step models
- Context state and reducer actions
- Navigation params for dynamic routes
---

##### **(2) Navigation Structure**

We used **Expo Router** to handle navigation between different screens. Expo Router provides a file-based routing system similar to Next.js, making it easier to organize screens and layouts.

**File-based routing (Expo Router):**
```
app/
 ├── index.tsx
 ├── trips/create.tsx
 ├── trips/[id]/index.tsx
 ├── trips/[id]/add-step.tsx
 ├── trips/[id]/edit.tsx
 ├── trips/[id]/steps/[stepId]/edit.tsx
 ├── notifications/index.tsx
 ├── settings/index.tsx
 ├── map/index.tsx
 ├── _layout.tsx
```
**Dynamic routing**

We used [id] and [stepId] dynamic segments to navigate to:
- Specific trips
```/trips/123```
- Specific steps within a trip
```/trips/123/steps/456/edit```
This satisfies the requirement for data-driven navigation and typed parameters.

**Data passing between screens**
 
Trip and step data are retrieved using Context based on the route params. Navigation is implemented by:
```ts
router.push(`/trips/${trip.id}`)
router.push(`/trips/${trip.id}/steps/${step.id}/edit`)
```
---

##### **(3) State Management and Persistence**

We used **React Context** and **useReducer** for global state management and AsyncStorage for app-wide persistence.
The state will include:

- A list of all trips.
- All steps within trips.
- User profile and selected avatar
- Notification state

We implemented a central TripContext that stores the entire app’s trip/step state.

**Features**:

- Reducer actions include: ADD_TRIP, UPDATE_TRIP, REMOVE_TRIP, ADD_STEP, UPDATE_STEP, REMOVE_STEP
- Actions defined as TypeScript unions
- Global hooks: useTrips() for consuming context 

**AsyncStorage Persistence**

On app startup:

- State rehydrates from AsyncStorage
- Reducer updates automatically update storage

This guarantees persistence across:
App reloads, Expo Go restarts, and Device restarts

---

##### **(4) Notification Setup**

TravelMate implements a full local push notification system using **Expo Notifications**, allowing the app to send real device notifications that appear in the device’s notification bar. The final implementation uses Expo’s native notification scheduling, meaning users receive reminders even if the app is closed.

**Upcoming trip reminders**

Notifications are automatically scheduled when a trip is created or updated. We implemented three reminder rules:

- 1 Day and 3 Days Before Trip Starts. To help users prepare last-minute essentials.
- Within One Week of Creation. If a new trip is added and its start date is within 7 days, the app immediately schedules: A “trip coming up soon” notification

**Device-Level Notification Behaviour**

Once the app is built with EAS:

- Notifications appear in the system notification bar
- Tapping a notification opens the app directly
- Navigation is routed to the associated trip details (/trips/[id])

---

##### **(5) Backend Integration**

TravelMate connects to a cloud backend using **Firebase**, enabling user authentication, cloud syncing, and cross-device persistence.

**Firebase Authentication**

- Handles login
- Creates a unique user profile for each traveler
- Allows different users to see their own trips
- Ensures separation between users’ stored data

TBD
---


#### **Advanced Features**

##### **(1) Google OAuth Sign-In**

To support personalization and multi-device access, we implemented secure user authentication using Google OAuth through **Expo AuthSession**. This allows users to log in with their existing Google accounts rather than entering credentials manually. Once authenticated, the user’s profile (name, email, photo) is retrieved and stored locally, enabling customized experiences such as displaying the user’s name on the Home screen and syncing personalized trip data. Integrating OAuth also lays the foundation for cloud-based syncing of trips in future releases, as each user now has a unique and verifiable identity. 

The login flow:

1. The user taps “Login with Google.”
2. The app opens a browser session using OAuth.
3. Once the user logs in, an authentication token is returned.
4. The token is securely stored using Async Storage.
5. The app displays personalized data that was stored after login.

##### **(2) Integration with External Services**

To improve accuracy, convenience, and richness of the travel planning experience, TravelMate connects with several powerful external APIs and SDKs.

- **Google Places Autocomplete**

During the trip and step creation process, the user often needs to enter city names or specific attractions. Manually typing full place names is slow and prone to errors. To solve this, we integrated Google Places Autocomplete, allowing users to begin typing a location and receive real-time suggestions sourced directly from Google’s database. This not only improves location data accuracy to reflect on the map but also speeds up the planning workflow.

- **Mapbox Geocoding Services**

After selecting a location, TravelMate uses Mapbox Geocoding to convert place names into precise geographic coordinates. These coordinates are used to place the photo from each step on the interactive world map and highlight destinations across all trips on the Home screen. This feature allows TravelMate to represent travel data more accurately on the map in the next point. Mapbox was used for its flexible API and 2500 transactions per day for free tier users is more than enough for this project.

- **react-native-maps** for Interactive Maps

The Home screen includes an interactive global map implemented using react-native-maps. This map displays one photo for each saved trip and their associated steps, giving users an geographical overview of their travel history and upcoming plans. The initial region is set to user's hometown with a zoomed-out view, ensuring that users immediately see where the journey starts. As the user adds more steps and trips, the map dynamically updates, reflecting newly added destinations.

- **react-native-calendars** for Date Selection

To streamline date selection for trips and steps, we integrated the react-native-calendars library. This component offers a mobile-friendly calendar interface for choosing start and end dates. It improves both speed and accuracy compared to manual date input.

---
##### **Deployment Plan**

The deployment of TravelMate was carried out using **Expo’s EAS Build** system, which provides a cloud-based pipeline for producing builds for iOS and Android.To prepare the project for deployment, we first initialized EAS within the repository and configured build profiles through the eas.json file. The development profile produced a build containing the Expo Development Client, which allowed us to test native features—including notifications, authentication, and Mapbox map rendering—directly on physical devices while still retaining the ability to use the local Metro bundler. The preview profile was used to generate internal-share builds that could be distributed to teammates or testers without requiring them to run the project locally. Finally, the production profile generated optimized release builds suitable for future submission to mobile app stores.

As part of the deployment setup, we ran the Expo prebuild process, which generated native ios/ and android/ directories required for integrating custom native modules. EAS handled all necessary mobile credentials automatically. Environment variables such as Firebase configuration keys and the Mapbox API token were injected through EAS Secrets, ensuring that sensitive information was not exposed in the repository. Once the development and preview builds were successfully created, we tested the application on an iOS simulator first to validate critical functionality that is not available in Expo Go, such as scheduled notifications. 

#### **Setup the testing env**

```bash
npm install
npx expo prebuild
eas build --profile development --platform ios
npx expo start --dev-client
```

---
#### **Contributions**

**Oliver**

- Set up Expo project, TypeScript configuration, and EAS build environment.
- Implement backend integration (Supabase or Firebase) and authentication (AuthSession) along with User Profile screen.
- Develop Mapbox integration for displaying trips on the map.
- Handle Async Storage setup for state persistence.
- Manage app deployment with Expo EAS and produce final builds.

**Bart**

- Implement the main screens (Home, Add Trip, Trip Details, Schedule, Notification) using React Native core components.
- Design navigation using Expo Router and TypeScript types for props and routes.
- Build the Context + useReducer architecture for trip state.
- Implement the camera integration and notification scheduling.
- Focus on UI/UX polishing, testing, and bug fixing.

Both team members will collaborate on:

- Testing authentication flow and API calls.
- Reviewing and debugging cross-screen data passing.
- Writing documentation and preparing the final presentation.


### Code Statistics (cloc)
- **TypeScript (primary source code): 3,142 lines**
![Line Count](./line%20count.JPG)
