import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

// ============================================================
// GLOBAL THEME
// ============================================================

import { useApp } from "./_layout";

// ============================================================
// BASE URL
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// NOTIFICATION SCREEN
// ============================================================

const NotificationScreen = () => {
  const router = useRouter();

  // ==========================================================
  // GLOBAL THEME
  // ==========================================================

  const { isDarkMode, colors } = useApp();

  // ==========================================================
  // STATE
  // ==========================================================

  const [notifications, setNotifications] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notification IDs currently being marked as read.
  const [markingAsRead, setMarkingAsRead] = useState(
    new Set()
  );

  // Notification IDs currently being deleted.
  const [deletingIds, setDeletingIds] = useState(
    new Set()
  );

  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // ==========================================================
  // THEME COLORS
  // ==========================================================

  const backgroundColor = colors.background;
  const cardColor = colors.card;
  const textColor = colors.foreground;
  const mutedColor = colors.mutedForeground;
  const borderColor = colors.border;

  // ==========================================================
  // GET ACCESS TOKEN
  // ==========================================================

  const getAccessToken = async () => {
    try {
      const token = await AsyncStorage.getItem(
        "access_token"
      );

      if (!token || !token.trim()) {
        console.log(
          "NOTIFICATION ERROR: Access token not found"
        );

        return null;
      }

      return token;
    } catch (error) {
      console.log(
        "GET ACCESS TOKEN ERROR:",
        error
      );

      return null;
    }
  };

  // ==========================================================
  // FETCH NOTIFICATIONS
  // ==========================================================

  const fetchNotifications = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const token = await getAccessToken();

        if (!token) {
          setNotifications([]);
          return;
        }

        console.log(
          "=========================================="
        );

        console.log("FETCHING NOTIFICATIONS");

        console.log(
          `${BASE_URL}/api/v1/notifications`
        );

        console.log(
          "=========================================="
        );

        const response = await fetch(
          `${BASE_URL}/api/v1/notifications`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const responseText =
          await response.text();

        console.log(
          "NOTIFICATIONS STATUS:",
          response.status
        );

        console.log(
          "NOTIFICATIONS RESPONSE:",
          responseText
        );

        if (response.status === 200) {
          let decoded = {};

          try {
            decoded = responseText
              ? JSON.parse(responseText)
              : {};
          } catch (parseError) {
            console.log(
              "NOTIFICATION JSON PARSE ERROR:",
              parseError
            );

            throw new Error(
              "Invalid notification response from server."
            );
          }

          const list = Array.isArray(
            decoded?.notifications
          )
            ? decoded.notifications
            : [];

          // ==================================================
          // NORMALIZE API DATA
          // ==================================================

          const loadedNotifications = list.map(
            (item, index) => ({
              id:
                item?.notification_id ??
                item?.id ??
                index,

              title:
                item?.title ??
                "Notification",

              body:
                item?.body ??
                "",

              isRead:
                item?.is_read === true ||
                item?.is_read === 1 ||
                item?.is_read === "true" ||
                item?.isRead === true,

              createdAt:
                item?.created_at ??
                item?.createdAt ??
                "",
            })
          );

          setNotifications(
            loadedNotifications
          );
        } else if (
          response.status === 401 ||
          response.status === 403
        ) {
          console.log(
            "FETCH NOTIFICATIONS: Unauthorized"
          );

          setNotifications([]);

          Alert.alert(
            "Session Expired",
            "Please login again."
          );
        } else {
          console.log(
            "FAILED TO FETCH NOTIFICATIONS:",
            response.status
          );

          Alert.alert(
            "Error",
            "Failed to load notifications."
          );
        }
      } catch (error) {
        console.log(
          "FETCH NOTIFICATIONS ERROR:",
          error
        );

        if (showLoader) {
          Alert.alert(
            "Error",
            "Error loading notifications."
          );
        }
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // ==========================================================
  // PULL TO REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await fetchNotifications(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==========================================================
  // MARK NOTIFICATION AS READ
  // ==========================================================

  const markNotificationAsRead = async (
    notificationId
  ) => {
    // --------------------------------------------------------
    // Find notification
    // --------------------------------------------------------

    const index = notifications.findIndex(
      (notification) =>
        notification.id === notificationId
    );

    if (index === -1) {
      console.log(
        "Notification not found:",
        notificationId
      );

      return;
    }

    const notification =
      notifications[index];

    // --------------------------------------------------------
    // Already read
    // --------------------------------------------------------

    if (notification.isRead) {
      console.log(
        "Notification already read:",
        notificationId
      );

      return;
    }

    // --------------------------------------------------------
    // Prevent duplicate requests
    // --------------------------------------------------------

    if (
      markingAsRead.has(notificationId)
    ) {
      return;
    }

    setMarkingAsRead((previous) => {
      const next = new Set(previous);

      next.add(notificationId);

      return next;
    });

    try {
      const token = await getAccessToken();

      if (!token) {
        return;
      }

      console.log(
        "=========================================="
      );

      console.log(
        "MARKING NOTIFICATION AS READ"
      );

      console.log(
        "NOTIFICATION ID:",
        notificationId
      );

      console.log(
        "=========================================="
      );

      const response = await fetch(
        `${BASE_URL}/api/v1/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      console.log(
        "MARK READ STATUS:",
        response.status
      );

      console.log(
        "MARK READ RESPONSE:",
        responseText
      );

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      if (
        response.status === 200 ||
        response.status === 204
      ) {
        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notificationId
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
        );

        console.log(
          "NOTIFICATION MARKED AS READ SUCCESSFULLY"
        );
      } else if (
        response.status === 401 ||
        response.status === 403
      ) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );
      } else if (
        response.status === 404
      ) {
        Alert.alert(
          "Not Found",
          "Notification not found."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to mark notification as read."
        );
      }
    } catch (error) {
      console.log(
        "MARK READ ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Error marking notification as read."
      );
    } finally {
      setMarkingAsRead((previous) => {
        const next = new Set(previous);

        next.delete(notificationId);

        return next;
      });
    }
  };

  // ==========================================================
  // DELETE SINGLE NOTIFICATION
  // ==========================================================

  const deleteNotification = async (
    notificationId
  ) => {
    if (
      deletingIds.has(notificationId)
    ) {
      return;
    }

    setDeletingIds((previous) => {
      const next = new Set(previous);

      next.add(notificationId);

      return next;
    });

    try {
      const token = await getAccessToken();

      if (!token) {
        return;
      }

      console.log(
        "=========================================="
      );

      console.log(
        "DELETING NOTIFICATION"
      );

      console.log(
        "NOTIFICATION ID:",
        notificationId
      );

      console.log(
        "=========================================="
      );

      const response = await fetch(
        `${BASE_URL}/api/v1/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      console.log(
        "DELETE NOTIFICATION STATUS:",
        response.status
      );

      console.log(
        "DELETE NOTIFICATION RESPONSE:",
        responseText
      );

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      if (
        response.status === 200 ||
        response.status === 204
      ) {
        setNotifications((previous) =>
          previous.filter(
            (notification) =>
              notification.id !==
              notificationId
          )
        );

        console.log(
          "NOTIFICATION DELETED SUCCESSFULLY"
        );
      } else if (
        response.status === 401 ||
        response.status === 403
      ) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );
      } else if (
        response.status === 404
      ) {
        Alert.alert(
          "Not Found",
          "Notification not found."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to delete notification."
        );
      }
    } catch (error) {
      console.log(
        "DELETE NOTIFICATION ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Error deleting notification."
      );
    } finally {
      setDeletingIds((previous) => {
        const next = new Set(previous);

        next.delete(notificationId);

        return next;
      });
    }
  };

  // ==========================================================
  // CONFIRM DELETE SINGLE
  // ==========================================================

  const confirmDeleteNotification = (
    notificationId
  ) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteNotification(
              notificationId
            );
          },
        },
      ]
    );
  };

  // ==========================================================
  // DELETE ALL NOTIFICATIONS
  // ==========================================================

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) {
      return;
    }

    if (isDeletingAll) {
      return;
    }

    setIsDeletingAll(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        return;
      }

      console.log(
        "=========================================="
      );

      console.log(
        "DELETING ALL NOTIFICATIONS"
      );

      console.log(
        `${BASE_URL}/api/v1/notifications/delete-all`
      );

      console.log(
        "=========================================="
      );

      const response = await fetch(
        `${BASE_URL}/api/v1/notifications/delete-all`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      console.log(
        "DELETE ALL STATUS:",
        response.status
      );

      console.log(
        "DELETE ALL RESPONSE:",
        responseText
      );

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      if (
        response.status === 200 ||
        response.status === 204
      ) {
        setNotifications([]);

        Alert.alert(
          "Success",
          "All notifications deleted successfully."
        );
      } else if (
        response.status === 401 ||
        response.status === 403
      ) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to delete notifications."
        );
      }
    } catch (error) {
      console.log(
        "DELETE ALL ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Error deleting notifications."
      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  // ==========================================================
  // CONFIRM DELETE ALL
  // ==========================================================

  const confirmDeleteAll = () => {
    if (notifications.length === 0) {
      return;
    }

    Alert.alert(
      "Delete Notifications",
      "Are you sure you want to delete all notifications?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteAllNotifications();
          },
        },
      ]
    );
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    try {
      return date.toLocaleString();
    } catch {
      return String(dateValue);
    }
  };

  // ==========================================================
  // NOTIFICATION CARD
  // ==========================================================

  const renderNotification = ({
    item,
  }) => {
    const isRead = item.isRead;

    const isMarking =
      markingAsRead.has(item.id);

    const isDeleting =
      deletingIds.has(item.id);

    return (
      <View
        style={[
          styles.notificationCard,
          {
            backgroundColor: cardColor,
            borderColor,
            opacity: isDeleting ? 0.6 : 1,
          },
        ]}
      >
        {/* ==================================================
            CARD CONTENT
        ================================================== */}

        <TouchableOpacity
          activeOpacity={0.75}
          disabled={isDeleting}
          onPress={() => {
            if (!item.isRead) {
              markNotificationAsRead(
                item.id
              );
            }
          }}
          style={styles.notificationTouchable}
        >
          {/* ==================================================
              ICON
          ================================================== */}

          <View style={styles.iconWrapper}>
            <View
              style={[
                styles.notificationIcon,
                {
                  backgroundColor: isRead
                    ? colors.muted
                    : colors.backgroundSelected,
                },
              ]}
            >
              {isMarking ? (
                <ActivityIndicator
                  size="small"
                  color={colors.orange}
                />
              ) : (
                <Ionicons
                  name={
                    isRead
                      ? "notifications-outline"
                      : "notifications"
                  }
                  size={23}
                  color={
                    isRead
                      ? mutedColor
                      : colors.orange
                  }
                />
              )}
            </View>

            {/* Unread dot */}

            {!isRead && (
              <View
                style={[
                  styles.unreadDot,
                  {
                    borderColor: cardColor,
                    backgroundColor:
                      colors.destructive,
                  },
                ]}
              />
            )}
          </View>

          {/* ==================================================
              TEXT
          ================================================== */}

          <View
            style={styles.notificationContent}
          >
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[
                styles.notificationTitle,
                {
                  color: textColor,
                  fontWeight: isRead
                    ? "500"
                    : "700",
                },
              ]}
            >
              {item.title}
            </Text>

            {!!item.body && (
              <Text
                numberOfLines={3}
                ellipsizeMode="tail"
                style={[
                  styles.notificationBody,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {item.body}
              </Text>
            )}

            {!!item.createdAt && (
              <Text
                style={[
                  styles.notificationDate,
                  {
                    color: mutedColor,
                  },
                ]}
              >
                {formatDate(
                  item.createdAt
                )}
              </Text>
            )}

            {/* Unread label */}

            {!isRead && (
              <Text
                style={[
                  styles.unreadLabel,
                  {
                    color: colors.orange,
                  },
                ]}
              >
                Unread
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* ==================================================
            DELETE BUTTON
        ================================================== */}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isDeleting}
          onPress={() =>
            confirmDeleteNotification(
              item.id
            )
          }
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Delete notification"
        >
          {isDeleting ? (
            <ActivityIndicator
              size="small"
              color={colors.destructive}
            />
          ) : (
            <Ionicons
              name="trash-outline"
              size={21}
              color={colors.destructive}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconContainer,
            {
              backgroundColor:
                colors.backgroundSelected,
            },
          ]}
        >
          <Ionicons
            name="notifications-off-outline"
            size={58}
            color={mutedColor}
          />
        </View>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: textColor,
            },
          ]}
        >
          No notifications found
        </Text>

        <Text
          style={[
            styles.emptySubtitle,
            {
              color: mutedColor,
            },
          ]}
        >
          You're all caught up!
        </Text>
      </View>
    );
  };

  // ==========================================================
  // HEADER BACK
  // ==========================================================

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/Home_screen");
    }
  };

  // ==========================================================
  // HEADER
  // ==========================================================

  const renderHeader = () => {
    return (
      <View
        style={[
          styles.header,
          {
            backgroundColor: cardColor,
            borderBottomColor: borderColor,
          },
        ]}
      >
        {/* BACK */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={[
            styles.headerButton,
            {
              backgroundColor: colors.muted,
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
          Notifications
        </Text>

        {/* DELETE ALL */}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={
            notifications.length === 0 ||
            isDeletingAll
          }
          onPress={confirmDeleteAll}
          style={[
            styles.headerButton,
            {
              backgroundColor: isDarkMode
                ? colors.muted
                : "#FFF1F1",

              opacity:
                notifications.length === 0 ||
                isDeletingAll
                  ? 0.4
                  : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Delete all notifications"
        >
          {isDeletingAll ? (
            <ActivityIndicator
              size="small"
              color={colors.destructive}
            />
          ) : (
            <Ionicons
              name="trash-outline"
              size={21}
              color={colors.destructive}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================================
  // BUILD
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
      <StatusBar
        barStyle={
          isDarkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={cardColor}
      />

      {/* ====================================================
          HEADER
      ==================================================== */}

      {renderHeader()}

      {/* ====================================================
          LOADING
      ==================================================== */}

      {isLoading ? (
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={colors.orange}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: mutedColor,
              },
            ]}
          >
            Loading notifications...
          </Text>
        </View>
      ) : (
        /* ==================================================
           NOTIFICATION LIST
        ================================================== */

        <FlatList
          data={notifications}
          keyExtractor={(item, index) =>
            String(item.id ?? index)
          }
          renderItem={renderNotification}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.orange}
              colors={[colors.orange]}
              progressBackgroundColor={
                cardColor
              }
            />
          }
          ListEmptyComponent={
            renderEmptyState
          }
        />
      )}
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

    justifyContent: "space-between",

    paddingHorizontal: 16,

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  headerButton: {
    width: 42,

    height: 42,

    borderRadius: 13,

    alignItems: "center",

    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,

    textAlign: "center",

    marginHorizontal: 12,

    fontSize: 20,

    fontWeight: "700",
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
    marginTop: 12,

    fontSize: 14,

    fontWeight: "500",
  },

  // ==========================================================
  // LIST
  // ==========================================================

  listContent: {
    paddingHorizontal: 16,

    paddingTop: 16,

    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  // ==========================================================
  // NOTIFICATION CARD
  // ==========================================================

  notificationCard: {
    minHeight: 120,

    marginBottom: 14,

    borderRadius: 16,

    borderWidth: 1,

    overflow: "hidden",

    flexDirection: "row",

    alignItems: "stretch",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity: 0.05,

    shadowRadius: 6,

    elevation: 2,
  },

  notificationTouchable: {
    flex: 1,

    flexDirection: "row",

    paddingLeft: 14,

    paddingRight: 4,

    paddingVertical: 14,
  },

  // ==========================================================
  // ICON
  // ==========================================================

  iconWrapper: {
    width: 54,

    alignItems: "center",

    justifyContent: "flex-start",

    position: "relative",
  },

  notificationIcon: {
    width: 50,

    height: 50,

    borderRadius: 25,

    alignItems: "center",

    justifyContent: "center",
  },

  unreadDot: {
    position: "absolute",

    right: 0,

    top: -1,

    width: 12,

    height: 12,

    borderRadius: 6,

    borderWidth: 2,
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  notificationContent: {
    flex: 1,

    marginLeft: 12,

    paddingRight: 6,
  },

  notificationTitle: {
    fontSize: 15,

    lineHeight: 21,
  },

  notificationBody: {
    marginTop: 7,

    fontSize: 14,

    lineHeight: 20,
  },

  notificationDate: {
    marginTop: 8,

    fontSize: 12,

    lineHeight: 17,
  },

  unreadLabel: {
    marginTop: 7,

    fontSize: 11,

    fontWeight: "600",
  },

  // ==========================================================
  // DELETE BUTTON
  // ==========================================================

  deleteButton: {
    width: 50,

    alignItems: "center",

    justifyContent: "center",
  },

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  emptyContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyIconContainer: {
    width: 110,

    height: 110,

    borderRadius: 55,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 17,

    fontWeight: "600",

    textAlign: "center",
  },

  emptySubtitle: {
    marginTop: 7,

    fontSize: 13,

    textAlign: "center",
  },
});

export default NotificationScreen;