import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "./_layout";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// SCREEN
// ============================================================

export default function ProfileScreen() {
  const { isDarkMode, colors } = useApp();

  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ==========================================================
  // AUTH HELPERS
  // ==========================================================

  const getStoredToken = async () => {
    const keys = [
      "access_token",
      "accessToken",
      "token",
    ];

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);

      if (value) {
        return value;
      }
    }

    return null;
  };

  const clearAuthStorage = async () => {
    const keys = [
      "access_token",
      "accessToken",
      "token",
      "refresh_token",
      "refreshToken",
      "user_id",
      "userId",
      "email",
      "name",
      "image",
      "user",
      "profile",
    ];

    try {
      await AsyncStorage.multiRemove(keys);
    } catch (storageError) {
      console.log(
        "AUTH STORAGE CLEAR ERROR:",
        storageError
      );
    }
  };

  const goToLogin = () => {
    try {
      router.replace("/Login_screen");
    } catch (error) {
      router.replace("/login");
    }
  };

  // ==========================================================
  // PROFILE IMAGE
  // ==========================================================

  const getProfileImage = (profileUser) => {
    if (!profileUser) {
      return null;
    }

    const imageValue =
      profileUser.profile_photo ||
      profileUser.profilePhoto ||
      profileUser.image ||
      profileUser.photo ||
      null;

    if (!imageValue) {
      return null;
    }

    if (
      typeof imageValue === "string" &&
      (imageValue.startsWith("http://") ||
        imageValue.startsWith("https://"))
    ) {
      return imageValue;
    }

    if (typeof imageValue === "string") {
      const cleanPath = imageValue.replace(/^\/+/, "");

      return `${BASE_URL}/${cleanPath}`;
    }

    return null;
  };

  // ==========================================================
  // PROFILE DATA NORMALIZATION
  // ==========================================================

  const normalizeProfile = (profileData) => {
    if (!profileData) {
      return null;
    }

    const profileUser =
      profileData.profile ||
      profileData.data ||
      profileData.user ||
      profileData;

    if (!profileUser) {
      return null;
    }

    const rolesValue =
      profileUser.roles ||
      profileUser.role ||
      profileUser.primary_role ||
      "";

    let roleText = "";

    if (Array.isArray(rolesValue)) {
      roleText = rolesValue
        .map((role) => String(role))
        .filter(Boolean)
        .join(", ");
    } else {
      roleText = String(rolesValue || "");
    }

    roleText = roleText
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (roleText) {
      roleText = roleText
        .split(" ")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(" ");
    }

    const verifiedValue =
      profileUser.is_verified ??
      profileUser.verified ??
      false;

    const isVerified =
      verifiedValue === true ||
      verifiedValue === 1 ||
      verifiedValue === "1" ||
      verifiedValue === "true";

    const addressInfo =
      profileUser.address_info ||
      profileUser.addressInfo ||
      {};

    const orderStats =
      profileUser.order_stats ||
      profileUser.orderStats ||
      {};

    return {
      ...profileUser,

      id:
        profileUser.user_id ||
        profileUser.id ||
        profileUser._id ||
        null,

      name:
        profileUser.name ||
        profileUser.full_name ||
        profileUser.fullName ||
        profileUser.username ||
        "HomeCookt User",

      email:
        profileUser.email ||
        "",

      phone:
        profileUser.phone_number ||
        profileUser.phone ||
        "",

      role:
        roleText || "Customer",

      image:
        getProfileImage(profileUser),

      isVerified,

      dob:
        profileUser.dob ||
        "",

      gender:
        profileUser.gender ||
        "",

      address: {
        address:
          addressInfo.address ||
          addressInfo.street ||
          "",

        city:
          addressInfo.city ||
          "",

        state:
          addressInfo.state ||
          "",

        country:
          addressInfo.country ||
          "",

        pincode:
          addressInfo.pincode ||
          addressInfo.zipcode ||
          addressInfo.zip_code ||
          "",
      },

      orderStats: {
        totalOrders:
          Number(
            orderStats.total_orders ??
              orderStats.totalOrders ??
              0
          ) || 0,

        completedOrders:
          Number(
            orderStats.completed_orders ??
              orderStats.completedOrders ??
              0
          ) || 0,

        cancelledOrders:
          Number(
            orderStats.cancelled_orders ??
              orderStats.cancelledOrders ??
              0
          ) || 0,

        totalSpent:
          Number(
            orderStats.total_spent ??
              orderStats.totalSpent ??
              0
          ) || 0,
      },
    };
  };

  // ==========================================================
  // GET PROFILE
  // ==========================================================

  const getProfile = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setProfileLoading(true);
        }

        setError("");

        const token = await getStoredToken();

        if (!token) {
          setUser(null);
          setProfileLoading(false);
          goToLogin();
          return;
        }

        const response = await fetch(
          `${BASE_URL}/api/v1/users/profile`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          await clearAuthStorage();
          setUser(null);
          goToLogin();
          return;
        }

        const rawText = await response.text();

        let decoded = null;

        try {
          decoded = rawText
            ? JSON.parse(rawText)
            : null;
        } catch (parseError) {
          console.log(
            "PROFILE JSON PARSE ERROR:",
            parseError
          );
        }

        if (!response.ok) {
          throw new Error(
            decoded?.message ||
              decoded?.error ||
              `Failed to load profile (${response.status})`
          );
        }

        const normalized = normalizeProfile(decoded);

        if (!normalized) {
          throw new Error(
            "Profile information could not be loaded."
          );
        }

        setUser(normalized);
      } catch (requestError) {
        console.log(
          "GET PROFILE ERROR:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load profile."
        );
      } finally {
        setProfileLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    getProfile(true);
  }, [getProfile]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await getProfile(false);
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAuthStorage();
            } catch (logoutError) {
              console.log(
                "LOGOUT ERROR:",
                logoutError
              );
            }

            goToLogin();
          },
        },
      ]
    );
  };

  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  const performDeleteAccount = async () => {
    if (deleting) {
      return;
    }

    try {
      setDeleting(true);

      const token = await getStoredToken();

      if (!token) {
        await clearAuthStorage();
        goToLogin();
        return;
      }

      const userId =
        user?.id ||
        user?.user_id ||
        user?._id;

      if (!userId) {
        Alert.alert(
          "Unable to Delete",
          "User ID was not found. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/v1/users/deleteuser/${userId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rawText = await response.text();

      let decoded = null;

      try {
        decoded = rawText
          ? JSON.parse(rawText)
          : null;
      } catch (parseError) {
        console.log(
          "DELETE RESPONSE PARSE ERROR:",
          parseError
        );
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        await clearAuthStorage();
        goToLogin();
        return;
      }

      if (
        response.status !== 200 &&
        response.status !== 201 &&
        response.status !== 202 &&
        response.status !== 204
      ) {
        throw new Error(
          decoded?.message ||
            decoded?.error ||
            "Failed to delete account."
        );
      }

      await clearAuthStorage();

      Alert.alert(
        "Account Deleted",
        "Your HomeCookt account has been deleted successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              goToLogin();
            },
          },
        ]
      );
    } catch (deleteError) {
      console.log(
        "DELETE ACCOUNT ERROR:",
        deleteError
      );

      Alert.alert(
        "Delete Failed",
        deleteError?.message ||
          "Unable to delete your account. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDeleteAccount,
        },
      ]
    );
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigateTo = (
    screen,
    params = {}
  ) => {
    try {
      router.push({
        pathname: `/${screen}`,
        params: {
          user: JSON.stringify(
            params?.user || user || {}
          ),
        },
      });
    } catch (navigationError) {
      console.log(
        "NAVIGATION ERROR:",
        navigationError
      );

      try {
        router.push(`/${screen}`);
      } catch (fallbackError) {
        console.log(
          "FALLBACK NAVIGATION ERROR:",
          fallbackError
        );
      }
    }
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  const formatGender = (gender) => {
    if (!gender) {
      return "";
    }

    return String(gender)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
      )
      .join(" ");
  };

  const formatCurrency = (value) => {
    const numericValue = Number(value || 0);

    return `₹${numericValue.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const getAddressText = () => {
    const address = user?.address;

    if (!address) {
      return "";
    }

    return [
      address.address,
      address.city,
      address.state,
      address.country,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  // ==========================================================
  // LOCAL THEME ALIAS
  // ==========================================================

  const theme = {
    background: colors.background,
    card: colors.card,
    foreground: colors.foreground,
    bodyText: colors.textSecondary,
    muted: colors.mutedForeground,
    border: colors.border,
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (profileLoading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          {
            backgroundColor:
              colors.background,
          },
        ]}
        edges={["top", "bottom"]}
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
              color: colors.foreground,
            },
          ]}
        >
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !user) {
    return (
      <SafeAreaView
        style={[
          styles.errorContainer,
          {
            backgroundColor:
              colors.background,
          },
        ]}
        edges={["top", "bottom"]}
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

        <View
          style={[
            styles.errorIconContainer,
            {
              backgroundColor:
                colors.backgroundSelected,
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={48}
            color={colors.orange}
          />
        </View>

        <Text
          style={[
            styles.errorTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          Unable to Load Profile
        </Text>

        <Text
          style={[
            styles.errorMessage,
            {
              color: colors.mutedForeground,
            },
          ]}
        >
          {error}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.retryButton,
            {
              backgroundColor:
                colors.orange,
            },
          ]}
          onPress={() =>
            getProfile(true)
          }
        >
          <Ionicons
            name="refresh"
            size={19}
            color={colors.white}
          />

          <Text
            style={[
              styles.retryButtonText,
              {
                color: colors.white,
              },
            ]}
          >
            Retry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.loginButton}
          onPress={goToLogin}
        >
          <Text
            style={[
              styles.loginButtonText,
              {
                color: colors.orange,
              },
            ]}
          >
            Go to Login
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // STAT CARD
  // ==========================================================

  const StatCard = ({
    icon,
    label,
    value,
    iconColor,
  }) => {
    return (
      <View
        style={[
          styles.statCard,
          {
            backgroundColor:
              theme.card,
            borderColor:
              theme.border,
            shadowColor:
              colors.shadowColor,
          },
        ]}
      >
        <View
          style={[
            styles.statIconContainer,
            {
              backgroundColor:
                colors.backgroundSelected,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={
              iconColor ||
              colors.orange
            }
          />
        </View>

        <Text
          style={[
            styles.statValue,
            {
              color:
                theme.foreground,
            },
          ]}
        >
          {value}
        </Text>

        <Text
          style={[
            styles.statLabel,
            {
              color:
                theme.muted,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    );
  };

  // ==========================================================
  // MENU CARD
  // ==========================================================

  const MenuCard = ({
    icon,
    title,
    subtitle,
    onPress,
    color,
    danger = false,
  }) => {
    const itemColor =
      color ||
      (danger
        ? colors.destructive
        : colors.orange);

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={onPress}
        style={[
          styles.menuCard,
          {
            backgroundColor:
              theme.card,
            borderColor:
              theme.border,
            shadowColor:
              colors.shadowColor,
          },
        ]}
      >
        <View
          style={[
            styles.menuIconContainer,
            {
              backgroundColor:
                danger
                  ? "rgba(239,68,68,0.10)"
                  : "rgba(249,115,22,0.10)",
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={21}
            color={itemColor}
          />
        </View>

        <View style={styles.menuTextContainer}>
          <Text
            style={[
              styles.menuTitle,
              {
                color:
                  danger
                    ? colors.destructive
                    : theme.foreground,
              },
            ]}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.menuSubtitle,
                {
                  color:
                    theme.muted,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // MENU TILE
  // ==========================================================

  const MenuTile = ({
    icon,
    title,
    subtitle,
    onPress,
    color,
  }) => {
    const itemColor =
      color || colors.orange;

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={onPress}
        style={[
          styles.menuTile,
          {
            backgroundColor:
              theme.card,
            borderColor:
              theme.border,
            shadowColor:
              colors.shadowColor,
          },
        ]}
      >
        <View
          style={[
            styles.menuTileIcon,
            {
              backgroundColor:
                colors.backgroundSelected,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={21}
            color={itemColor}
          />
        </View>

        <Text
          style={[
            styles.menuTileTitle,
            {
              color:
                theme.foreground,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.menuTileSubtitle,
              {
                color:
                  theme.muted,
              },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  const SectionTitle = ({
    title,
    icon,
  }) => {
    return (
      <View
        style={
          styles.sectionTitleContainer
        }
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={colors.orange}
            style={
              styles.sectionTitleIcon
            }
          />
        ) : null}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                theme.foreground,
            },
          ]}
        >
          {title}
        </Text>
      </View>
    );
  };

  // ==========================================================
  // INFO ROW
  // ==========================================================

  const InfoRow = ({
    icon,
    label,
    value,
  }) => {
    if (!value) {
      return null;
    }

    return (
      <View
        style={[
          styles.infoRow,
          {
            borderBottomColor:
              theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.infoIconContainer,
            {
              backgroundColor:
                colors.backgroundSelected,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={colors.orange}
          />
        </View>

        <View
          style={styles.infoContent}
        >
          <Text
            style={[
              styles.infoLabel,
              {
                color:
                  theme.muted,
              },
            ]}
          >
            {label}
          </Text>

          <Text
            style={[
              styles.infoValue,
              {
                color:
                  theme.foreground,
              },
            ]}
          >
            {value}
          </Text>
        </View>
      </View>
    );
  };

  // ==========================================================
  // MAIN PROFILE
  // ==========================================================

  const screenWidth =
    Dimensions.get("window").width;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
      edges={["top"]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={
          colors.orange
        }
      />

      <ScrollView
        style={[
          styles.scrollView,
          {
            backgroundColor:
              theme.background,
          },
        ]}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.orange}
            colors={[colors.orange]}
          />
        }
      >
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <LinearGradient
          colors={[
            colors.orange,
            colors.gold,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.header}
        >
          <View
            style={styles.headerTop}
          >
            <Text
              style={[
                styles.headerTitle,
                {
                  color:
                    colors.white,
                },
              ]}
            >
              Profile
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigateTo(
                  "Settings_screen"
                )
              }
              style={[
                styles.settingsButton,
                {
                  backgroundColor:
                    "rgba(255,255,255,0.20)",
                },
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>

          <View
            style={styles.profileHeader}
          >
            <View
              style={[
                styles.profileImageWrapper,
                {
                  borderColor:
                    "rgba(255,255,255,0.75)",
                },
              ]}
            >
              {user?.image ? (
                <Image
                  source={{
                    uri: user.image,
                  }}
                  style={
                    styles.profileImage
                  }
                />
              ) : (
                <View
                  style={[
                    styles.profileImagePlaceholder,
                    {
                      backgroundColor:
                        colors.white,
                    },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={52}
                    color={
                      colors.foreground
                    }
                  />
                </View>
              )}
            </View>

            <View
              style={[
                styles.profileNameContainer,
                {
                  maxWidth:
                    screenWidth - 120,
                },
              ]}
            >
              <View
                style={
                  styles.nameRow
                }
              >
                <Text
                  style={[
                    styles.profileName,
                    {
                      color:
                        colors.white,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {user?.name ||
                    "HomeCookt User"}
                </Text>

                {user?.isVerified ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={
                      colors.white
                    }
                    style={
                      styles.verifiedIcon
                    }
                  />
                ) : null}
              </View>

              {user?.email ? (
                <Text
                  style={[
                    styles.profileEmail,
                    {
                      color:
                        "rgba(255,255,255,0.90)",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
              ) : null}

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      "rgba(255,255,255,0.92)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color:
                        colors.orange,
                    },
                  ]}
                >
                  {user?.role ||
                    "Customer"}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.editProfileButton,
              {
                backgroundColor:
                  colors.white,
              },
            ]}
            onPress={() =>
              navigateTo(
                "Update_profile_screen",
                {
                  user,
                }
              )
            }
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.orange}
            />

            <Text
              style={[
                styles.editProfileText,
                {
                  color:
                    colors.orange,
                },
              ]}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ================================================== */}
        {/* QUICK STATS */}
        {/* ================================================== */}

        <View
          style={styles.statsContainer}
        >
          <StatCard
            icon="bag-check-outline"
            label="Orders"
            value={
              user?.orderStats
                ?.totalOrders ?? 0
            }
            iconColor={
              colors.orange
            }
          />

          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={
              user?.orderStats
                ?.completedOrders ?? 0
            }
            iconColor={
              colors.greenDot
            }
          />

          <StatCard
            icon="close-circle-outline"
            label="Cancelled"
            value={
              user?.orderStats
                ?.cancelledOrders ?? 0
            }
            iconColor={
              colors.destructive
            }
          />
        </View>

        {/* ================================================== */}
        {/* ACCOUNT INFORMATION */}
        {/* ================================================== */}

        <View
          style={styles.section}
        >
          <SectionTitle
            title="Account Information"
            icon="person-outline"
          />

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor:
                  theme.card,
                borderColor:
                  theme.border,
                shadowColor:
                  colors.shadowColor,
              },
            ]}
          >
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user?.email}
            />

            <InfoRow
              icon="call-outline"
              label="Phone"
              value={user?.phone}
            />

            <InfoRow
              icon="calendar-outline"
              label="Date of Birth"
              value={user?.dob}
            />

            <InfoRow
              icon="person-outline"
              label="Gender"
              value={formatGender(
                user?.gender
              )}
            />

            <InfoRow
              icon="location-outline"
              label="Address"
              value={getAddressText()}
            />
          </View>
        </View>

        {/* ================================================== */}
        {/* ORDER SUMMARY */}
        {/* ================================================== */}

        <View
          style={styles.section}
        >
          <SectionTitle
            title="Order Summary"
            icon="receipt-outline"
          />

          <View
            style={[
              styles.spendingCard,
              {
                backgroundColor:
                  theme.card,
                borderColor:
                  theme.border,
                shadowColor:
                  colors.shadowColor,
              },
            ]}
          >
            <View
              style={
                styles.spendingIcon
              }
            >
              <Ionicons
                name="wallet-outline"
                size={25}
                color={colors.orange}
              />
            </View>

            <View
              style={
                styles.spendingContent
              }
            >
              <Text
                style={[
                  styles.spendingLabel,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                Total Spent
              </Text>

              <Text
                style={[
                  styles.spendingValue,
                  {
                    color:
                      theme.foreground,
                  },
                ]}
              >
                {formatCurrency(
                  user?.orderStats
                    ?.totalSpent
                )}
              </Text>
            </View>

            <Ionicons
              name="trending-up-outline"
              size={24}
              color={
                colors.greenDot
              }
            />
          </View>
        </View>

        {/* ================================================== */}
        {/* SETTINGS / MENU */}
        {/* ================================================== */}

        <View
          style={styles.section}
        >
          <SectionTitle
            title="Account & Support"
            icon="grid-outline"
          />

          <View
            style={
              styles.menuGrid
            }
          >
            <MenuTile
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get assistance"
              onPress={() =>
                navigateTo(
                  "Help_support_screen"
                )
              }
              color={
                colors.orange
              }
            />

            <MenuTile
              icon="shield-checkmark-outline"
              title="Privacy"
              subtitle="Privacy policy"
              onPress={() =>
                navigateTo(
                  "Privacy_policy_screen"
                )
              }
              color={
                colors.greenDot
              }
            />
          </View>
        </View>

        {/* ================================================== */}
        {/* LOGOUT */}
        {/* ================================================== */}

        <View
          style={styles.section}
        >
          <MenuCard
            icon="log-out-outline"
            title="Logout"
            subtitle="Sign out of your account"
            color={
              colors.orange
            }
            onPress={
              handleLogout
            }
          />
        </View>

        {/* ================================================== */}
        {/* DELETE ACCOUNT */}
        {/* ================================================== */}

        <View
          style={[
            styles.deleteSection,
            {
              borderTopColor:
                theme.border,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={
              handleDeleteAccount
            }
            disabled={deleting}
            style={[
              styles.deleteButton,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  "rgba(239,68,68,0.30)",
                opacity:
                  deleting ? 0.6 : 1,
              },
            ]}
          >
            {deleting ? (
              <ActivityIndicator
                size="small"
                color={
                  colors.destructive
                }
              />
            ) : (
              <Ionicons
                name="trash-outline"
                size={19}
                color={
                  colors.destructive
                }
              />
            )}

            <Text
              style={[
                styles.deleteButtonText,
                {
                  color:
                    colors.destructive,
                },
              ]}
            >
              {deleting
                ? "Deleting Account..."
                : "Delete Account"}
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.deleteWarning,
              {
                color:
                  theme.muted,
              },
            ]}
          >
            Deleting your account is permanent
            and cannot be undone.
          </Text>
        </View>

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <View
          style={styles.footer}
        >
          <Text
            style={[
              styles.footerText,
              {
                color:
                  theme.muted,
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
                  theme.muted,
              },
            ]}
          >
            Your favorite home-cooked meals
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "600",
  },

  // ==========================================================
  // ERROR
  // ==========================================================

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  errorIconContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  errorTitle: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  errorMessage: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 24,
  },

  retryButton: {
    minWidth: 130,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  retryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  loginButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  loginButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  profileImageWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  profileImage: {
    width: "100%",
    height: "100%",
  },

  profileImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  profileNameContainer: {
    marginLeft: 16,
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileName: {
    fontSize: 22,
    fontWeight: "800",
    flexShrink: 1,
  },

  verifiedIcon: {
    marginLeft: 6,
  },

  profileEmail: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "500",
  },

  roleBadge: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
  },

  roleBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  editProfileButton: {
    height: 45,
    borderRadius: 23,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editProfileText: {
    fontSize: 14,
    fontWeight: "800",
  },

  // ==========================================================
  // STATS
  // ==========================================================

  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    marginTop: 16,
    gap: 10,
  },

  statCard: {
    flex: 1,
    minHeight: 116,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },

  // ==========================================================
  // SECTIONS
  // ==========================================================

  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },

  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  sectionTitleIcon: {
    marginRight: 7,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  // ==========================================================
  // INFO CARD
  // ==========================================================

  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  infoRow: {
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },

  infoIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  // ==========================================================
  // SPENDING
  // ==========================================================

  spendingCard: {
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  spendingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(249,115,22,0.10)",
  },

  spendingContent: {
    flex: 1,
    marginLeft: 13,
  },

  spendingLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  spendingValue: {
    fontSize: 21,
    fontWeight: "800",
    marginTop: 2,
  },

  // ==========================================================
  // MENU GRID
  // ==========================================================

  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  menuTile: {
    width: "48%",
    minHeight: 118,
    borderRadius: 17,
    borderWidth: 1,
    padding: 13,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  menuTileIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  menuTileTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 11,
  },

  menuTileSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 3,
  },

  // ==========================================================
  // MENU CARD
  // ==========================================================

  menuCard: {
    minHeight: 72,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  menuIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
  },

  menuTextContainer: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  menuSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 3,
  },

  // ==========================================================
  // DELETE
  // ==========================================================

  deleteSection: {
    marginTop: 30,
    marginHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    alignItems: "center",
  },

  deleteButton: {
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  deleteButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },

  deleteWarning: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 9,
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 8,
  },

  footerText: {
    fontSize: 14,
    fontWeight: "800",
  },

  footerVersion: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
});