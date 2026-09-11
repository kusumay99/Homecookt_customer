import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// ================================================================
// API
// ================================================================

const BASE_URL = "https://api.homecookt.com";

// ================================================================
// FORGOT PASSWORD SCREEN
// ================================================================

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ============================================================
  // GET API ERROR MESSAGE
  // ============================================================

  const getApiErrorMessage = (data) => {
    if (!data) {
      return "Failed to send OTP.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }

    if (
      typeof data.detail === "string" &&
      data.detail.trim()
    ) {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item?.msg) {
            return item.msg;
          }

          return "";
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join("\n");
      }
    }

    if (
      typeof data.error === "string" &&
      data.error.trim()
    ) {
      return data.error;
    }

    return "Failed to send OTP.";
  };

  // ============================================================
  // EMAIL VALIDATION
  // ============================================================

  const validateEmail = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Enter your email");
      return false;
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Enter valid email");
      return false;
    }

    setEmailError("");

    return true;
  };

  // ============================================================
  // NAVIGATE TO RESET PASSWORD
  // ============================================================

  const navigateToResetPassword = () => {
    const trimmedEmail = email.trim();

    console.log(
      "NAVIGATING TO RESET PASSWORD"
    );

    console.log(
      "RESET PASSWORD EMAIL =>",
      trimmedEmail
    );

    try {
      // Expo Router navigation
      router.push({
        pathname: "/ResetPassword",
        params: {
          email: trimmedEmail,
        },
      });

      console.log(
        "RESET PASSWORD NAVIGATION SENT"
      );
    } catch (routerError) {
      console.log(
        "EXPO ROUTER ERROR =>",
        routerError
      );

      // React Navigation fallback
      try {
        if (navigation?.navigate) {
          navigation.navigate(
            "ResetPassword",
            {
              email: trimmedEmail,
            }
          );
        } else {
          Alert.alert(
            "Navigation Error",
            "Unable to open Reset Password screen."
          );
        }
      } catch (navigationError) {
        console.log(
          "NAVIGATION ERROR =>",
          navigationError
        );

        Alert.alert(
          "Navigation Error",
          "Unable to open Reset Password screen."
        );
      }
    }
  };

  // ============================================================
  // SEND OTP
  // ============================================================

  const sendOtp = async () => {
    Keyboard.dismiss();

    if (isLoading) {
      return;
    }

    const isValid = validateEmail();

    if (!isValid) {
      return;
    }

    const trimmedEmail = email.trim();

    setIsLoading(true);

    let timeoutId = null;

    try {
      console.log(
        "===================================="
      );

      console.log(
        "FORGOT PASSWORD REQUEST STARTED"
      );

      console.log(
        "EMAIL =>",
        trimmedEmail
      );

      console.log(
        "API =>",
        `${BASE_URL}/api/v1/users/forgot-password`
      );

      console.log(
        "===================================="
      );

      // ========================================================
      // ABORT CONTROLLER
      // ========================================================

      const controller = new AbortController();

      // 15 second timeout
      timeoutId = setTimeout(() => {
        console.log(
          "FORGOT PASSWORD REQUEST TIMEOUT"
        );

        controller.abort();
      }, 15000);

      // ========================================================
      // API REQUEST
      // ========================================================

      const response = await fetch(
        `${BASE_URL}/api/v1/users/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email: trimmedEmail,
          }),

          signal: controller.signal,
        }
      );

      // Clear timeout after response
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      console.log(
        "FORGOT PASSWORD STATUS =>",
        response.status
      );

      // ========================================================
      // READ RESPONSE
      // ========================================================

      const responseText = await response.text();

      console.log(
        "FORGOT PASSWORD RESPONSE =>",
        responseText
      );

      // ========================================================
      // SAFE JSON PARSE
      // ========================================================

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.log(
            "JSON PARSE ERROR =>",
            parseError
          );

          data = {
            message: responseText,
          };
        }
      }

      console.log(
        "FORGOT PASSWORD DATA =>",
        data
      );

      // ========================================================
      // SUCCESS
      // ========================================================

      if (
        response.status === 200 ||
        response.status === 201 ||
        response.status === 202
      ) {
        console.log(
          "OTP SENT SUCCESSFULLY"
        );

        Alert.alert(
          "Success",
          data?.message ||
            "OTP sent successfully.",
          [
            {
              text: "OK",
              onPress:
                navigateToResetPassword,
            },
          ],
          {
            cancelable: false,
          }
        );

        return;
      }

      // ========================================================
      // 400 BAD REQUEST
      // ========================================================

      if (response.status === 400) {
        Alert.alert(
          "Error",
          getApiErrorMessage(data)
        );

        return;
      }

      // ========================================================
      // 401 UNAUTHORIZED
      // ========================================================

      if (response.status === 401) {
        Alert.alert(
          "Error",
          getApiErrorMessage(data)
        );

        return;
      }

      // ========================================================
      // 404 NOT FOUND
      // ========================================================

      if (response.status === 404) {
        Alert.alert(
          "Email Not Found",
          getApiErrorMessage(data) ||
            "No account was found with this email address."
        );

        return;
      }

      // ========================================================
      // 422 VALIDATION ERROR
      // ========================================================

      if (response.status === 422) {
        Alert.alert(
          "Invalid Email",
          getApiErrorMessage(data) ||
            "Please enter a valid email address."
        );

        return;
      }

      // ========================================================
      // 500+ SERVER ERROR
      // ========================================================

      if (response.status >= 500) {
        Alert.alert(
          "Server Error",
          "The server is temporarily unavailable. Please try again later."
        );

        return;
      }

      // ========================================================
      // OTHER ERROR
      // ========================================================

      Alert.alert(
        "Error",
        getApiErrorMessage(data)
      );
    } catch (error) {
      console.log(
        "FORGOT PASSWORD ERROR =>",
        error
      );

      // ========================================================
      // TIMEOUT
      // ========================================================

      if (error?.name === "AbortError") {
        Alert.alert(
          "Timeout",
          "Request timed out. Please try again."
        );

        return;
      }

      // ========================================================
      // NETWORK ERROR
      // ========================================================

      const message =
        error?.message?.toLowerCase?.() || "";

      if (
        message.includes(
          "network request failed"
        ) ||
        message.includes(
          "network error"
        ) ||
        message.includes(
          "failed to fetch"
        )
      ) {
        Alert.alert(
          "Connection Error",
          "Unable to connect to the server. Please check your internet connection and try again."
        );

        return;
      }

      // ========================================================
      // UNKNOWN ERROR
      // ========================================================

      Alert.alert(
        "Error",
        error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setIsLoading(false);

      console.log(
        "FORGOT PASSWORD REQUEST FINISHED"
      );
    }
  };

  // ============================================================
  // EMAIL CHANGE
  // ============================================================

  const handleEmailChange = (value) => {
    setEmail(value);

    if (emailError) {
      setEmailError("");
    }
  };

  // ============================================================
  // BACK TO LOGIN
  // ============================================================

  const goBackToLogin = () => {
    if (isLoading) {
      return;
    }

    Keyboard.dismiss();

    console.log(
      "BACK TO LOGIN PRESSED"
    );

    try {
      router.replace("/Login_screen");

      console.log(
        "LOGIN NAVIGATION SENT"
      );
    } catch (routerError) {
      console.log(
        "LOGIN ROUTER ERROR =>",
        routerError
      );

      try {
        if (navigation?.navigate) {
          navigation.navigate(
            "Login_screen"
          );
        } else if (navigation?.goBack) {
          navigation.goBack();
        } else {
          Alert.alert(
            "Navigation Error",
            "Unable to open Login screen."
          );
        }
      } catch (navigationError) {
        console.log(
          "LOGIN NAVIGATION ERROR =>",
          navigationError
        );

        Alert.alert(
          "Navigation Error",
          "Unable to open Login screen."
        );
      }
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <LinearGradient
      colors={[
        "#FEF0E6",
        "#FEF8F3",
        "#FEFBEE",
      ]}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={styles.gradient}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          "top",
          "bottom",
          "left",
          "right",
        ]}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ==================================================
                BACK BUTTON
            =================================================== */}

            <TouchableOpacity
              style={styles.backButton}
              onPress={goBackToLogin}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#171717"
              />
            </TouchableOpacity>

            {/* ==================================================
                CENTER CONTENT
            =================================================== */}

            <View style={styles.content}>
              {/* ==================================================
                  LOCK ICON
              =================================================== */}

              <LinearGradient
                colors={[
                  "#FF7A00",
                  "#FFC107",
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
                  styles.lockIconContainer
                }
              >
                <Ionicons
                  name="lock-open-outline"
                  size={42}
                  color="#FFFFFF"
                />
              </LinearGradient>

              {/* ==================================================
                  TITLE
              =================================================== */}

              <Text style={styles.title}>
                Forgot Password
              </Text>

              {/* ==================================================
                  SUBTITLE
              =================================================== */}

              <Text style={styles.subtitle}>
                Enter your registered email to{"\n"}
                receive OTP
              </Text>

              {/* ==================================================
                  CARD
              =================================================== */}

              <View style={styles.card}>
                {/* EMAIL LABEL */}

                <Text style={styles.label}>
                  Email Address
                </Text>

                {/* EMAIL INPUT */}

                <View
                  style={[
                    styles.inputContainer,
                    emailError
                      ? styles.inputError
                      : null,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={21}
                    color={
                      emailError
                        ? "#E53935"
                        : "#777777"
                    }
                  />

                  <TextInput
                    value={email}
                    onChangeText={
                      handleEmailChange
                    }
                    placeholder="Email address"
                    placeholderTextColor="#999999"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={sendOtp}
                    style={styles.input}
                  />
                </View>

                {/* EMAIL ERROR */}

                {emailError ? (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {emailError}
                  </Text>
                ) : null}

                {/* ==================================================
                    SEND OTP BUTTON
                =================================================== */}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={sendOtp}
                  disabled={isLoading}
                  style={[
                    styles.sendButtonWrapper,
                    isLoading
                      ? styles.disabledButton
                      : null,
                  ]}
                >
                  <LinearGradient
                    colors={[
                      "#FF7A00",
                      "#FFC107",
                    ]}
                    start={{
                      x: 0,
                      y: 0,
                    }}
                    end={{
                      x: 1,
                      y: 0,
                    }}
                    style={
                      styles.sendButton
                    }
                  >
                    {isLoading ? (
                      <>
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.sendButtonText
                          }
                        >
                          Sending...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name="send-outline"
                          size={20}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.sendButtonText
                          }
                        >
                          Send OTP
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* ==================================================
                    BACK TO LOGIN
                =================================================== */}

                <TouchableOpacity
                  onPress={
                    goBackToLogin
                  }
                  disabled={isLoading}
                  style={
                    styles.loginButton
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.loginButtonText
                    }
                  >
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  gradient: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },

  // ============================================================
  // BACK BUTTON
  // ============================================================

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(255,255,255,0.65)",

    marginBottom: 20,
  },

  // ============================================================
  // CONTENT
  // ============================================================

  content: {
    width: "100%",
    maxWidth: 500,

    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",

    flex: 1,
  },

  // ============================================================
  // LOCK ICON
  // ============================================================

  lockIconContainer: {
    width: 90,
    height: 90,

    borderRadius: 28,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#FF7A00",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.2,
    shadowRadius: 12,

    elevation: 7,
  },

  // ============================================================
  // TITLE
  // ============================================================

  title: {
    marginTop: 24,

    fontSize: 26,
    lineHeight: 32,

    fontWeight: "800",

    color: "#171717",

    textAlign: "center",
  },

  // ============================================================
  // SUBTITLE
  // ============================================================

  subtitle: {
    marginTop: 10,

    maxWidth: 330,

    fontSize: 14,
    lineHeight: 21,

    color: "rgba(0,0,0,0.54)",

    textAlign: "center",
  },

  // ============================================================
  // CARD
  // ============================================================

  card: {
    width: "100%",

    marginTop: 32,

    padding: 24,

    borderRadius: 22,

    backgroundColor:
      "rgba(255,255,255,0.78)",

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.9)",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.08,

    shadowRadius: 20,

    elevation: 5,
  },

  // ============================================================
  // LABEL
  // ============================================================

  label: {
    marginBottom: 8,

    fontSize: 13,

    fontWeight: "600",

    color: "#444444",
  },

  // ============================================================
  // INPUT
  // ============================================================

  inputContainer: {
    minHeight: 54,

    paddingHorizontal: 14,

    borderRadius: 12,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor:
      "rgba(255,255,255,0.9)",

    borderWidth: 1,

    borderColor: "#E2E2E2",
  },

  inputError: {
    borderColor: "#E53935",
  },

  input: {
    flex: 1,

    marginLeft: 10,

    paddingVertical: 0,

    fontSize: 15,

    color: "#171717",
  },

  errorText: {
    marginTop: 6,

    marginLeft: 4,

    fontSize: 12,

    color: "#E53935",
  },

  // ============================================================
  // SEND BUTTON
  // ============================================================

  sendButtonWrapper: {
    width: "100%",

    marginTop: 24,

    borderRadius: 14,

    shadowColor: "#FF7A00",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.2,

    shadowRadius: 10,

    elevation: 4,
  },

  disabledButton: {
    opacity: 0.65,
  },

  sendButton: {
    height: 54,

    borderRadius: 14,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  sendButtonText: {
    marginLeft: 9,

    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "700",
  },

  // ============================================================
  // BACK TO LOGIN
  // ============================================================

  loginButton: {
    marginTop: 12,

    minHeight: 44,

    alignItems: "center",

    justifyContent: "center",
  },

  loginButtonText: {
    color: "#FF7A00",

    fontSize: 14,

    fontWeight: "600",
  },
});

export default ForgotPasswordScreen;
