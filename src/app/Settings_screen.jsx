import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

// ============================================================
// OPTIONAL APP THEME CONTEXT
// ============================================================
//
// This works with the AppProvider/useApp that you already
// have in your app/_layout.tsx.
//
// If useApp is exported from another file in your project,
// change the import path below.
//
// ============================================================

import { useApp } from "./_layout";

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  orange: "#F28C28",
  gold: "#F5B83D",
  cream: "#FFF4E5",

  background: "#F7F8FA",
  card: "#FFFFFF",
  foreground: "#181818",
  mutedForeground: "#777777",

  darkBackground: "#121212",
  darkCard: "#1E1E1E",
  darkForeground: "#FFFFFF",
  darkMutedForeground: "#AAAAAA",

  border: "rgba(245, 184, 61, 0.15)",
  darkBorder: "rgba(255,255,255,0.08)",
};

// ============================================================
// STORAGE KEYS
// ============================================================

const STORAGE_KEYS = {
  pushNotifications: "pushNotifications",
  emailUpdates: "emailUpdates",
  promotionalOffers: "promotionalOffers",
  locationAccess: "locationAccess",
  analytics: "analytics",
};

// ============================================================
// SETTINGS SCREEN
// ============================================================

const SettingsScreen = () => {
  const router = useRouter();

  // ==========================================================
  // SHARED APP THEME
  // ==========================================================

  const { isDarkMode, toggleTheme } = useApp();

  // ==========================================================
  // SETTINGS STATE
  // ==========================================================

  const [pushNotifications, setPushNotifications] =
    useState(true);

  const [emailUpdates, setEmailUpdates] =
    useState(false);

  const [promotionalOffers, setPromotionalOffers] =
    useState(true);

  const [locationAccess, setLocationAccess] =
    useState(true);

  const [analytics, setAnalytics] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  // ==========================================================
  // LOAD SETTINGS
  // ==========================================================

  useEffect(() => {
    loadSettings();
  }, []);

  // ==========================================================
  // LOAD SETTINGS FROM ASYNC STORAGE
  // ==========================================================

  const loadSettings = async () => {
    try {
      const [
        savedPush,
        savedEmail,
        savedPromotional,
        savedLocation,
        savedAnalytics,
      ] = await Promise.all([
        AsyncStorage.getItem(
          STORAGE_KEYS.pushNotifications
        ),

        AsyncStorage.getItem(
          STORAGE_KEYS.emailUpdates
        ),

        AsyncStorage.getItem(
          STORAGE_KEYS.promotionalOffers
        ),

        AsyncStorage.getItem(
          STORAGE_KEYS.locationAccess
        ),

        AsyncStorage.getItem(
          STORAGE_KEYS.analytics
        ),
      ]);

      // ------------------------------------------------------
      // PUSH NOTIFICATIONS
      // ------------------------------------------------------

      if (savedPush !== null) {
        setPushNotifications(
          savedPush === "true"
        );
      }

      // ------------------------------------------------------
      // EMAIL UPDATES
      // ------------------------------------------------------

      if (savedEmail !== null) {
        setEmailUpdates(
          savedEmail === "true"
        );
      }

      // ------------------------------------------------------
      // PROMOTIONAL OFFERS
      // ------------------------------------------------------

      if (savedPromotional !== null) {
        setPromotionalOffers(
          savedPromotional === "true"
        );
      }

      // ------------------------------------------------------
      // LOCATION ACCESS
      // ------------------------------------------------------

      if (savedLocation !== null) {
        setLocationAccess(
          savedLocation === "true"
        );
      }

      // ------------------------------------------------------
      // ANALYTICS
      // ------------------------------------------------------

      if (savedAnalytics !== null) {
        setAnalytics(
          savedAnalytics === "true"
        );
      }
    } catch (error) {
      console.error(
        "LOAD SETTINGS ERROR:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // SAVE SETTING
  // ==========================================================

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(
        key,
        String(value)
      );
    } catch (error) {
      console.error(
        `SAVE SETTING ERROR [${key}]:`,
        error
      );
    }
  };

  // ==========================================================
  // DARK MODE
  // ==========================================================

  const handleDarkMode = async () => {
    try {
      await toggleTheme();
    } catch (error) {
      console.error(
        "TOGGLE THEME ERROR:",
        error
      );
    }
  };

  // ==========================================================
  // PUSH NOTIFICATIONS
  // ==========================================================

  const togglePushNotifications = async (
    value
  ) => {
    setPushNotifications(value);

    await saveSetting(
      STORAGE_KEYS.pushNotifications,
      value
    );
  };

  // ==========================================================
  // EMAIL UPDATES
  // ==========================================================

  const toggleEmailUpdates = async (
    value
  ) => {
    setEmailUpdates(value);

    await saveSetting(
      STORAGE_KEYS.emailUpdates,
      value
    );
  };

  // ==========================================================
  // PROMOTIONAL OFFERS
  // ==========================================================

  const togglePromotionalOffers = async (
    value
  ) => {
    setPromotionalOffers(value);

    await saveSetting(
      STORAGE_KEYS.promotionalOffers,
      value
    );
  };

  // ==========================================================
  // LOCATION ACCESS
  // ==========================================================

  const toggleLocationAccess = async (
    value
  ) => {
    setLocationAccess(value);

    await saveSetting(
      STORAGE_KEYS.locationAccess,
      value
    );
  };

  // ==========================================================
  // ANALYTICS
  // ==========================================================

  const toggleAnalytics = async (
    value
  ) => {
    setAnalytics(value);

    await saveSetting(
      STORAGE_KEYS.analytics,
      value
    );
  };

  // ==========================================================
  // THEME COLORS
  // ==========================================================

  const backgroundColor = isDarkMode
    ? COLORS.darkBackground
    : COLORS.background;

  const cardColor = isDarkMode
    ? COLORS.darkCard
    : COLORS.card;

  const textColor = isDarkMode
    ? COLORS.darkForeground
    : COLORS.foreground;

  const mutedColor = isDarkMode
    ? COLORS.darkMutedForeground
    : COLORS.mutedForeground;

  const borderColor = isDarkMode
    ? COLORS.darkBorder
    : COLORS.border;

  // ==========================================================
  // GO BACK
  // ==========================================================

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/Profile_screen");
    }
  };

  // ==========================================================
  // SETTING ROW
  // ==========================================================

  const SettingRow = ({
    icon,
    label,
    trailing,
  }) => {
    return (
      <View style={styles.row}>
        {/* ICON */}

        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDarkMode
                ? "rgba(242,140,40,0.15)"
                : COLORS.cream,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={COLORS.orange}
          />
        </View>

        {/* LABEL */}

        <Text
          style={[
            styles.rowLabel,
            {
              color: textColor,
            },
          ]}
        >
          {label}
        </Text>

        {/* TRAILING */}

        <View style={styles.trailing}>
          {trailing}
        </View>
      </View>
    );
  };

  // ==========================================================
  // SETTING SECTION
  // ==========================================================

  const SettingSection = ({
    title,
    children,
  }) => {
    const items = React.Children.toArray(
      children
    );

    return (
      <View style={styles.section}>
        {/* SECTION TITLE */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: mutedColor,
            },
          ]}
        >
          {title}
        </Text>

        {/* SECTION CARD */}

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: cardColor,
              borderColor,
            },
          ]}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item}

              {index < items.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor:
                        borderColor,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  // ==========================================================
  // SWITCH
  // ==========================================================

  const renderSwitch = (
    value,
    onValueChange
  ) => {
    return (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: isDarkMode
            ? "#444444"
            : "#D5D5D5",
          true: "#F6C67B",
        }}
        thumbColor={
          value
            ? COLORS.orange
            : isDarkMode
            ? "#AAAAAA"
            : "#F4F4F4"
        }
        ios_backgroundColor={
          isDarkMode
            ? "#444444"
            : "#D5D5D5"
        }
      />
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor,
          },
        ]}
      >
        <StatusBar
          barStyle={
            isDarkMode
              ? "light-content"
              : "dark-content"
          }
          backgroundColor={backgroundColor}
        />
      </View>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
        },
      ]}
    >
      {/* ======================================================
          STATUS BAR
      ====================================================== */}

      <StatusBar
        barStyle={
          isDarkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={backgroundColor}
      />

      {/* ======================================================
          APP BAR
      ====================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor,
          },
        ]}
      >
        {/* BACK BUTTON */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goBack}
          style={[
            styles.headerBackButton,
            {
              backgroundColor: isDarkMode
                ? COLORS.darkCard
                : "#EEEEF0",
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={textColor}
          />
        </TouchableOpacity>

        {/* TITLE */}

        <Text
          style={[
            styles.headerTitle,
            {
              color: textColor,
            },
          ]}
        >
          Settings
        </Text>

        {/* SPACER */}

        <View style={styles.headerSpacer} />
      </View>

      {/* ======================================================
          BODY
      ====================================================== */}

      <ScrollView
        style={[
          styles.scrollView,
          {
            backgroundColor,
          },
        ]}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================================
            APPEARANCE
        ==================================================== */}

        <SettingSection title="Appearance">
          <SettingRow
            icon={
              isDarkMode
                ? "sunny-outline"
                : "moon-outline"
            }
            label="Dark Mode"
            trailing={renderSwitch(
              isDarkMode,
              handleDarkMode
            )}
          />
        </SettingSection>

        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <SettingSection title="Notifications">
          <SettingRow
            icon="notifications-outline"
            label="Push Notifications"
            trailing={renderSwitch(
              pushNotifications,
              togglePushNotifications
            )}
          />

          <SettingRow
            icon="mail-outline"
            label="Email Updates"
            trailing={renderSwitch(
              emailUpdates,
              toggleEmailUpdates
            )}
          />

          <SettingRow
            icon="megaphone-outline"
            label="Promotional Offers"
            trailing={renderSwitch(
              promotionalOffers,
              togglePromotionalOffers
            )}
          />
        </SettingSection>

        {/* ====================================================
            PRIVACY
        ==================================================== */}

        <SettingSection title="Privacy">
          <SettingRow
            icon="location-outline"
            label="Location Access"
            trailing={renderSwitch(
              locationAccess,
              toggleLocationAccess
            )}
          />

          <SettingRow
            icon="analytics-outline"
            label="Analytics"
            trailing={renderSwitch(
              analytics,
              toggleAnalytics
            )}
          />
        </SettingSection>

        {/* ====================================================
            APP INFO
        ==================================================== */}

        <SettingSection title="App Info">
          <SettingRow
            icon="information-circle-outline"
            label="Version"
            trailing={
              <Text
                style={[
                  styles.versionText,
                  {
                    color: mutedColor,
                  },
                ]}
              >
                1.0.0
              </Text>
            }
          />
        </SettingSection>

        {/* ====================================================
            BOTTOM SPACING
        ==================================================== */}

        <View
          style={styles.bottomSpacing}
        />
      </ScrollView>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // CONTAINER
  // ==========================================================

  container: {
    flex: 1,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 64,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,
  },

  headerBackButton: {
    width: 42,
    height: 42,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,

    marginLeft: 12,

    fontSize: 20,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 42,
  },

  // ==========================================================
  // SCROLL
  // ==========================================================

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // ==========================================================
  // SECTION
  // ==========================================================

  section: {
    marginBottom: 16,
  },

  sectionTitle: {
    marginLeft: 4,
    marginBottom: 8,

    fontSize: 13,
    fontWeight: "600",
  },

  sectionCard: {
    borderRadius: 16,

    borderWidth: 1,

    overflow: "hidden",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,

    elevation: 2,
  },

  // ==========================================================
  // ROW
  // ==========================================================

  row: {
    minHeight: 66,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  // ==========================================================
  // ICON
  // ==========================================================

  iconContainer: {
    width: 36,
    height: 36,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  // ==========================================================
  // LABEL
  // ==========================================================

  rowLabel: {
    flex: 1,

    marginLeft: 14,

    fontSize: 14,
    fontWeight: "500",
  },

  // ==========================================================
  // TRAILING
  // ==========================================================

  trailing: {
    marginLeft: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  versionText: {
    fontSize: 13,
  },

  // ==========================================================
  // DIVIDER
  // ==========================================================

  divider: {
    height: StyleSheet.hairlineWidth,

    marginLeft: 52,
  },

  // ==========================================================
  // BOTTOM
  // ==========================================================

  bottomSpacing: {
    height: 60,
  },
});

export default SettingsScreen;