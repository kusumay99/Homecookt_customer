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
// THEME COLORS
// ============================================================

export const AppColors = {
  light: {
    orange: "#F97316",
    gold: "#FBBF24",
    cream: "#FEF3C7",

    background: "#FEF8F3",
    card: "#FFFFFF",

    foreground: "#1A1614",
    muted: "#F5F5F4",
    mutedForeground: "#78716C",

    warmGray: "#78716C",

    border: "rgba(251, 191, 36, 0.15)",

    destructive: "#EF4444",
    greenDot: "#22C55E",

    inputBackground: "#F5F5F4",

    quantityBackground: "#FFFFFF",

    backgroundSelected: "#FFF2E8",

    text: "#1A1614",
    textSecondary: "#78716C",

    white: "#FFFFFF",
    black: "#000000",

    glassBackground: "rgba(255,255,255,0.70)",
    glassBorder: "rgba(251,191,36,0.20)",

    shadowColor: "#F97316",
  },

  dark: {
    orange: "#F97316",
    gold: "#FBBF24",
    cream: "#FEF3C7",

    background: "#0F0E0D",
    card: "#1A1614",

    foreground: "#FEF8F3",
    muted: "#2A2420",
    mutedForeground: "#A8A29E",

    warmGray: "#A8A29E",

    border: "rgba(251, 191, 36, 0.20)",

    destructive: "#EF4444",
    greenDot: "#22C55E",

    inputBackground: "#2A2420",

    quantityBackground: "#211C19",

    backgroundSelected: "#342A24",

    text: "#FEF8F3",
    textSecondary: "#B0AAA5",

    white: "#FFFFFF",
    black: "#000000",

    glassBackground: "rgba(26,22,20,0.90)",
    glassBorder: "rgba(251,191,36,0.20)",

    shadowColor: "#000000",
  },
} as const;

// ============================================================
// TYPES
// ============================================================

export type ThemeMode =
  | "light"
  | "dark"
  | "system";

export type AppThemeColors =
  | typeof AppColors.light
  | typeof AppColors.dark;

interface AppContextType {
  themeMode: ThemeMode;

  isDarkMode: boolean;

  colors: AppThemeColors;

  toggleTheme: () => Promise<void>;

  changeTheme: (
    mode: ThemeMode
  ) => Promise<void>;
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

const AppContext =
  createContext<AppContextType | undefined>(
    undefined
  );

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

export const AppProvider = ({
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
  // LOAD SAVED THEME
  // ==========================================================

  useEffect(() => {
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

    loadTheme();
  }, []);

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
  // CURRENT COLORS
  // ==========================================================

  const colors = isDarkMode
    ? AppColors.dark
    : AppColors.light;

  // ==========================================================
  // TOGGLE THEME
  // ==========================================================

  const toggleTheme = async () => {
    try {
      const newTheme: ThemeMode =
        isDarkMode
          ? "light"
          : "dark";

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
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo(
    () => ({
      themeMode,
      isDarkMode,
      colors,
      toggleTheme,
      changeTheme,
    }),
    [
      themeMode,
      isDarkMode,
      colors,
    ]
  );

  // ==========================================================
  // THEME LOADING
  // ==========================================================

  if (isLoadingTheme) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor:
              isDarkMode
                ? AppColors.dark.background
                : AppColors.light.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={
            isDarkMode
              ? AppColors.dark.orange
              : AppColors.light.orange
          }
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

export const HomeProvider = ({
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
  const {
    isDarkMode,
    colors,
  } = useApp();

  return (
    <>
      <StatusBar
        barStyle={
          isDarkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          colors.background
        }
      />

      <Stack
        screenOptions={{
          headerShown: false,

          animation:
            "slide_from_right",

          contentStyle: {
            backgroundColor:
              colors.background,
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
  },
});