import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Appearance,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Stack } from "expo-router";

// ============================================================
// STORAGE
// ============================================================

const THEME_KEY = "app_theme";

// ============================================================
// TYPES
// ============================================================

export type ThemeMode = "light" | "dark" | "system";

interface AppContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  changeTheme: (mode: ThemeMode) => Promise<void>;
}

interface HomeContextType {
  refreshHome: number;
  homeLoading: boolean;
  setHomeLoading: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  refresh: () => void;
}

// ============================================================
// APP CONTEXT
// ============================================================

const AppContext = createContext<
  AppContextType | undefined
>(undefined);

// ============================================================
// APP HOOK
// ============================================================

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used inside AppProvider"
    );
  }

  return context;
};

// ============================================================
// APP PROVIDER
// ============================================================

const AppProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [themeMode, setThemeMode] =
    useState<ThemeMode>("light");

  const [systemScheme, setSystemScheme] =
    useState<"light" | "dark">(
      Appearance.getColorScheme() === "dark"
        ? "dark"
        : "light"
    );

  const [isLoadingTheme, setIsLoadingTheme] =
    useState(true);

  // ==========================================================
  // SYSTEM THEME LISTENER
  // ==========================================================

  useEffect(() => {
    const subscription =
      Appearance.addChangeListener(
        ({ colorScheme }) => {
          setSystemScheme(
            colorScheme === "dark"
              ? "dark"
              : "light"
          );
        }
      );

    return () => {
      subscription.remove();
    };
  }, []);

  // ==========================================================
  // LOAD THEME
  // ==========================================================

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme =
        await AsyncStorage.getItem(
          THEME_KEY
        );

      if (
        savedTheme === "light" ||
        savedTheme === "dark" ||
        savedTheme === "system"
      ) {
        setThemeMode(savedTheme);
      } else {
        setThemeMode("light");
      }
    } catch (error) {
      console.error(
        "LOAD THEME ERROR:",
        error
      );

      setThemeMode("light");
    } finally {
      setIsLoadingTheme(false);
    }
  };

  // ==========================================================
  // TOGGLE THEME
  // ==========================================================

  const toggleTheme = async () => {
    try {
      const newTheme: ThemeMode =
        isDarkMode ? "light" : "dark";

      setThemeMode(newTheme);

      await AsyncStorage.setItem(
        THEME_KEY,
        newTheme
      );
    } catch (error) {
      console.error(
        "TOGGLE THEME ERROR:",
        error
      );
    }
  };

  // ==========================================================
  // CHANGE THEME
  // ==========================================================

  const changeTheme = async (
    mode: ThemeMode
  ) => {
    try {
      setThemeMode(mode);

      await AsyncStorage.setItem(
        THEME_KEY,
        mode
      );
    } catch (error) {
      console.error(
        "CHANGE THEME ERROR:",
        error
      );
    }
  };

  // ==========================================================
  // DARK MODE
  // ==========================================================

  const isDarkMode =
    themeMode === "dark" ||
    (
      themeMode === "system" &&
      systemScheme === "dark"
    );

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo(
    () => ({
      themeMode,
      isDarkMode,
      toggleTheme,
      changeTheme,
    }),
    [
      themeMode,
      isDarkMode,
    ]
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoadingTheme) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================================
// HOME CONTEXT
// ============================================================

const HomeContext =
  createContext<
    HomeContextType | undefined
  >(undefined);

// ============================================================
// HOME HOOK
// ============================================================

export const useHome = (): HomeContextType => {
  const context = useContext(HomeContext);

  if (!context) {
    throw new Error(
      "useHome must be used inside HomeProvider"
    );
  }

  return context;
};

// ============================================================
// HOME PROVIDER
// ============================================================

const HomeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [refreshHome, setRefreshHome] =
    useState(0);

  const [homeLoading, setHomeLoading] =
    useState(false);

  const refresh = () => {
    setRefreshHome(
      (previous) => previous + 1
    );
  };

  const value = useMemo(
    () => ({
      refreshHome,
      homeLoading,
      setHomeLoading,
      refresh,
    }),
    [
      refreshHome,
      homeLoading,
    ]
  );

  return (
    <HomeContext.Provider value={value}>
      {children}
    </HomeContext.Provider>
  );
};

// ============================================================
// ROOT LAYOUT
// ============================================================

export default function RootLayout() {
  return (
    <AppProvider>
      <HomeProvider>
        <RootNavigator />
      </HomeProvider>
    </AppProvider>
  );
}

// ============================================================
// ROOT NAVIGATOR
// ============================================================

function RootNavigator() {
  const { isDarkMode } = useApp();

  return (
    <>
      <StatusBar
        barStyle={
          isDarkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          isDarkMode
            ? "#121212"
            : "#FFFFFF"
        }
      />

      {/*
        Expo Router automatically discovers all
        .js / .jsx / .ts / .tsx files inside app/.

        Therefore we do NOT manually register
        individual screen names here.
      */}

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",

          contentStyle: {
            backgroundColor:
              isDarkMode
                ? "#121212"
                : "#FEF8F3",
          },
        }}
      />
    </>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF8F3",
  },
});

