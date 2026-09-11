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

// ============================================================
// BASE URL
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  orange: "#F97316",
  gold: "#FFC107",

  background: "#F7F8FA",
  darkBackground: "#121212",

  card: "#FFFFFF",
  darkCard: "#1E1E1E",

  foreground: "#1F2937",
  darkForeground: "#F5F5F5",

  bodyText: "#374151",
  darkBodyText: "#D1D5DB",

  mutedForeground: "#6B7280",

  red: "#EF4444",

  white: "#FFFFFF",
  black: "#000000",

  border: "#E5E7EB",
};

// ============================================================
// SCREEN
// ============================================================

const ProfileScreen = () => {
  // ==========================================================
  // STATE
  // ==========================================================

  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [profileError, setProfileError] = useState("");

  // ==========================================================
  // DARK MODE
  // ==========================================================

  const isDark = false;

  // ==========================================================
  // THEME
  // ==========================================================

  const theme = {
    background: isDark
      ? COLORS.darkBackground
      : COLORS.background,

    card: isDark
      ? COLORS.darkCard
      : COLORS.card,

    foreground: isDark
      ? COLORS.darkForeground
      : COLORS.foreground,

    bodyText: isDark
      ? COLORS.darkBodyText
      : COLORS.bodyText,

    muted: isDark
      ? "#9CA3AF"
      : COLORS.mutedForeground,

    border: isDark
      ? "#333333"
      : COLORS.border,
  };

  // ==========================================================
  // API ERROR MESSAGE
  // ==========================================================

  const getApiErrorMessage = (data, fallback) => {
    if (!data) {
      return fallback;
    }

    if (typeof data === "string") {
      return data;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (typeof item?.msg === "string") {
            return item.msg;
          }

          return JSON.stringify(item);
        })
        .join(", ");
    }

    if (
      data?.detail &&
      typeof data.detail === "object"
    ) {
      return (
        data.detail?.message ||
        data.detail?.msg ||
        JSON.stringify(data.detail)
      );
    }

    if (typeof data?.error === "string") {
      return data.error;
    }

    return fallback;
  };

  // ==========================================================
  // GET STORED TOKEN
  // ==========================================================

  const getStoredToken = async () => {
    try {
      const accessToken =
        await AsyncStorage.getItem("access_token");

      if (accessToken) {
        return accessToken;
      }

      const accessToken2 =
        await AsyncStorage.getItem("accessToken");

      if (accessToken2) {
        return accessToken2;
      }

      const token =
        await AsyncStorage.getItem("token");

      if (token) {
        return token;
      }

      return null;
    } catch (error) {
      console.log(
        "GET TOKEN ERROR =>",
        error
      );

      return null;
    }
  };

  // ==========================================================
  // CLEAR AUTH STORAGE
  // ==========================================================

  const clearAuthStorage = async () => {
    try {
      console.log(
        "CLEARING AUTH STORAGE..."
      );

      await AsyncStorage.multiRemove([
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
      ]);

      console.log(
        "AUTH STORAGE CLEARED"
      );

      // Verify important keys
      const accessToken =
        await AsyncStorage.getItem(
          "access_token"
        );

      const refreshToken =
        await AsyncStorage.getItem(
          "refresh_token"
        );

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      console.log(
        "ACCESS TOKEN AFTER CLEAR =>",
        accessToken
      );

      console.log(
        "REFRESH TOKEN AFTER CLEAR =>",
        refreshToken
      );

      console.log(
        "TOKEN AFTER CLEAR =>",
        token
      );
    } catch (error) {
      console.log(
        "CLEAR AUTH STORAGE ERROR =>",
        error
      );

      throw error;
    }
  };

  // ==========================================================
  // GO TO LOGIN
  // ==========================================================

  const goToLogin = () => {
    console.log(
      "================================="
    );

    console.log(
      "GOING TO LOGIN SCREEN"
    );

    console.log(
      "LOGIN ROUTE => /Login_screen"
    );

    console.log(
      "================================="
    );

    try {
      router.replace("/Login_screen");

      console.log(
        "LOGIN NAVIGATION SENT"
      );
    } catch (error) {
      console.log(
        "LOGIN NAVIGATION ERROR =>",
        error
      );

      try {
        router.replace("/login");

        console.log(
          "FALLBACK LOGIN NAVIGATION SENT"
        );
      } catch (secondError) {
        console.log(
          "FALLBACK LOGIN NAVIGATION ERROR =>",
          secondError
        );

        Alert.alert(
          "Navigation Error",
          "Unable to open the login screen."
        );
      }
    }
  };

  // ==========================================================
  // GET PROFILE
  // ==========================================================

  const getProfile = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        setProfileError("");

        console.log(
          "================================="
        );

        console.log(
          "PROFILE REQUEST STARTED"
        );

        const token =
          await getStoredToken();

        console.log(
          "TOKEN EXISTS:",
          !!token
        );

        console.log(
          "================================="
        );

        // ------------------------------------------------------
        // NO TOKEN
        // ------------------------------------------------------

        if (!token) {
          console.log(
            "NO ACCESS TOKEN FOUND"
          );

          setUser(null);

          setProfileError(
            "Your session has expired. Please login again."
          );

          return;
        }

        // ------------------------------------------------------
        // PROFILE API
        // ------------------------------------------------------

        const response = await fetch(
          `${BASE_URL}/api/v1/users/profile`,
          {
            method: "GET",

            headers: {
              Accept: "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        console.log(
          "PROFILE STATUS =>",
          response.status
        );

        const responseText =
          await response.text();

        console.log(
          "PROFILE BODY =>",
          responseText
        );

        // ------------------------------------------------------
        // PARSE RESPONSE
        // ------------------------------------------------------

        let decoded = {};

        try {
          decoded = responseText
            ? JSON.parse(responseText)
            : {};
        } catch (error) {
          console.log(
            "PROFILE JSON ERROR =>",
            error
          );

          setUser(null);

          setProfileError(
            "Invalid response received from the server."
          );

          return;
        }

        // ------------------------------------------------------
        // AUTH ERROR
        // ------------------------------------------------------

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          console.log(
            "PROFILE AUTH FAILED =>",
            response.status
          );

          setUser(null);

          setProfileError(
            "Your session has expired. Please login again."
          );

          return;
        }

        // ------------------------------------------------------
        // OTHER ERROR
        // ------------------------------------------------------

        if (!response.ok) {
          const message =
            getApiErrorMessage(
              decoded,
              "Unable to load profile."
            );

          setUser(null);

          setProfileError(message);

          return;
        }

        // ------------------------------------------------------
        // EXTRACT PROFILE
        // ------------------------------------------------------

        let profileData = null;

        if (
          decoded &&
          typeof decoded === "object" &&
          decoded.profile &&
          typeof decoded.profile === "object"
        ) {
          profileData = decoded.profile;
        } else if (
          decoded &&
          typeof decoded === "object" &&
          decoded.data &&
          typeof decoded.data === "object"
        ) {
          profileData = decoded.data;
        } else if (
          decoded &&
          typeof decoded === "object"
        ) {
          profileData = decoded;
        }

        console.log(
          "PROFILE DATA =>",
          profileData
        );

        // ------------------------------------------------------
        // PROFILE NOT FOUND
        // ------------------------------------------------------

        if (
          !profileData ||
          typeof profileData !== "object"
        ) {
          setUser(null);

          setProfileError(
            "Profile information was not found."
          );

          return;
        }

        // ------------------------------------------------------
        // SAVE PROFILE
        // ------------------------------------------------------

        setUser(profileData);

        console.log(
          "PROFILE STATE UPDATED"
        );

        console.log(
          "PROFILE NAME =>",
          profileData?.name
        );

        console.log(
          "PROFILE EMAIL =>",
          profileData?.email
        );

        console.log(
          "PROFILE PHOTO =>",
          profileData?.profile_photo
        );
      } catch (error) {
        console.log(
          "PROFILE ERROR =>",
          error
        );

        setUser(null);

        setProfileError(
          error?.message ||
            "Unable to load your profile. Please try again."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    getProfile(true);
  }, [getProfile]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    await getProfile(false);
  };

  // ==========================================================
  // PROFILE IMAGE
  // ==========================================================

  const getProfileImage = () => {
    if (!user) {
      return null;
    }

    const photo =
      user?.profile_photo ||
      user?.profilePhoto ||
      user?.image ||
      user?.photo ||
      null;

    if (!photo) {
      return null;
    }

    const imageUrl =
      String(photo).trim();

    if (!imageUrl) {
      return null;
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    const cleanPath =
      imageUrl.replace(/^\/+/, "");

    return `${BASE_URL}/${cleanPath}`;
  };

  // ==========================================================
  // USER NAME
  // ==========================================================

  const getUserName = () => {
    return (
      user?.name ||
      user?.full_name ||
      user?.fullName ||
      user?.username ||
      "Guest User"
    );
  };

  // ==========================================================
  // EMAIL
  // ==========================================================

  const getEmail = () => {
    return (
      user?.email ||
      "No email available"
    );
  };

  // ==========================================================
  // PHONE
  // ==========================================================

  const getPhone = () => {
    return (
      user?.phone_number ||
      user?.phone ||
      "Not provided"
    );
  };

  // ==========================================================
  // ROLE
  // ==========================================================

  const getRole = () => {
    const roles =
      user?.roles ||
      user?.role ||
      user?.primary_role;

    if (Array.isArray(roles)) {
      if (roles.length === 0) {
        return "-";
      }

      return roles
        .map((item) =>
          String(item)
            .replace(/_/g, " ")
            .replace(
              /\b\w/g,
              (char) =>
                char.toUpperCase()
            )
        )
        .join(", ");
    }

    if (roles) {
      return String(roles)
        .replace(/_/g, " ")
        .replace(
          /\b\w/g,
          (char) =>
            char.toUpperCase()
        );
    }

    return "-";
  };

  // ==========================================================
  // USER ID
  // ==========================================================

  const getUserId = () => {
    return (
      user?.user_id ||
      user?.id ||
      user?._id ||
      "-"
    );
  };

  // ==========================================================
  // VERIFIED
  // ==========================================================

  const isVerified =
    user?.is_verified === true ||
    user?.is_verified === 1 ||
    user?.is_verified === "1" ||
    user?.is_verified === "true" ||
    user?.verified === true;

  // ==========================================================
  // ADDRESS
  // ==========================================================

  const addressInfo =
    user?.address_info || {};

  // ==========================================================
  // DOB
  // ==========================================================

  const getDOB = () => {
    return (
      user?.dob ||
      "Not provided"
    );
  };

  // ==========================================================
  // GENDER
  // ==========================================================

  const getGender = () => {
    if (!user?.gender) {
      return "Not provided";
    }

    return String(user.gender)
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  };

  // ==========================================================
  // ORDER STATS
  // ==========================================================

  const orderStats =
    user?.order_stats || {};

  const totalOrders =
    orderStats?.total_orders ?? 0;

  const completedOrders =
    orderStats?.completed_orders ?? 0;

  const cancelledOrders =
    orderStats?.cancelled_orders ?? 0;

  const totalSpent =
    orderStats?.total_spent ?? 0;

  const currency =
    orderStats?.currency || "GBP";

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      console.log(
        "================================="
      );

      console.log(
        "LOGOUT STARTED"
      );

      console.log(
        "================================="
      );

      // ------------------------------------------------------
      // CLEAR AUTH STORAGE
      // ------------------------------------------------------

      await clearAuthStorage();

      // ------------------------------------------------------
      // CLEAR PROFILE STATE
      // ------------------------------------------------------

      setUser(null);

      console.log(
        "PROFILE STATE CLEARED"
      );

      console.log(
        "================================="
      );

      console.log(
        "NAVIGATING TO LOGIN SCREEN"
      );

      console.log(
        "================================="
      );

      // ------------------------------------------------------
      // DIRECT NAVIGATION
      // ------------------------------------------------------

      router.replace("/Login_screen");

      console.log(
        "LOGIN NAVIGATION SENT"
      );
    } catch (error) {
      console.log(
        "LOGOUT ERROR =>",
        error
      );

      setIsLoggingOut(false);

      Alert.alert(
        "Logout Error",
        error?.message ||
          "Unable to logout. Please try again."
      );
    }
  };

  // ==========================================================
  // LOGOUT DIALOG
  // ==========================================================

  const showLogoutDialog = () => {
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
          onPress: logout,
        },
      ],
      {
        cancelable: true,
      }
    );
  };

  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  const deleteAccount = async () => {
    if (isDeleting) {
      return;
    }

    try {
      console.log(
        "================================="
      );

      console.log(
        "DELETE ACCOUNT STARTED"
      );

      console.log(
        "================================="
      );

      // ------------------------------------------------------
      // TOKEN
      // ------------------------------------------------------

      const token =
        await getStoredToken();

      console.log(
        "DELETE TOKEN EXISTS =>",
        !!token
      );

      // ------------------------------------------------------
      // USER ID
      // ------------------------------------------------------

      const userId =
        user?.user_id ||
        user?.id ||
        user?._id;

      console.log(
        "DELETE USER ID =>",
        userId
      );

      // ------------------------------------------------------
      // TOKEN VALIDATION
      // ------------------------------------------------------

      if (!token) {
        Alert.alert(
          "Authentication Failed",
          "Access token not found. Please login again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await clearAuthStorage();
                goToLogin();
              },
            },
          ]
        );

        return;
      }

      // ------------------------------------------------------
      // USER ID VALIDATION
      // ------------------------------------------------------

      if (!userId) {
        Alert.alert(
          "Delete Account",
          "Unable to identify your account."
        );

        return;
      }

      setIsDeleting(true);

      // ------------------------------------------------------
      // DELETE URL
      // ------------------------------------------------------

      const deleteUrl =
        `${BASE_URL}/api/v1/users/deleteuser/${userId}`;

      console.log(
        "DELETE URL =>",
        deleteUrl
      );

      // ------------------------------------------------------
      // DELETE REQUEST
      // ------------------------------------------------------

      const response =
        await fetch(deleteUrl, {
          method: "DELETE",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        });

      console.log(
        "DELETE STATUS =>",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "DELETE RESPONSE =>",
        responseText
      );

      // ------------------------------------------------------
      // PARSE RESPONSE
      // ------------------------------------------------------

      let data = {};

      if (responseText) {
        try {
          data =
            JSON.parse(responseText);
        } catch (error) {
          console.log(
            "DELETE RESPONSE IS NOT JSON"
          );

          data = {
            message: responseText,
          };
        }
      }

      console.log(
        "DELETE DECODED =>",
        data
      );

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      if (
        response.status === 200 ||
        response.status === 201 ||
        response.status === 202 ||
        response.status === 204
      ) {
        console.log(
          "ACCOUNT DELETE SUCCESS"
        );

        // ----------------------------------------------------
        // CLEAR AUTH DATA
        // ----------------------------------------------------

        await clearAuthStorage();

        // ----------------------------------------------------
        // CLEAR PROFILE
        // ----------------------------------------------------

        setUser(null);

        setIsDeleting(false);

        console.log(
          "ACCOUNT DATA CLEARED"
        );

        // ----------------------------------------------------
        // SUCCESS MESSAGE
        // ----------------------------------------------------

        Alert.alert(
          "Account Deleted",
          "Your account has been deleted successfully.",
          [
            {
              text: "OK",

              onPress: () => {
                console.log(
                  "REDIRECTING AFTER DELETE"
                );

                goToLogin();
              },
            },
          ],
          {
            cancelable: false,
          }
        );

        return;
      }

      // ------------------------------------------------------
      // AUTH ERROR
      // ------------------------------------------------------

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setIsDeleting(false);

        Alert.alert(
          "Authentication Failed",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",

              onPress: async () => {
                await clearAuthStorage();

                goToLogin();
              },
            },
          ],
          {
            cancelable: false,
          }
        );

        return;
      }

      // ------------------------------------------------------
      // DELETE ERROR
      // ------------------------------------------------------

      const message =
        getApiErrorMessage(
          data,
          `Failed to delete account. Server returned ${response.status}.`
        );

      console.log(
        "DELETE FAILED =>",
        message
      );

      setIsDeleting(false);

      Alert.alert(
        "Delete Account",
        String(message)
      );
    } catch (error) {
      console.log(
        "DELETE ACCOUNT ERROR =>",
        error
      );

      setIsDeleting(false);

      Alert.alert(
        "Delete Account Error",
        error?.message ||
          "Something went wrong while deleting your account."
      );
    }
  };

  // ==========================================================
  // DELETE DIALOG
  // ==========================================================

  const showDeleteAccountDialog = () => {
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
          onPress: deleteAccount,
        },
      ],
      {
        cancelable: true,
      }
    );
  };

  // ==========================================================
  // SAFE NAVIGATION
  // ==========================================================

  const navigateTo = (
    screen,
    params = undefined
  ) => {
    try {
      console.log(
        "NAVIGATING TO =>",
        screen
      );

      if (params !== undefined) {
        router.push({
          pathname: `/${screen}`,

          params: {
            user:
              JSON.stringify(params),
          },
        });
      } else {
        router.push(`/${screen}`);
      }
    } catch (error) {
      console.log(
        `Navigation error for ${screen} =>`,
        error
      );

      Alert.alert(
        "Navigation Error",
        `Unable to open ${screen}.`
      );
    }
  };

  // ==========================================================
  // SETTINGS
  // ==========================================================

  const openSettings = () => {
    navigateTo("Settings_screen");
  };

  // ==========================================================
  // EDIT PROFILE
  // ==========================================================

  const openEditProfile = () => {
    navigateTo(
      "Update_profile_screen",
      user
    );
  };

  // ==========================================================
  // HELP SUPPORT
  // ==========================================================

  const openHelpSupport = () => {
    navigateTo(
      "Help_support_screen"
    );
  };

  // ==========================================================
  // PRIVACY POLICY
  // ==========================================================

  const openPrivacyPolicy = () => {
    navigateTo(
      "Privacy_policy_screen"
    );
  };

  // ==========================================================
  // STAT CARD
  // ==========================================================

  const StatCard = ({
    icon,
    value,
    label,
  }) => {
    return (
      <View
        style={[
          styles.statCard,
          {
            backgroundColor:
              theme.card,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={COLORS.orange}
        />

        <Text
          numberOfLines={2}
          style={[
            styles.statValue,
            {
              color:
                theme.foreground,
            },
          ]}
        >
          {String(value)}
        </Text>

        <Text
          numberOfLines={1}
          style={[
            styles.statLabel,
            {
              color:
                theme.bodyText,
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
    children,
  }) => {
    return (
      <View
        style={[
          styles.menuCard,
          {
            backgroundColor:
              theme.card,
          },
        ]}
      >
        {children}
      </View>
    );
  };

  // ==========================================================
  // MENU TILE
  // ==========================================================

  const MenuTile = ({
    icon,
    title,
    onPress,
    color,
  }) => {
    const itemColor =
      color || COLORS.orange;

    const isLogout =
      title === "Logout";

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={
          isLogout && isLoggingOut
        }
        style={styles.menuTile}
      >
        <View
          style={[
            styles.menuIconContainer,
            {
              backgroundColor:
                itemColor === COLORS.red
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

        <Text
          style={[
            styles.menuTitle,
            {
              color:
                color ||
                theme.foreground,
            },
          ]}
        >
          {isLogout && isLoggingOut
            ? "Logging out..."
            : title}
        </Text>

        {isLogout &&
        isLoggingOut ? (
          <ActivityIndicator
            size="small"
            color={COLORS.red}
          />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={21}
            color={
              isDark
                ? "#777777"
                : "#9CA3AF"
            }
          />
        )}
      </TouchableOpacity>
    );
  };

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  const SectionTitle = ({
    title,
  }) => {
    return (
      <View
        style={
          styles.sectionTitleContainer
        }
      >
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
    return (
      <View style={styles.infoRow}>
        <View
          style={[
            styles.infoIcon,
            {
              backgroundColor:
                "rgba(249,115,22,0.10)",
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={COLORS.orange}
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
            {value || "Not provided"}
          </Text>
        </View>
      </View>
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingScreen,
          {
            backgroundColor:
              theme.background,
          },
        ]}
        edges={[
          "top",
          "bottom",
        ]}
      >
        <StatusBar
          barStyle={
            isDark
              ? "light-content"
              : "dark-content"
          }
          backgroundColor={
            theme.background
          }
        />

        <ActivityIndicator
          size="large"
          color={COLORS.orange}
        />

        <Text
          style={[
            styles.loadingText,
            {
              color:
                theme.bodyText,
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

  if (!user) {
    return (
      <SafeAreaView
        style={[
          styles.emptyScreen,
          {
            backgroundColor:
              theme.background,
          },
        ]}
        edges={[
          "top",
          "bottom",
        ]}
      >
        <StatusBar
          barStyle={
            isDark
              ? "light-content"
              : "dark-content"
          }
          backgroundColor={
            theme.background
          }
        />

        <View
          style={styles.emptyIcon}
        >
          <Ionicons
            name="person-outline"
            size={45}
            color={COLORS.orange}
          />
        </View>

        <Text
          style={[
            styles.emptyTitle,
            {
              color:
                theme.foreground,
            },
          ]}
        >
          Unable to load profile
        </Text>

        <Text
          style={[
            styles.emptyMessage,
            {
              color:
                theme.bodyText,
            },
          ]}
        >
          {profileError ||
            "Profile information is currently unavailable."}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            getProfile(true)
          }
          style={
            styles.retryButton
          }
        >
          <Ionicons
            name="refresh"
            size={18}
            color={COLORS.white}
          />

          <Text
            style={
              styles.retryButtonText
            }
          >
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={async () => {
            await clearAuthStorage();
            goToLogin();
          }}
          style={[
            styles.loginButton,
            {
              borderColor:
                COLORS.orange,
            },
          ]}
        >
          <Text
            style={[
              styles.loginButtonText,
              {
                color:
                  COLORS.orange,
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
  // PROFILE IMAGE
  // ==========================================================

  const profileImage =
    getProfileImage();

  // ==========================================================
  // MAIN RENDER
  // ==========================================================

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
          COLORS.orange
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              isRefreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor={
              COLORS.orange
            }
            colors={[
              COLORS.orange,
            ]}
          />
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* ====================================================
            PROFILE HEADER
        ==================================================== */}

        <LinearGradient
          colors={[
            COLORS.orange,
            COLORS.gold,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={
            styles.profileHeader
          }
        >
          {/* SETTINGS */}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={
              openSettings
            }
            style={
              styles.settingsButton
            }
          >
            <Ionicons
              name="settings-outline"
              size={23}
              color={
                COLORS.white
              }
            />
          </TouchableOpacity>

          {/* PROFILE IMAGE */}

          <View
            style={
              styles.profileImageWrapper
            }
          >
            {profileImage ? (
              <Image
                source={{
                  uri: profileImage,
                }}
                style={
                  styles.profileImage
                }
                resizeMode="cover"
                onError={(error) => {
                  console.log(
                    "PROFILE IMAGE ERROR =>",
                    error?.nativeEvent
                  );
                }}
              />
            ) : (
              <View
                style={[
                  styles.profileImage,
                  styles.defaultProfileImage,
                ]}
              >
                <Ionicons
                  name="person"
                  size={55}
                  color={
                    COLORS.foreground
                  }
                />
              </View>
            )}
          </View>

          {/* NAME */}

          <Text
            style={
              styles.profileName
            }
            numberOfLines={2}
          >
            {getUserName()}
          </Text>

          {/* EMAIL */}

          <Text
            style={
              styles.profileEmail
            }
            numberOfLines={1}
          >
            {getEmail()}
          </Text>

          {/* ROLE */}

          <View
            style={
              styles.roleBadge
            }
          >
            <Ionicons
              name="person-outline"
              size={14}
              color={
                COLORS.orange
              }
            />

            <Text
              style={
                styles.roleBadgeText
              }
            >
              {getRole()}
            </Text>
          </View>

          {/* EDIT PROFILE */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={
              openEditProfile
            }
            style={
              styles.editButton
            }
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={
                COLORS.orange
              }
            />

            <Text
              style={
                styles.editButtonText
              }
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <View
          style={styles.content}
        >
          {/* ==================================================
              BASIC STATS
          ================================================== */}

          <View
            style={styles.statsRow}
          >
            <StatCard
              icon="id-card-outline"
              value={getUserId()}
              label="User ID"
            />

            <View
              style={
                styles.statGap
              }
            />

            <StatCard
              icon="checkmark-circle"
              value={
                isVerified
                  ? "Yes"
                  : "No"
              }
              label="Verified"
            />

            <View
              style={
                styles.statGap
              }
            />

            <StatCard
              icon="person-outline"
              value={getRole()}
              label="Role"
            />
          </View>

          {/* ==================================================
              PERSONAL INFORMATION
          ================================================== */}

          <SectionTitle
            title="Personal Information"
          />

          <MenuCard>
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={getEmail()}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <InfoRow
              icon="call-outline"
              label="Phone"
              value={getPhone()}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <InfoRow
              icon="calendar-outline"
              label="Date of Birth"
              value={getDOB()}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <InfoRow
              icon="male-female-outline"
              label="Gender"
              value={getGender()}
            />
          </MenuCard>

          {/* ==================================================
              ADDRESS
          ================================================== */}

          <SectionTitle
            title="Address"
          />

          <MenuCard>
            <InfoRow
              icon="location-outline"
              label="Address"
              value={
                addressInfo?.address ||
                "Not provided"
              }
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <InfoRow
              icon="business-outline"
              label="City"
              value={
                addressInfo?.city ||
                "Not provided"
              }
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <InfoRow
              icon="map-outline"
              label="State"
              value={
                addressInfo?.state ||
                "Not provided"
              }
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <InfoRow
              icon="globe-outline"
              label="Country"
              value={
                addressInfo?.country ||
                "Not provided"
              }
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <InfoRow
              icon="mail-outline"
              label="Pincode"
              value={
                addressInfo?.pincode ||
                "Not provided"
              }
            />
          </MenuCard>

          {/* ==================================================
              ORDER STATISTICS
          ================================================== */}

          <SectionTitle
            title="Order Statistics"
          />

          <View
            style={
              styles.orderStatsGrid
            }
          >
            {/* TOTAL ORDERS */}

            <View
              style={[
                styles.orderStatCard,
                {
                  backgroundColor:
                    theme.card,
                },
              ]}
            >
              <View
                style={
                  styles.orderStatIcon
                }
              >
                <Ionicons
                  name="receipt-outline"
                  size={22}
                  color={
                    COLORS.orange
                  }
                />
              </View>

              <Text
                style={[
                  styles.orderStatValue,
                  {
                    color:
                      theme.foreground,
                  },
                ]}
              >
                {totalOrders}
              </Text>

              <Text
                style={[
                  styles.orderStatLabel,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                Total Orders
              </Text>
            </View>

            {/* COMPLETED */}

            <View
              style={[
                styles.orderStatCard,
                {
                  backgroundColor:
                    theme.card,
                },
              ]}
            >
              <View
                style={
                  styles.orderStatIcon
                }
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={22}
                  color={
                    COLORS.orange
                  }
                />
              </View>

              <Text
                style={[
                  styles.orderStatValue,
                  {
                    color:
                      theme.foreground,
                  },
                ]}
              >
                {completedOrders}
              </Text>

              <Text
                style={[
                  styles.orderStatLabel,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                Completed
              </Text>
            </View>

            {/* CANCELLED */}

            <View
              style={[
                styles.orderStatCard,
                {
                  backgroundColor:
                    theme.card,
                },
              ]}
            >
              <View
                style={
                  styles.orderStatIcon
                }
              >
                <Ionicons
                  name="close-circle-outline"
                  size={22}
                  color={
                    COLORS.red
                  }
                />
              </View>

              <Text
                style={[
                  styles.orderStatValue,
                  {
                    color:
                      theme.foreground,
                  },
                ]}
              >
                {cancelledOrders}
              </Text>

              <Text
                style={[
                  styles.orderStatLabel,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                Cancelled
              </Text>
            </View>

            {/* TOTAL SPENT */}

            <View
              style={[
                styles.orderStatCard,
                {
                  backgroundColor:
                    theme.card,
                },
              ]}
            >
              <View
                style={
                  styles.orderStatIcon
                }
              >
                <Ionicons
                  name="wallet-outline"
                  size={22}
                  color={
                    COLORS.orange
                  }
                />
              </View>

              <Text
                style={[
                  styles.orderStatValue,
                  {
                    color:
                      theme.foreground,
                  },
                ]}
              >
                {currency} {totalSpent}
              </Text>

              <Text
                style={[
                  styles.orderStatLabel,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                Total Spent
              </Text>
            </View>
          </View>

          {/* ==================================================
              SUPPORT
          ================================================== */}

          <SectionTitle
            title="Support"
          />

          <MenuCard>
            <MenuTile
              icon="help-circle-outline"
              title="Help & Support"
              onPress={
                openHelpSupport
              }
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            <MenuTile
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={
                openPrivacyPolicy
              }
            />
          </MenuCard>

          {/* ==================================================
              ACCOUNT
          ================================================== */}

          <View
            style={
              styles.sectionSpacing
            }
          />

          <MenuCard>
            {/* LOGOUT */}

            <MenuTile
              icon="log-out-outline"
              title="Logout"
              onPress={
                showLogoutDialog
              }
              color={
                COLORS.red
              }
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            {/* DELETE */}

            <MenuTile
              icon="trash-outline"
              title="Delete Account"
              onPress={
                showDeleteAccountDialog
              }
              color={
                COLORS.red
              }
            />
          </MenuCard>

          <View
            style={
              styles.bottomSpacing
            }
          />
        </View>
      </ScrollView>

      {/* ======================================================
          DELETE LOADING OVERLAY
      ====================================================== */}

      {isDeleting && (
        <View
          style={
            styles.deleteOverlay
          }
        >
          <View
            style={[
              styles.deleteLoadingBox,
              {
                backgroundColor:
                  theme.card,
              },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={
                COLORS.orange
              }
            />

            <Text
              style={[
                styles.deleteLoadingText,
                {
                  color:
                    theme.foreground,
                },
              ]}
            >
              Deleting account...
            </Text>
          </View>
        </View>
      )}

      {/* ======================================================
          LOGOUT LOADING OVERLAY
      ====================================================== */}

      {isLoggingOut && (
        <View
          style={
            styles.deleteOverlay
          }
        >
          <View
            style={[
              styles.deleteLoadingBox,
              {
                backgroundColor:
                  theme.card,
              },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={
                COLORS.orange
              }
            />

            <Text
              style={[
                styles.deleteLoadingText,
                {
                  color:
                    theme.foreground,
                },
              ]}
            >
              Logging out...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ============================================================
// DIMENSIONS
// ============================================================

const { width } =
  Dimensions.get("window");

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },

  // ==========================================================
  // EMPTY
  // ==========================================================

  emptyScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor:
      "rgba(249,115,22,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 22,
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor:
      COLORS.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  loginButton: {
    marginTop: 12,
    height: 46,
    paddingHorizontal: 30,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  loginButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  profileHeader: {
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 55,
    paddingBottom: 30,
    position: "relative",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  // ==========================================================
  // SETTINGS
  // ==========================================================

  settingsButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.20)",
  },

  // ==========================================================
  // PROFILE IMAGE
  // ==========================================================

  profileImageWrapper: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor:
      "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    marginBottom: 14,
  },

  profileImage: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor:
      COLORS.white,
  },

  defaultProfileImage: {
    alignItems: "center",
    justifyContent: "center",
  },

  // ==========================================================
  // NAME
  // ==========================================================

  profileName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: width - 60,
  },

  // ==========================================================
  // EMAIL
  // ==========================================================

  profileEmail: {
    marginTop: 6,
    color:
      "rgba(255,255,255,0.90)",
    fontSize: 14,
    textAlign: "center",
    maxWidth: width - 60,
  },

  // ==========================================================
  // ROLE
  // ==========================================================

  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 13,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      "rgba(255,255,255,0.90)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  roleBadgeText: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: "700",
  },

  // ==========================================================
  // EDIT
  // ==========================================================

  editButton: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 20,
    backgroundColor:
      COLORS.white,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  editButtonText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: "700",
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    padding: 16,
  },

  // ==========================================================
  // STATS
  // ==========================================================

  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  statGap: {
    width: 10,
  },

  statCard: {
    flex: 1,
    minHeight: 118,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.05,
    shadowRadius: 15,

    elevation: 2,
  },

  statValue: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 11,
    textAlign: "center",
  },

  // ==========================================================
  // SECTION
  // ==========================================================

  sectionTitleContainer: {
    marginTop: 22,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // ==========================================================
  // MENU CARD
  // ==========================================================

  menuCard: {
    borderRadius: 20,
    overflow: "hidden",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.05,
    shadowRadius: 15,

    elevation: 2,
  },

  // ==========================================================
  // MENU TILE
  // ==========================================================

  menuTile: {
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  // ==========================================================
  // INFO ROW
  // ==========================================================

  infoRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  // ==========================================================
  // DIVIDER
  // ==========================================================

  divider: {
    height: 1,
    marginLeft: 69,
  },

  // ==========================================================
  // ORDER STATS
  // ==========================================================

  orderStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  orderStatCard: {
    width: "48.3%",
    minHeight: 145,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.05,
    shadowRadius: 15,

    elevation: 2,
  },

  orderStatIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor:
      "rgba(249,115,22,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  orderStatValue: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  orderStatLabel: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },

  // ==========================================================
  // SPACING
  // ==========================================================

  sectionSpacing: {
    height: 18,
  },

  bottomSpacing: {
    height: 30,
  },

  // ==========================================================
  // LOADING OVERLAY
  // ==========================================================

  deleteOverlay: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor:
      "rgba(0,0,0,0.45)",

    alignItems: "center",
    justifyContent: "center",

    zIndex: 999,
    elevation: 999,
  },

  deleteLoadingBox: {
    width: 210,
    paddingVertical: 25,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ProfileScreen;
