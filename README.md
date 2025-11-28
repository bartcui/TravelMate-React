## **TravelMate – A Trip Planning Mobile App**

### **1. Introduction**

Traveling is one of the most fulfilling ways to experience life and collecting memories that shape who we are. However, the way we plan and remember trips often feels fragmented. Many travelers still rely on spreadsheets, Google Docs, or notes to organize itineraries and reminders. These tools might work early on, but as the details grow, adding flights, checklists, restaurants, and maps etc, it becomes easy to lose track of everything. Even worse, once the trip begins, these tools rarely evolve into something that captures what the journey felt like. And while photos are the main way we document our experiences, our phone galleries quickly become a chaotic collection of hundreds of unorganized pictures. The emotional context, where the photo was taken, what we felt, who we were with often gets lost. Social media offers a glimpse of the highlights, but not a private, immersive way to revisit our memories.

Our project, TravelMate, aims to bridge this gap by creating a travel companion that grows with you — from planning the trip to reliving it afterward. It simplifies travel organization, helps you track your journey in real time, and transforms your memories into an interactive, location-aware diary you can return to anytime. TravelMate isn’t just about where you go, it’ll be about the story you build along the way. This final report summarizes what was completed, what functionality works, and how other developers can reproduce and test the application on their own machines.

#### **Why this project is worth pursuing** - Same as proposal

Trip planning and travel journaling are universal activities, yet most existing solutions focus heavily on logistics or booking automation. Apps like TripIt and Wanderlog excel at managing reservations or collaborative planning, but they can feel complex or impersonal for travelers who simply want an easy, creative way to document their own experiences. On the other end, note-taking apps like Apple Notes or Google Keep lack structure, location integration, and the emotional touch that makes travel memories meaningful.

TravelMate fills this middle ground. It combines the essential efficiency of travel planners with the personal, story-driven nature of journaling. Users can:

- Create and organize trip plans with destinations, dates, and activities.
- Capture moments during the trip by adding photos and notes.
- Automatically connect memories to map locations for an immersive playback.
- Relive trips through a digital memory book that feels like a personal travel timeline.
  Built with React Native and Expo, TravelMate will provide a smooth and consistent experience across iOS and Android, ensuring accessibility and responsiveness even when offline.

#### **Target users** - Same as proposal

Our target users are:

- Casual travelers who take weekend getaways or short trips and want a simple, visually appealing travel tracker.
- Students and young professionals who travel with friends and want to log group experiences without complicated setup.
- Families or friends who want to preserve vacation memories in an organized, easy-to-revisit format.
- Solo travelers who enjoy journaling and reflecting on their trips privately.

#### **Existing solutions and limitations**

1. **TripIt** – Automatically builds a master itinerary by importing confirmation emails for flights, hotels, and cars. It's useful for frequent travelers who want to consolidate all their bookings in one place. It's an execllent tool for trip planning but lack of tracking and memory building features.
2. **Wanderlog** – A full-featured app for group trip planning, it is great for tracking trips with friends. It is overall what we are aiming for but its strong focus on group coordiation might make it sightly too complicated for users who just want to record trips personally.
3. **Google Maps** – Useful for saving places, and navagating around cities and driving but lacks trip timelines, journaling, or reminders.

TravelMate will provide the missing middle ground: a lightweight and personal trip organizer that supports photo logging, map visualization, and reminders without requiring a complicated setup.

---

### **2. Objectives and Key Features**

#### **Project Objective**

The objective of TravelMate is to build a functional and visually appealing mobile trip planner app using React Native with Expo, meeting all technical requirements of the course. The app will demonstrate the ability to create a multi-screen mobile application that integrates state management, local persistence, notifications, authentication, and a backend connection.

#### **Core Features**

This section explains how TravelMate successfully fulfilled all required core technical requirements.

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

We will use **React Context API** combined with **useReducer** to manage the global state of trips.
The state will include:

- A list of all trips.
- Selected trip details.
- User details
- User preferences (e.g., dark or light theme).

Example:

```ts
type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  summary: string;
  photoUri?: string; //concatenated string for multiple phone URIs
};

type TripState = {
  trips: Trip[];
};
```

**Reducer actions** will handle adding, editing, and deleting trips.
The app state will be persisted using **React Native Async Storage**, ensuring that user data remains available even after restarting the app.

On app launch, the reducer will rehydrate the state from Async Storage.

---

##### **(3) Notification Setup**

We will implement **local notifications** using **Expo Notifications**.
For example, users can choose to receive:

- A daily reminder to check upcoming trips.
- A notification one day before a trip starts.

When users tap on a notification, the app will navigate them to the relevant trip detail screen. This feature demonstrates our understanding of scheduling and handling local notifications and user interactions.

---

##### **(4) Backend Integration**

We will connect our app to a backend service using a **Backend-as-a-Service (BaaS)** platform, most likely **Supabase** or **Firebase**.

Backend responsibilities:

- Store user accounts and authentication data.
- Store user trip data (optional synchronization with cloud).
- Support basic CRUD operations for trip plans.

The app will fetch and display live data from the backend, showing user-specific trip lists. We will handle loading and error states gracefully with indicators and retry logic.

This will allow users to sync their trips between devices and keep backups online.
We will also ensure that the app can still work **offline**, with local persistence as fallback.

---

##### **(5) Deployment Plan**

We will build and deploy the app using **Expo EAS Build** for testing.
Both Android (APK) and iOS (IPA or Expo Go link) test builds will be produced for evaluation.

The deployment steps include:

- Configuring EAS project with `eas.json`.
- Building development and preview builds for device testing.
- Ensuring the app runs smoothly on both platforms.

---

##### **(6) Advanced Features**

###### **a. User Authentication**

We will implement **user login and logout** using **Expo AuthSession**, enabling Google login.

The login flow:

1. The user taps “Login with Google.”
2. The app opens a browser session using OAuth.
3. Once the user logs in, an authentication token is returned.
4. The token is securely stored using Async Storage.
5. The app displays personalized data after login.

This fulfills the requirement for secure authentication using a modern OAuth method.
We chose AuthSession because it’s simple, secure, and easy to integrate with Expo without native dependencies.

###### **b. Device Camera Integration**

The app will allow users to attach photos to their trips using the device camera.
This will use the expo-camera module, with proper permission handling.
When creating or viewing a trip, the user can take a photo or select one from the gallery to store as part of the trip record.
The photo URI will be saved locally or uploaded to the backend, depending on connectivity.

###### **c. Location API**

The Home screen will integrate **expo-location** to show the user’s current location and added trips on a Mapbox map.
Users can visualize their travel routes or see destinations marked globally.

---

##### **(7) Scope and Feasibility**

The project is designed to be achievable within two months by a two-person team.
Each feature builds on core React Native and Expo concepts without requiring heavy native development. Expo’s built-in tools for notifications, authentication, and sensors make integration efficient.

We will limit the scope to essential features first—trip CRUD, navigation, state management, and local persistence—before adding enhancements like photos, map, and notifications. This phased approach ensures we can deliver a working app even if advanced features take longer.

---

### **3. Tentative Plan**

We will complete the project collaboratively in phases. The development will focus on building a clean, functional MVP first, followed by enhancements and testing.

#### **Planned Responsibilities**

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

#### **Development Phases (Conceptually)**

1. **Project Setup**

   - Initialize Expo app with TypeScript.
   - Configure project structure and routing layout.
   - Set up Context and reducer for managing trips.

2. **Core Functionality**

   - Build screens (Home, Add Trip, Details, Schedule).
   - Implement CRUD logic for trips.
   - Persist state using Async Storage.

3. **Backend and Auth**

   - Connect to Supabase or Firebase backend.
   - Implement Google login with Expo AuthSession.
   - Sync trips with backend for logged-in users.

4. **Advanced Integrations**

   - Add notifications for upcoming trips.
   - Integrate camera for adding photos.
   - Use location API to show trips on map.

5. **Testing and Deployment**

   - Test on both iOS and Android devices.
   - Fix UI and navigation bugs.
   - Build and deploy using Expo EAS.
   - Prepare presentation and documentation.

---

#### **Setup the testing env**

```bash
npm install
npx expo prebuild
eas build --profile development --platform ios
npx expo start --dev-client
```
