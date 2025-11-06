## Project Overview

This is a personal finance management mobile application named **DuitU**. It is built using **React Native** with the **Expo** framework and **TypeScript**. The application uses **Firebase** for backend services, including **Firestore** for the database and **Firebase Authentication** for user management.

The app allows users to track their assets, expenses, and savings goals. It features a tab-based navigation for easy access to different sections of the app, including a home screen with a financial summary, an analysis screen, a transactions list, a category manager, and a user profile.

## Building and Running

To get started with the project, follow these steps:

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Start the app:**

    ```bash
    npx expo start
    ```

    This will start the Metro bundler and provide options to run the app on an Android emulator, iOS simulator, or on a physical device using the Expo Go app.

### Other Scripts

*   `npm run android`: Runs the app on a connected Android device or emulator.
*   `npm run ios`: Runs the app on an iOS simulator.
*   `npm run web`: Runs the app in a web browser.
*   `npm run lint`: Lints the code using ESLint.

## Development Conventions

*   **File-based Routing:** The project uses `expo-router` for navigation, which is based on the file system structure in the `app` directory.
*   **Styling:** Styles are defined using `StyleSheet.create` in each component file. There is a `constants/theme.ts` file that defines the color scheme for the app.
*   **Components:** Reusable components are located in the `components` directory.
*   **Authentication:** User authentication is handled through the `context/auth-context.tsx` file, which provides an authentication context to the app.
*   **Firebase:** Firebase services are used for the backend. The configuration is located in `firebase.json` and `firestore.rules`.
*   **Headers:** The app uses custom headers within each screen, as the default headers are disabled in the `app/_layout.tsx` file.

## Accessibility

*   **Text, icons and colour contrast** are legible to older adults.
*   **Body text** ≥ 18 pt; colour contrast ≥ 4.5 : 1
