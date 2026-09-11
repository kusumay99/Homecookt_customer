import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://api.homecookt.com";

const ResetPasswordScreen = ({ navigation, route }) => {
  // ============================================================
  // EMAIL FROM NAVIGATION
  // ============================================================

  const email = route?.params?.email || route?.params?.value || "";

  // ============================================================
  // STATE
  // ============================================================

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] =
    useState(true);

  const [errors, setErrors] = useState({});

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    const newErrors = {};

    if (!otp.trim()) {
      newErrors.otp = "Enter OTP";
    }

    if (!password.trim()) {
      newErrors.password = "Enter password";
    } else if (password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // RESET PASSWORD API
  // ============================================================

  const resetPassword = async () => {
    Keyboard.dismiss();

    // ----------------------------------------------------------
    // Validate email
    // ----------------------------------------------------------

    if (!email || !email.trim()) {
      Alert.alert(
        "Error",
        "Email is missing. Please restart the forgot password process."
      );
      return;
    }

    // ----------------------------------------------------------
    // Validate form
    // ----------------------------------------------------------

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // ----------------------------------------------------------
    // Request body
    // ----------------------------------------------------------

    const requestBody = {
      email: email.trim(),
      otp: otp.trim(),
      new_password: password.trim(),
    };

    // ----------------------------------------------------------
    // Debug logs
    // ----------------------------------------------------------

    console.log("====================================");
    console.log("RESET PASSWORD API");
    console.log("====================================");
    console.log(
      "URL:",
      `${BASE_URL}/api/v1/users/reset-password`
    );
    console.log("REQUEST:", requestBody);

    try {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);

      const response = await fetch(
        `${BASE_URL}/api/v1/users/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      // --------------------------------------------------------
      // Parse response
      // --------------------------------------------------------

      let data = {};

      try {
        data = await response.json();
      } catch (error) {
        data = {
          message: "Invalid server response",
        };
      }

      console.log("STATUS:", response.status);
      console.log("RESPONSE:", data);

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      if (response.status === 200) {
        Alert.alert(
          "Success",
          data?.message || "Password reset successful",
          [
            {
              text: "OK",
              onPress: () => {
                // Remove all previous screens
                // and return to Login
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "Login",
                    },
                  ],
                });
              },
            },
          ]
        );

        return;
      }

      // --------------------------------------------------------
      // API ERROR
      // --------------------------------------------------------

      const errorMessage =
        data?.message ||
        data?.error ||
        `Reset failed (${response.status})`;

      Alert.alert("Reset Failed", errorMessage);
    } catch (error) {
      console.log("RESET PASSWORD ERROR:", error);

      if (error?.name === "AbortError") {
        Alert.alert(
          "Connection Timeout",
          "The server took too long to respond. Please try again."
        );
      } else {
        Alert.alert(
          "Connection Error",
          error?.message ||
            "Unable to connect to the server. Please check your internet connection."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // INPUT ERROR CLEAR
  // ============================================================

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: null,
      }));
    }
  };

  // ============================================================
  // INVALID NAVIGATION
  // ============================================================

  if (!email) {
    return (
      <View style={styles.invalidContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FEF0E6"
        />

        <Ionicons
          name="alert-circle-outline"
          size={60}
          color="#E86A17"
        />

        <Text style={styles.invalidTitle}>
          Invalid Navigation
        </Text>

        <Text style={styles.invalidText}>
          Email information was not provided.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FEF0E6"
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
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
          {/* ================================================= */}
          {/* BACK BUTTON */}
          {/* ================================================= */}

          <TouchableOpacity
            style={styles.topBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#111111"
            />
          </TouchableOpacity>

          {/* ================================================= */}
          {/* MAIN CONTENT */}
          {/* ================================================= */}

          <View style={styles.content}>
            {/* ================================================= */}
            {/* ICON */}
            {/* ================================================= */}

            <LinearGradient
              colors={[
                "#FF7A18",
                "#F5B83D",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.iconContainer}
            >
              <Ionicons
                name="lock-open-outline"
                size={42}
                color="#FFFFFF"
              />
            </LinearGradient>

            {/* ================================================= */}
            {/* TITLE */}
            {/* ================================================= */}

            <Text style={styles.title}>
              Reset Password
            </Text>

            <Text style={styles.email}>
              {email}
            </Text>

            {/* ================================================= */}
            {/* CARD */}
            {/* ================================================= */}

            <View style={styles.card}>
              {/* ================================================= */}
              {/* OTP */}
              {/* ================================================= */}

              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.otp &&
                      styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={21}
                    color="#777777"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor="#999999"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      clearError("otp");
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isLoading}
                  />
                </View>

                {errors.otp ? (
                  <Text style={styles.errorText}>
                    {errors.otp}
                  </Text>
                ) : null}
              </View>

              {/* ================================================= */}
              {/* PASSWORD */}
              {/* ================================================= */}

              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.password &&
                      styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={21}
                    color="#777777"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#999999"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearError("password");
                    }}
                    secureTextEntry={
                      obscurePassword
                    }
                    autoCapitalize="none"
                    editable={!isLoading}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() =>
                      setObscurePassword(
                        (previous) =>
                          !previous
                      )
                    }
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={
                        obscurePassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={22}
                      color="#777777"
                    />
                  </TouchableOpacity>
                </View>

                {errors.password ? (
                  <Text style={styles.errorText}>
                    {errors.password}
                  </Text>
                ) : null}
              </View>

              {/* ================================================= */}
              {/* CONFIRM PASSWORD */}
              {/* ================================================= */}

              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.confirmPassword &&
                      styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={21}
                    color="#777777"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#999999"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearError(
                        "confirmPassword"
                      );
                    }}
                    secureTextEntry={
                      obscureConfirmPassword
                    }
                    autoCapitalize="none"
                    editable={!isLoading}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() =>
                      setObscureConfirmPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={
                        obscureConfirmPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={22}
                      color="#777777"
                    />
                  </TouchableOpacity>
                </View>

                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>
                    {errors.confirmPassword}
                  </Text>
                ) : null}
              </View>

              {/* ================================================= */}
              {/* RESET BUTTON */}
              {/* ================================================= */}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={resetPassword}
                disabled={isLoading}
                style={[
                  styles.resetButtonWrapper,
                  isLoading &&
                    styles.disabledButton,
                ]}
              >
                <LinearGradient
                  colors={[
                    "#FF7A18",
                    "#F5B83D",
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 0,
                  }}
                  style={styles.resetButton}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={22}
                        color="#FFFFFF"
                      />

                      <Text style={styles.buttonText}>
                        Reset Password
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  topBackButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.75)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? 10 : 25,
    marginBottom: 10,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  // ============================================================
  // ICON
  // ============================================================

  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#E86A17",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  // ============================================================
  // TITLE
  // ============================================================

  title: {
    marginTop: 24,
    fontSize: 27,
    fontWeight: "800",
    color: "#111111",
    textAlign: "center",
  },

  email: {
    marginTop: 8,
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },

  // ============================================================
  // CARD
  // ============================================================

  card: {
    width: "100%",
    maxWidth: 500,
    marginTop: 32,

    backgroundColor: "rgba(255,255,255,0.82)",

    borderRadius: 24,

    padding: 24,

    borderWidth: 1,
    borderColor: "rgba(245,184,61,0.18)",

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
  // INPUT
  // ============================================================

  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },

  inputWrapper: {
    width: "100%",
    minHeight: 56,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E6E6E6",

    borderRadius: 14,

    paddingHorizontal: 14,
  },

  inputError: {
    borderColor: "#E53935",
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,

    minHeight: 54,

    fontSize: 15,
    color: "#222222",

    paddingVertical: 0,
  },

  eyeButton: {
    width: 40,
    height: 50,

    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },

  // ============================================================
  // RESET BUTTON
  // ============================================================

  resetButtonWrapper: {
    width: "100%",
    marginTop: 8,

    borderRadius: 15,

    overflow: "hidden",

    shadowColor: "#E86A17",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  resetButton: {
    height: 56,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 9,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.65,
  },

  // ============================================================
  // INVALID NAVIGATION
  // ============================================================

  invalidContainer: {
    flex: 1,

    backgroundColor: "#FEF5EE",

    alignItems: "center",
    justifyContent: "center",

    padding: 30,
  },

  invalidTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "800",
    color: "#222222",
  },

  invalidText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },

  backButton: {
    marginTop: 25,

    paddingHorizontal: 25,
    paddingVertical: 13,

    borderRadius: 12,

    backgroundColor: "#F28C28",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default ResetPasswordScreen;