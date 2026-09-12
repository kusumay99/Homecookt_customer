import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
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

import { useApp } from "./_layout";

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
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {
  pushNotifications: true,
  emailUpdates: false,
  promotionalOffers: true,
  locationAccess: true,
  analytics: false,
};

// ============================================================
// SETTINGS SCREEN
// ============================================================

const SettingsScreen = () => {
  const router = useRouter();

  // ==========================================================
  // GLOBAL THEME
  // ==========================================================

  const {
    isDarkMode,
    colors,
    toggleTheme,
  } = useApp();

  // ==========================================================
  // SETTINGS STATE
  // ==========================================================

  const [pushNotifications, setPushNotifications] =
    useState(DEFAULT_SETTINGS.pushNotifications);

  const [emailUpdates, setEmailUpdates] =
    useState(DEFAULT_SETTINGS.emailUpdates);

  const [promotionalOffers, setPromotionalOffers] =
    useState(DEFAULT_SETTINGS.promotionalOffers);

  const [locationAccess, setLocationAccess] =
    useState(DEFAULT_SETTINGS.locationAccess);

  const [analytics, setAnalytics] =
    useState(DEFAULT_SETTINGS.analytics);

  const [isLoading, setIsLoading] = useState(true);

  const [savingKey, setSavingKey] = useState(null);

  // ==========================================================
  // LOAD SETTINGS
  // ==========================================================

  useEffect(() => {
    loadSettings();
  }, []);

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

      if (savedPush !== null) {
        setPushNotifications(
          savedPush === "true"
        );
      }

      if (savedEmail !== null) {
        setEmailUpdates(
          savedEmail === "true"
        );
      }

      if (savedPromotional !== null) {
        setPromotionalOffers(
          savedPromotional === "true"
        );
      }

      if (savedLocation !== null) {
        setLocationAccess(
          savedLocation === "true"
        );
      }

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
      setSavingKey(key);

      await AsyncStorage.setItem(
        key,
        String(value)
      );
    } catch (error) {
      console.error(
        `SAVE SETTING ERROR [${key}]:`,
        error
      );

      Alert.alert(
        "Error",
        "Unable to save this setting. Please try again."
      );
    } finally {
      setSavingKey(null);
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

  const togglePushNotifications = async (value) => {
    setPushNotifications(value);

    await saveSetting(
      STORAGE_KEYS.pushNotifications,
      value
    );
  };

  // ==========================================================
  // EMAIL UPDATES
  // ==========================================================

  const toggleEmailUpdates = async (value) => {
    setEmailUpdates(value);

    await saveSetting(
      STORAGE_KEYS.emailUpdates,
      value
    );
  };

  // ==========================================================
  // PROMOTIONAL OFFERS
  // ==========================================================

  const togglePromotionalOffers = async (value) => {
    setPromotionalOffers(value);

    await saveSetting(
      STORAGE_KEYS.promotionalOffers,
      value
    );
  };

  // ==========================================================
  // LOCATION ACCESS
  // ==========================================================

  const toggleLocationAccess = async (value) => {
    setLocationAccess(value);

    await saveSetting(
      STORAGE_KEYS.locationAccess,
      value
    );
  };

  // ==========================================================
  // ANALYTICS
  // ==========================================================

  const toggleAnalytics = async (value) => {
    setAnalytics(value);

    await saveSetting(
      STORAGE_KEYS.analytics,
      value
    );
  };

  // ==========================================================
  // RESET SETTINGS
  // ==========================================================

  const resetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to restore all settings to their defaults?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);

              await Promise.all([
                AsyncStorage.setItem(
                  STORAGE_KEYS.pushNotifications,
                  String(
                    DEFAULT_SETTINGS.pushNotifications
                  )
                ),

                AsyncStorage.setItem(
                  STORAGE_KEYS.emailUpdates,
                  String(
                    DEFAULT_SETTINGS.emailUpdates
                  )
                ),

                AsyncStorage.setItem(
                  STORAGE_KEYS.promotionalOffers,
                  String(
                    DEFAULT_SETTINGS.promotionalOffers
                  )
                ),

                AsyncStorage.setItem(
                  STORAGE_KEYS.locationAccess,
                  String(
                    DEFAULT_SETTINGS.locationAccess
                  )
                ),

                AsyncStorage.setItem(
                  STORAGE_KEYS.analytics,
                  String(
                    DEFAULT_SETTINGS.analytics
                  )
                ),
              ]);

              setPushNotifications(
                DEFAULT_SETTINGS.pushNotifications
              );

              setEmailUpdates(
                DEFAULT_SETTINGS.emailUpdates
              );

              setPromotionalOffers(
                DEFAULT_SETTINGS.promotionalOffers
              );

              setLocationAccess(
                DEFAULT_SETTINGS.locationAccess
              );

              setAnalytics(
                DEFAULT_SETTINGS.analytics
              );

              Alert.alert(
                "Settings Reset",
                "All settings have been restored to their default values."
              );
            } catch (error) {
              console.error(
                "RESET SETTINGS ERROR:",
                error
              );

              Alert.alert(
                "Error",
                "Unable to reset settings."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

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
    description,
    trailing,
  }) => {
    return (
      <View style={styles.row}>
        {/* ICON */}

        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                isDarkMode
                  ? "rgba(249,115,22,0.15)"
                  : colors.backgroundSelected,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={colors.orange}
          />
        </View>

        {/* TEXT */}

        <View style={styles.rowContent}>
          <Text
            style={[
              styles.rowLabel,
              {
                color: colors.foreground,
              },
            ]}
          >
            {label}
          </Text>

          {description ? (
            <Text
              style={[
                styles.rowDescription,
                {
                  color:
                    colors.mutedForeground,
                },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>

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
        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.mutedForeground,
            },
          ]}
        >
          {title}
        </Text>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,

              shadowColor:
                colors.shadowColor,
            },
          ]}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item}

              {index <
                items.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor:
                        colors.border,
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
    onValueChange,
    storageKey
  ) => {
    const isSaving =
      savingKey === storageKey;

    return (
      <View style={styles.switchContainer}>
        {isSaving ? (
          <ActivityIndicator
            size="small"
            color={colors.orange}
          />
        ) : (
          <Switch
            value={value}
            onValueChange={
              onValueChange
            }
            disabled={isSaving}
            trackColor={{
              false: isDarkMode
                ? "#444444"
                : "#D5D5D5",

              true: colors.gold,
            }}
            thumbColor={
              value
                ? colors.orange
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
        )}
      </View>
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
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

        <ActivityIndicator
          size="large"
          color={colors.orange}
        />

        <Text
          style={[
            styles.loadingText,
            {
              color:
                colors.mutedForeground,
            },
          ]}
        >
          Loading settings...
        </Text>
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
          backgroundColor:
            colors.background,
        },
      ]}
    >
      {/* STATUS BAR */}

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

      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goBack}
          style={[
            styles.headerBackButton,
            {
              backgroundColor:
                isDarkMode
                  ? "#252525"
                  : "#F1F1F1",
            },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={colors.foreground}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color:
                colors.foreground,
            },
          ]}
        >
          Settings
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      {/* BODY */}

      <ScrollView
        style={[
          styles.scrollView,
          {
            backgroundColor:
              colors.background,
          },
        ]}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
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
            description={
              isDarkMode
                ? "Dark appearance is enabled"
                : "Use a darker appearance"
            }
            trailing={renderSwitch(
              isDarkMode,
              handleDarkMode,
              "theme"
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
            description="Receive order and account notifications"
            trailing={renderSwitch(
              pushNotifications,
              togglePushNotifications,
              STORAGE_KEYS.pushNotifications
            )}
          />

          <SettingRow
            icon="mail-outline"
            label="Email Updates"
            description="Receive updates through email"
            trailing={renderSwitch(
              emailUpdates,
              toggleEmailUpdates,
              STORAGE_KEYS.emailUpdates
            )}
          />

          <SettingRow
            icon="megaphone-outline"
            label="Promotional Offers"
            description="Receive offers and special promotions"
            trailing={renderSwitch(
              promotionalOffers,
              togglePromotionalOffers,
              STORAGE_KEYS.promotionalOffers
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
            description="Allow HomeCookt to use your location"
            trailing={renderSwitch(
              locationAccess,
              toggleLocationAccess,
              STORAGE_KEYS.locationAccess
            )}
          />

          <SettingRow
            icon="analytics-outline"
            label="Analytics"
            description="Help improve HomeCookt with usage data"
            trailing={renderSwitch(
              analytics,
              toggleAnalytics,
              STORAGE_KEYS.analytics
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
            description="Current HomeCookt version"
            trailing={
              <Text
                style={[
                  styles.versionText,
                  {
                    color:
                      colors.mutedForeground,
                  },
                ]}
              >
                1.0.0
              </Text>
            }
          />
        </SettingSection>

        {/* ====================================================
            RESET
        ==================================================== */}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={resetSettings}
          style={[
            styles.resetButton,
            {
              backgroundColor:
                isDarkMode
                  ? "#2A1714"
                  : "#FFF1EC",

              borderColor:
                isDarkMode
                  ? "#5A2920"
                  : "#FFD4C4",
            },
          ]}
        >
          <View
            style={[
              styles.resetIcon,
              {
                backgroundColor:
                  isDarkMode
                    ? "#452019"
                    : "#FFE1D6",
              },
            ]}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color={colors.orange}
            />
          </View>

          <View
            style={styles.resetContent}
          >
            <Text
              style={[
                styles.resetTitle,
                {
                  color:
                    colors.foreground,
                },
              ]}
            >
              Reset Settings
            </Text>

            <Text
              style={[
                styles.resetDescription,
                {
                  color:
                    colors.mutedForeground,
                },
              ]}
            >
              Restore all settings to default
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>

        {/* BOTTOM */}

        <View
          style={styles.bottomSpacing}
        />

        <Text
          style={[
            styles.footerText,
            {
              color:
                colors.mutedForeground,
            },
          ]}
        >
          HomeCookt
        </Text>

        <Text
          style={[
            styles.footerVersion,
            {
              color:
                colors.mutedForeground,
            },
          ]}
        >
          Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
    marginBottom: 18,
  },

  sectionTitle: {
    marginLeft: 4,
    marginBottom: 8,

    fontSize: 13,
    fontWeight: "700",

    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  sectionCard: {
    borderRadius: 16,

    borderWidth: 1,

    overflow: "hidden",

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
    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  // ==========================================================
  // ICON
  // ==========================================================

  iconContainer: {
    width: 38,
    height: 38,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  rowContent: {
    flex: 1,

    marginLeft: 14,
    paddingRight: 10,
  },

  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  rowDescription: {
    marginTop: 3,

    fontSize: 11.5,

    lineHeight: 16,
  },

  // ==========================================================
  // TRAILING
  // ==========================================================

  trailing: {
    marginLeft: 6,

    minWidth: 45,

    alignItems: "center",
    justifyContent: "center",
  },

  switchContainer: {
    minWidth: 45,

    alignItems: "center",
    justifyContent: "center",
  },

  versionText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ==========================================================
  // DIVIDER
  // ==========================================================

  divider: {
    height: StyleSheet.hairlineWidth,

    marginLeft: 68,
  },

  // ==========================================================
  // RESET
  // ==========================================================

  resetButton: {
    minHeight: 70,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,

    borderRadius: 16,

    borderWidth: 1,

    marginTop: 2,
  },

  resetIcon: {
    width: 38,
    height: 38,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",
  },

  resetContent: {
    flex: 1,

    marginLeft: 12,
  },

  resetTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  resetDescription: {
    marginTop: 3,

    fontSize: 11.5,
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  bottomSpacing: {
    height: 45,
  },

  footerText: {
    textAlign: "center",

    fontSize: 13,
    fontWeight: "600",
  },

  footerVersion: {
    textAlign: "center",

    marginTop: 4,

    fontSize: 11,
  },
});

export default SettingsScreen;
