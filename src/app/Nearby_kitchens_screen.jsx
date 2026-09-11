import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  orange: "#FF8A00",
  gold: "#FFC107",

  background: "#F8F8F8",
  darkBackground: "#111111",

  card: "#FFFFFF",
  darkCard: "#1E1E1E",

  text: "#222222",
  darkText: "#FFFFFF",

  secondaryText: "#666666",
  darkSecondaryText: "#BBBBBB",

  border: "#EEEEEE",
  darkBorder: "#333333",

  grey: "#D9D9D9",
  destructive: "#EF4444",
};

// ============================================================
// SCREEN
// ============================================================

const NearbyKitchensScreen = ({ navigation }) => {
  // ==========================================================
  // STATE
  // ==========================================================

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [kitchens, setKitchens] = useState([]);

  // Change this to your global theme context later if needed.
  const [isDark] = useState(false);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadNearbyKitchens();
  }, []);

  // ==========================================================
  // LOAD NEARBY KITCHENS
  // ==========================================================

  const loadNearbyKitchens = async () => {
    try {
      setIsLoading(true);

      await getCurrentLocation();

      await getNearbyKitchens();
    } catch (error) {
      console.log("Nearby kitchens error:", error);

      Alert.alert(
        "Unable to Load",
        error?.message || "Something went wrong while loading kitchens."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // GET CURRENT LOCATION
  // ==========================================================

  const getCurrentLocation = async () => {
    try {
      // ------------------------------------------------------
      // CHECK WHETHER LOCATION SERVICES ARE ENABLED
      // ------------------------------------------------------

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        throw new Error(
          "Location services are disabled. Please enable location services and try again."
        );
      }

      // ------------------------------------------------------
      // CHECK PERMISSION
      // ------------------------------------------------------

      let { status } =
        await Location.getForegroundPermissionsAsync();

      // ------------------------------------------------------
      // REQUEST PERMISSION
      // ------------------------------------------------------

      if (status !== Location.PermissionStatus.GRANTED) {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        status = permission.status;
      }

      // ------------------------------------------------------
      // PERMISSION DENIED
      // ------------------------------------------------------

      if (status !== Location.PermissionStatus.GRANTED) {
        throw new Error(
          "Location permission denied. Please allow location access to find nearby kitchens."
        );
      }

      // ------------------------------------------------------
      // GET LOCATION
      // ------------------------------------------------------

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const currentLatitude =
        location.coords.latitude;

      const currentLongitude =
        location.coords.longitude;

      setLatitude(currentLatitude);
      setLongitude(currentLongitude);

      console.log("LAT :", currentLatitude);
      console.log("LONG :", currentLongitude);

      return {
        latitude: currentLatitude,
        longitude: currentLongitude,
      };
    } catch (error) {
      console.log("Location error:", error);
      throw error;
    }
  };

  // ==========================================================
  // GET NEARBY KITCHENS
  // ==========================================================

  const getNearbyKitchens = async () => {
    try {
      // ------------------------------------------------------
      // Make sure we have location
      // ------------------------------------------------------

      let currentLatitude = latitude;
      let currentLongitude = longitude;

      // If state hasn't updated yet, get location directly.
      if (
        !currentLatitude ||
        !currentLongitude
      ) {
        const location = await getCurrentLocation();

        currentLatitude = location.latitude;
        currentLongitude = location.longitude;
      }

      // ------------------------------------------------------
      // API URL
      // ------------------------------------------------------

      const url =
        `${BASE_URL}/api/v1/nearby-kitchens` +
        `?latitude=${encodeURIComponent(currentLatitude)}` +
        `&longitude=${encodeURIComponent(currentLongitude)}` +
        `&radius_km=10`;

      console.log("Nearby kitchens URL:", url);

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response = await fetch(url, {
        method: "GET",

        headers: {
          Accept: "application/json",
        },
      });

      console.log(
        "STATUS :",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "BODY :",
        responseText
      );

      // ------------------------------------------------------
      // HTTP ERROR
      // ------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          `Failed to load nearby kitchens. Status: ${response.status}`
        );
      }

      // ------------------------------------------------------
      // PARSE RESPONSE
      // ------------------------------------------------------

      let data;

      try {
        data = JSON.parse(responseText);
      } catch (error) {
        throw new Error(
          "Invalid response received from server."
        );
      }

      // ------------------------------------------------------
      // SUPPORT BOTH RESPONSE FORMATS
      // ------------------------------------------------------

      const kitchenData =
        data?.data ??
        data?.kitchens ??
        [];

      if (Array.isArray(kitchenData)) {
        setKitchens(kitchenData);
      } else {
        setKitchens([]);
      }
    } catch (error) {
      console.log(
        "Get nearby kitchens error:",
        error
      );

      throw error;
    }
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      await getCurrentLocation();

      await getNearbyKitchens();
    } catch (error) {
      console.log(
        "Refresh nearby kitchens error:",
        error
      );

      Alert.alert(
        "Refresh Failed",
        error?.message ||
          "Unable to refresh nearby kitchens."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==========================================================
  // KITCHEN IMAGE
  // ==========================================================

  const kitchenImage = (kitchen) => {
    const photo =
      kitchen?.kitchen_photo;

    if (
      photo === null ||
      photo === undefined ||
      String(photo).trim() === ""
    ) {
      return null;
    }

    const photoString =
      String(photo).trim();

    // Already complete URL
    if (
      photoString.startsWith("http://") ||
      photoString.startsWith("https://")
    ) {
      return photoString;
    }

    // Relative backend path
    return `${BASE_URL}/${photoString.replace(
      /^\/+/,
      ""
    )}`;
  };

  // ==========================================================
  // SAFE TEXT
  // ==========================================================

  const getText = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value);
  };

  // ==========================================================
  // RENDER KITCHEN
  // ==========================================================

  const renderKitchen = ({
    item,
  }) => {
    const imageUrl =
      kitchenImage(item);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? COLORS.darkCard
              : COLORS.card,

            borderColor: isDark
              ? COLORS.darkBorder
              : COLORS.border,
          },
        ]}
      >
        {/* ==================================================
            IMAGE
        ================================================== */}

        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{
                uri: imageUrl,
              }}
              style={styles.kitchenImage}
              resizeMode="cover"
              onError={(error) => {
                console.log(
                  "Kitchen image error:",
                  error.nativeEvent
                );
              }}
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                {
                  backgroundColor: isDark
                    ? "#303030"
                    : "#E5E5E5",
                },
              ]}
            >
              <Ionicons
                name="restaurant-outline"
                size={60}
                color={
                  isDark
                    ? "#777777"
                    : "#888888"
                }
              />
            </View>
          )}
        </View>

        {/* ==================================================
            KITCHEN DETAILS
        ================================================== */}

        <View style={styles.detailsContainer}>
          {/* Kitchen Name */}

          <Text
            style={[
              styles.kitchenName,
              {
                color: isDark
                  ? COLORS.darkText
                  : COLORS.text,
              },
            ]}
            numberOfLines={2}
          >
            {getText(
              item?.kitchen_name
            )}
          </Text>

          {/* Category */}

          {getText(
            item?.kitchen_category
          ) !== "" && (
            <View style={styles.infoRow}>
              <Ionicons
                name="restaurant-outline"
                size={16}
                color={COLORS.orange}
              />

              <Text
                style={[
                  styles.infoText,
                  {
                    color: isDark
                      ? COLORS.darkSecondaryText
                      : COLORS.secondaryText,
                  },
                ]}
                numberOfLines={2}
              >
                {getText(
                  item?.kitchen_category
                )}
              </Text>
            </View>
          )}

          {/* Address */}

          {getText(
            item?.kitchen_address
          ) !== "" && (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.orange}
              />

              <Text
                style={[
                  styles.infoText,
                  {
                    color: isDark
                      ? COLORS.darkSecondaryText
                      : COLORS.secondaryText,
                  },
                ]}
                numberOfLines={3}
              >
                {getText(
                  item?.kitchen_address
                )}
              </Text>
            </View>
          )}

          {/* City */}

          {getText(item?.city) !== "" && (
            <View style={styles.infoRow}>
              <Ionicons
                name="business-outline"
                size={16}
                color={COLORS.orange}
              />

              <Text
                style={[
                  styles.infoText,
                  {
                    color: isDark
                      ? COLORS.darkSecondaryText
                      : COLORS.secondaryText,
                  },
                ]}
              >
                {getText(item?.city)}
              </Text>
            </View>
          )}

          {/* Contact Number */}

          {getText(
            item?.contact_number
          ) !== "" && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.infoRow}
            >
              <Ionicons
                name="call-outline"
                size={16}
                color={COLORS.orange}
              />

              <Text
                style={[
                  styles.infoText,
                  styles.phoneText,
                  {
                    color: isDark
                      ? COLORS.darkSecondaryText
                      : COLORS.secondaryText,
                  },
                ]}
              >
                {getText(
                  item?.contact_number
                )}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ==========================================================
  // KEY EXTRACTOR
  // ==========================================================

  const keyExtractor = (
    item,
    index
  ) => {
    return String(
      item?.kitchen_id ??
        item?.id ??
        item?._id ??
        index
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
            backgroundColor: isDark
              ? COLORS.darkBackground
              : COLORS.background,
          },
        ]}
      >
        <StatusBar
          barStyle={
            isDark
              ? "light-content"
              : "dark-content"
          }
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.orange}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: isDark
                  ? COLORS.darkText
                  : COLORS.text,
              },
            ]}
          >
            Finding nearby kitchens...
          </Text>
        </View>
      </View>
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (kitchens.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? COLORS.darkBackground
              : COLORS.background,
          },
        ]}
      >
        <StatusBar
          barStyle={
            isDark
              ? "light-content"
              : "dark-content"
          }
        />

        {/* Header */}

        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark
                ? COLORS.darkCard
                : COLORS.card,

              borderBottomColor: isDark
                ? COLORS.darkBorder
                : COLORS.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() =>
              navigation?.goBack?.()
            }
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                isDark
                  ? COLORS.darkText
                  : COLORS.text
              }
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: isDark
                  ? COLORS.darkText
                  : COLORS.text,
              },
            ]}
          >
            Nearby Kitchens
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              {
                backgroundColor: isDark
                  ? "#292929"
                  : "#FFF1E1",
              },
            ]}
          >
            <Ionicons
              name="restaurant-outline"
              size={50}
              color={COLORS.orange}
            />
          </View>

          <Text
            style={[
              styles.emptyTitle,
              {
                color: isDark
                  ? COLORS.darkText
                  : COLORS.text,
              },
            ]}
          >
            No kitchens found nearby
          </Text>

          <Text
            style={[
              styles.emptySubtitle,
              {
                color: isDark
                  ? COLORS.darkSecondaryText
                  : COLORS.secondaryText,
              },
            ]}
          >
            We couldn't find any kitchens
            within 10 km of your current
            location.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRefresh}
            style={styles.retryButton}
          >
            <Ionicons
              name="refresh"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={styles.retryButtonText}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? COLORS.darkBackground
            : COLORS.background,
        },
      ]}
    >
      <StatusBar
        barStyle={
          isDark
            ? "light-content"
            : "dark-content"
        }
      />

      {/* ====================================================
          HEADER
      ==================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark
              ? COLORS.darkCard
              : COLORS.card,

            borderBottomColor: isDark
              ? COLORS.darkBorder
              : COLORS.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() =>
            navigation?.goBack?.()
          }
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={
              isDark
                ? COLORS.darkText
                : COLORS.text
            }
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: isDark
                  ? COLORS.darkText
                  : COLORS.text,
              },
            ]}
          >
            Nearby Kitchens
          </Text>

          <Text
            style={[
              styles.locationText,
              {
                color: isDark
                  ? COLORS.darkSecondaryText
                  : COLORS.secondaryText,
              },
            ]}
          >
            Within 10 km
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh-outline"
            size={23}
            color={COLORS.orange}
          />
        </TouchableOpacity>
      </View>

      {/* ====================================================
          KITCHEN LIST
      ==================================================== */}

      <FlatList
        data={kitchens}
        keyExtractor={keyExtractor}
        renderItem={renderKitchen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.orange]}
            tintColor={COLORS.orange}
          />
        }
      />
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

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    minHeight: 64,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 16,

    borderBottomWidth: 1,
  },

  backButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 21,
  },

  headerTitleContainer: {
    flex: 1,

    marginLeft: 6,
  },

  headerTitle: {
    fontSize: 20,

    fontWeight: "700",
  },

  locationText: {
    marginTop: 2,

    fontSize: 12,

    fontWeight: "400",
  },

  headerSpacer: {
    width: 42,
  },

  refreshButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 21,
  },

  // ==========================================================
  // LIST
  // ==========================================================

  listContent: {
    padding: 16,

    paddingBottom: 30,
  },

  // ==========================================================
  // CARD
  // ==========================================================

  card: {
    marginBottom: 16,

    borderRadius: 16,

    borderWidth: 1,

    overflow: "hidden",

    // iOS shadow
    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.12,

    shadowRadius: 6,

    // Android shadow
    elevation: 3,
  },

  // ==========================================================
  // IMAGE
  // ==========================================================

  imageContainer: {
    width: "100%",

    height: 180,

    overflow: "hidden",
  },

  kitchenImage: {
    width: "100%",

    height: 180,
  },

  imagePlaceholder: {
    width: "100%",

    height: 180,

    alignItems: "center",

    justifyContent: "center",
  },

  // ==========================================================
  // DETAILS
  // ==========================================================

  detailsContainer: {
    padding: 12,
  },

  kitchenName: {
    fontSize: 18,

    fontWeight: "700",

    marginBottom: 10,

    lineHeight: 23,
  },

  infoRow: {
    flexDirection: "row",

    alignItems: "flex-start",

    marginBottom: 7,
  },

  infoText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 14,

    lineHeight: 20,
  },

  phoneText: {
    textDecorationLine: "none",
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",
  },

  loadingText: {
    marginTop: 14,

    fontSize: 15,

    fontWeight: "500",
  },

  // ==========================================================
  // EMPTY
  // ==========================================================

  emptyContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyIconContainer: {
    width: 100,

    height: 100,

    borderRadius: 50,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 22,
  },

  emptyTitle: {
    fontSize: 20,

    fontWeight: "700",

    textAlign: "center",

    marginBottom: 10,
  },

  emptySubtitle: {
    fontSize: 14,

    lineHeight: 21,

    textAlign: "center",

    maxWidth: 320,

    marginBottom: 24,
  },

  retryButton: {
    height: 46,

    paddingHorizontal: 24,

    borderRadius: 23,

    backgroundColor: COLORS.orange,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  retryButtonText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "600",

    marginLeft: 8,
  },
});

export default NearbyKitchensScreen;