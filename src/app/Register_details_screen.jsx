import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import * as Location from "expo-location";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// REGISTER DETAILS SCREEN
// ============================================================

const RegisterDetailsScreen = ({ route, navigation }) => {
  // ==========================================================
  // SELECTED ROLES
  // ==========================================================

  const selectedRoles =
    route?.params?.selectedRoles || ["customer"];

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [isLoading, setIsLoading] = useState(false);

  const [obscurePassword, setObscurePassword] =
    useState(true);

  const [obscureConfirm, setObscureConfirm] =
    useState(true);

  // ==========================================================
  // VALIDATION STATE
  // ==========================================================

  const [emailError, setEmailError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [passwordError, setPasswordError] =
    useState("");
  const [confirmPasswordError, setConfirmPasswordError] =
    useState("");

  // ==========================================================
  // COUNTRY DETECTION
  // ==========================================================

  useEffect(() => {
    detectCountry();
  }, []);

  // ==========================================================
  // DETECT COUNTRY
  // ==========================================================

  const detectCountry = async () => {
    try {
      // ------------------------------------------------------
      // Check whether location services are enabled
      // ------------------------------------------------------

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        console.log(
          "Location services are disabled"
        );

        setCountry("IN");
        return;
      }

      // ------------------------------------------------------
      // Check permission
      // ------------------------------------------------------

      let { status } =
        await Location.getForegroundPermissionsAsync();

      // ------------------------------------------------------
      // Request permission if not granted
      // ------------------------------------------------------

      if (status !== "granted") {
        const permissionResponse =
          await Location.requestForegroundPermissionsAsync();

        status = permissionResponse.status;
      }

      // ------------------------------------------------------
      // Permission denied
      // ------------------------------------------------------

      if (status !== "granted") {
        console.log(
          "Location permission denied"
        );

        setCountry("IN");
        return;
      }

      // ------------------------------------------------------
      // Get current position
      // ------------------------------------------------------

      const location =
        await Location.getCurrentPositionAsync({
          accuracy:
            Location.Accuracy.High,
        });

      console.log(
        "LATITUDE =>",
        location.coords.latitude
      );

      console.log(
        "LONGITUDE =>",
        location.coords.longitude
      );

      // ------------------------------------------------------
      // Reverse geocode
      // ------------------------------------------------------

      const results =
        await Location.reverseGeocodeAsync({
          latitude:
            location.coords.latitude,

          longitude:
            location.coords.longitude,
        });

      console.log(
        "GEOCODING RESULT =>",
        results
      );

      if (
        results &&
        results.length > 0
      ) {
        const detectedCountry =
          results[0]?.isoCountryCode;

        if (detectedCountry) {
          setCountry(
            detectedCountry.toUpperCase()
          );
        } else {
          setCountry("IN");
        }
      } else {
        setCountry("IN");
      }
    } catch (error) {
      console.log(
        "COUNTRY DETECTION ERROR =>",
        error
      );

      // ------------------------------------------------------
      // Same fallback as Flutter
      // ------------------------------------------------------

      setCountry("IN");
    }
  };

  // ==========================================================
  // EMAIL VALIDATION
  // ==========================================================

  const validateEmail = (value) => {
    const trimmedValue =
      value.trim();

    if (!trimmedValue) {
      return "Required";
    }

    const emailRegex =
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!emailRegex.test(trimmedValue)) {
      return "Enter valid email";
    }

    return "";
  };

  // ==========================================================
  // PASSWORD VALIDATION
  // ==========================================================

  const validatePassword = (value) => {
    if (!value.trim()) {
      return "Required";
    }

    if (value.length < 8) {
      return "Minimum 8 characters";
    }

    return "";
  };

  // ==========================================================
  // CONFIRM PASSWORD VALIDATION
  // ==========================================================

  const validateConfirmPassword = (
    value
  ) => {
    if (!value.trim()) {
      return "Required";
    }

    if (value !== password) {
      return "Passwords do not match";
    }

    return "";
  };

  // ==========================================================
  // HANDLE EMAIL CHANGE
  // ==========================================================

  const handleEmailChange = (value) => {
    setEmail(value);

    if (emailError) {
      setEmailError(
        validateEmail(value)
      );
    }
  };

  // ==========================================================
  // HANDLE PASSWORD CHANGE
  // ==========================================================

  const handlePasswordChange = (
    value
  ) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError(
        validatePassword(value)
      );
    }

    if (confirmPassword) {
      setConfirmPasswordError(
        validateConfirmPassword(
          confirmPassword
        )
      );
    }
  };

  // ==========================================================
  // HANDLE CONFIRM PASSWORD CHANGE
  // ==========================================================

  const handleConfirmPasswordChange = (
    value
  ) => {
    setConfirmPassword(value);

    if (confirmPasswordError) {
      setConfirmPasswordError(
        validateConfirmPassword(
          value
        )
      );
    }
  };

  // ==========================================================
  // VALIDATE FORM
  // ==========================================================

  const validateForm = () => {
    const emailValidation =
      validateEmail(email);

    const passwordValidation =
      validatePassword(password);

    const confirmValidation =
      validateConfirmPassword(
        confirmPassword
      );

    let valid = true;

    if (emailValidation) {
      setEmailError(
        emailValidation
      );
      valid = false;
    } else {
      setEmailError("");
    }

    if (!country.trim()) {
      setCountryError("Required");
      valid = false;
    } else {
      setCountryError("");
    }

    if (passwordValidation) {
      setPasswordError(
        passwordValidation
      );
      valid = false;
    } else {
      setPasswordError("");
    }

    if (confirmValidation) {
      setConfirmPasswordError(
        confirmValidation
      );
      valid = false;
    } else {
      setConfirmPasswordError("");
    }

    return valid;
  };

  // ==========================================================
  // SHOW MESSAGE
  // ==========================================================

  const showMessage = (
    message,
    success = false
  ) => {
    Alert.alert(
      success ? "Success" : "Error",
      message
    );
  };

  // ==========================================================
  // REGISTER USER
  // ==========================================================

  const registerUser = async () => {
    Keyboard.dismiss();

    // --------------------------------------------------------
    // Validate form
    // --------------------------------------------------------

    if (!validateForm()) {
      return;
    }

    // --------------------------------------------------------
    // Prevent duplicate requests
    // --------------------------------------------------------

    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      // ------------------------------------------------------
      // Request body
      // ------------------------------------------------------

      const requestBody = {
        email: email.trim(),

        country: country
          .trim()
          .toUpperCase(),

        password: password.trim(),

        // ----------------------------------------------------
        // Same behavior as your Flutter code.
        //
        // It always sends customer.
        // ----------------------------------------------------

        role: ["customer"],
      };

      console.log(
        "SIGNUP REQUEST =>",
        requestBody
      );

      // ------------------------------------------------------
      // 20 second timeout
      // ------------------------------------------------------

      const controller =
        new AbortController();

      const timeoutId =
        setTimeout(() => {
          controller.abort();
        }, 20000);

      let response;

      try {
        response = await fetch(
          `${BASE_URL}/api/v1/users/signup`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify(
              requestBody
            ),

            signal:
              controller.signal,
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      // ------------------------------------------------------
      // Read response
      // ------------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        "Signup Status:",
        response.status
      );

      console.log(
        "Signup Body:",
        responseText
      );

      // ------------------------------------------------------
      // Parse response
      // ------------------------------------------------------

      let data = {};

      try {
        data =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      } catch (error) {
        console.log(
          "SIGNUP JSON ERROR =>",
          error
        );

        data = {
          message:
            "Something went wrong",
        };
      }

      // ------------------------------------------------------
      // Success
      // ------------------------------------------------------

      if (
        response.status === 200 ||
        response.status === 201
      ) {
        const message =
          data?.message ||
          "OTP sent successfully";

        showMessage(
          message,
          true
        );

        // ----------------------------------------------------
        // Navigate to OTP screen
        //
        // The OTP screen created earlier expects:
        //
        // route.params.method
        // route.params.value
        //
        // ----------------------------------------------------

        navigation.navigate(
          "OTP",
          {
            method: "email",
            value: email.trim(),
          }
        );
      } else {
        // ----------------------------------------------------
        // API error
        // ----------------------------------------------------

        const message =
          data?.message ||
          data?.detail ||
          data?.error ||
          "Registration failed";

        showMessage(message);
      }
    } catch (error) {
      console.log(
        "REGISTER ERROR =>",
        error
      );

      // ------------------------------------------------------
      // Timeout
      // ------------------------------------------------------

      if (
        error?.name ===
        "AbortError"
      ) {
        showMessage(
          "Request timed out"
        );

        return;
      }

      // ------------------------------------------------------
      // Network error
      // ------------------------------------------------------

      if (
        error?.message
          ?.toLowerCase()
          .includes("network")
      ) {
        showMessage(
          "No internet connection"
        );

        return;
      }

      // ------------------------------------------------------
      // General error
      // ------------------------------------------------------

      showMessage(
        `Error: ${
          error?.message ||
          "Something went wrong"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // ROLE BADGE
  // ==========================================================

  const renderRoleBadge = (
    role,
    index
  ) => {
    return (
      <View
        key={`${role}-${index}`}
        style={styles.roleBadge}
      >
        <Text
          style={styles.roleText}
        >
          {role
            ?.toString()
            .toUpperCase()}
        </Text>
      </View>
    );
  };

  // ==========================================================
  // TEXT INPUT
  // ==========================================================

  const renderInput = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    onToggleSecure,
    editable = true,
    keyboardType = "default",
    autoCapitalize = "none",
    error,
  }) => {
    return (
      <View
        style={styles.inputContainer}
      >
        <View
          style={[
            styles.inputWrapper,
            error &&
              styles.inputWrapperError,
          ]}
        >
          {/* ICON */}

          <Ionicons
            name={icon}
            size={21}
            color={COLORS.orange}
            style={styles.inputIcon}
          />

          {/* INPUT */}

          <TextInput
            style={styles.input}
            placeholder={
              placeholder
            }
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={
              onChangeText
            }
            secureTextEntry={
              secureTextEntry
            }
            editable={editable}
            keyboardType={
              keyboardType
            }
            autoCapitalize={
              autoCapitalize
            }
            autoCorrect={false}
            returnKeyType="next"
          />

          {/* PASSWORD EYE */}

          {onToggleSecure && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                onToggleSecure
              }
              style={
                styles.eyeButton
              }
            >
              <Ionicons
                name={
                  secureTextEntry
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#6B7280"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ERROR */}

        {error ? (
          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  };

  // ==========================================================
  // SCREEN
  // ==========================================================

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          COLORS.background1
        }
      />

      {/* ======================================================
          BACKGROUND GRADIENT
      ====================================================== */}

      <LinearGradient
        colors={[
          COLORS.background1,
          COLORS.background2,
          COLORS.background3,
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
          StyleSheet.absoluteFill
        }
      />

      {/* ======================================================
          KEYBOARD AVOIDING VIEW
      ====================================================== */}

      <KeyboardAvoidingView
        style={
          styles.keyboardContainer
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* ==================================================
              TOP SPACING
          ================================================== */}

          <View
            style={
              styles.topSpacing
            }
          />

          {/* ==================================================
              ICON
          ================================================== */}

          <View
            style={
              styles.iconContainer
            }
          >
            <LinearGradient
              colors={[
                COLORS.iconOrange,
                COLORS.iconGold,
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
                styles.iconGradient
              }
            >
              <Ionicons
                name="person-add-outline"
                size={42}
                color={
                  COLORS.white
                }
              />
            </LinearGradient>
          </View>

          {/* ==================================================
              TITLE
          ================================================== */}

          <Text
            style={styles.title}
          >
            Create Account
          </Text>

          {/* ==================================================
              ROLE BADGES
          ================================================== */}

          <View
            style={
              styles.rolesContainer
            }
          >
            {selectedRoles.map(
              (
                role,
                index
              ) =>
                renderRoleBadge(
                  role,
                  index
                )
            )}
          </View>

          {/* ==================================================
              FORM CARD
          ================================================== */}

          <View
            style={styles.formCard}
          >
            {/* EMAIL */}

            {renderInput({
              icon:
                "mail-outline",

              placeholder:
                "Email Address",

              value: email,

              onChangeText:
                handleEmailChange,

              keyboardType:
                "email-address",

              autoCapitalize:
                "none",

              error:
                emailError,
            })}

            {/* COUNTRY */}

            {renderInput({
              icon:
                "flag-outline",

              placeholder:
                country
                  ? "Country"
                  : "Detecting Country...",

              value: country,

              onChangeText:
                setCountry,

              editable: false,

              autoCapitalize:
                "characters",

              error:
                countryError,
            })}

            {/* PASSWORD */}

            {renderInput({
              icon:
                "lock-closed-outline",

              placeholder:
                "Password",

              value: password,

              onChangeText:
                handlePasswordChange,

              secureTextEntry:
                obscurePassword,

              onToggleSecure:
                () =>
                  setObscurePassword(
                    (previous) =>
                      !previous
                  ),

              error:
                passwordError,
            })}

            {/* CONFIRM PASSWORD */}

            {renderInput({
              icon:
                "lock-closed-outline",

              placeholder:
                "Confirm Password",

              value:
                confirmPassword,

              onChangeText:
                handleConfirmPasswordChange,

              secureTextEntry:
                obscureConfirm,

              onToggleSecure:
                () =>
                  setObscureConfirm(
                    (previous) =>
                      !previous
                  ),

              error:
                confirmPasswordError,
            })}

            {/* =================================================
                CREATE ACCOUNT BUTTON
            ================================================= */}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading}
              onPress={
                registerUser
              }
              style={
                styles.buttonContainer
              }
            >
              <LinearGradient
                colors={[
                  COLORS.buttonOrange,
                  COLORS.buttonGold,
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 0,
                }}
                style={[
                  styles.createButton,
                  isLoading &&
                    styles.buttonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.white
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Create Account
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}

          <View
            style={
              styles.bottomSpacing
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  orange: "#F97316",
  gold: "#F59E0B",

  iconOrange: "#FF7A18",
  iconGold: "#FFB347",

  buttonOrange: "#FF7A18",
  buttonGold: "#FF9F43",

  background1: "#FEF0E6",
  background2: "#FEF8F3",
  background3: "#FEFBEE",

  white: "#FFFFFF",

  foreground: "#1F2937",

  error: "#DC2626",
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // MAIN
  // ==========================================================

  container: {
    flex: 1,

    backgroundColor:
      COLORS.background1,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 24,

    paddingBottom: 40,
  },

  topSpacing: {
    height: 20,
  },

  // ==========================================================
  // TOP ICON
  // ==========================================================

  iconContainer: {
    alignItems: "center",

    marginTop: 5,
  },

  iconGradient: {
    width: 90,
    height: 90,

    borderRadius: 30,

    alignItems: "center",
    justifyContent: "center",

    shadowColor:
      COLORS.orange,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.25,

    shadowRadius: 12,

    elevation: 5,
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    marginTop: 25,

    textAlign: "center",

    fontSize: 30,

    fontWeight: "700",

    color: COLORS.foreground,
  },

  // ==========================================================
  // ROLES
  // ==========================================================

  rolesContainer: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent:
      "center",

    alignItems: "center",

    marginTop: 10,

    gap: 8,
  },

  roleBadge: {
    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 30,

    backgroundColor:
      "#FFEDD5",
  },

  roleText: {
    color:
      COLORS.orange,

    fontSize: 13,

    fontWeight: "700",
  },

  // ==========================================================
  // FORM CARD
  // ==========================================================

  formCard: {
    marginTop: 30,

    padding: 24,

    backgroundColor:
      COLORS.white,

    borderRadius: 30,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.08,

    shadowRadius: 20,

    elevation: 5,
  },

  // ==========================================================
  // INPUT CONTAINER
  // ==========================================================

  inputContainer: {
    marginBottom: 18,
  },

  // ==========================================================
  // INPUT WRAPPER
  // ==========================================================

  inputWrapper: {
    height: 56,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor:
      "#F3F4F6",

    borderRadius: 18,

    borderWidth: 2,

    borderColor:
      "transparent",
  },

  inputWrapperError: {
    borderColor:
      "#FCA5A5",
  },

  // ==========================================================
  // INPUT ICON
  // ==========================================================

  inputIcon: {
    marginLeft: 16,

    marginRight: 10,
  },

  // ==========================================================
  // INPUT
  // ==========================================================

  input: {
    flex: 1,

    height: "100%",

    fontSize: 15,

    color:
      COLORS.foreground,

    paddingVertical: 0,

    paddingHorizontal: 0,
  },

  // ==========================================================
  // EYE BUTTON
  // ==========================================================

  eyeButton: {
    width: 50,

    height: 56,

    alignItems: "center",

    justifyContent: "center",
  },

  // ==========================================================
  // ERROR
  // ==========================================================

  errorText: {
    marginTop: 5,

    marginLeft: 8,

    color: COLORS.error,

    fontSize: 12,

    fontWeight: "500",
  },

  // ==========================================================
  // BUTTON
  // ==========================================================

  buttonContainer: {
    width: "100%",

    height: 58,

    marginTop: 10,

    borderRadius: 18,

    overflow: "hidden",
  },

  createButton: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 18,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color:
      COLORS.white,

    fontSize: 18,

    fontWeight: "700",
  },

  // ==========================================================
  // BOTTOM
  // ==========================================================

  bottomSpacing: {
    height: 40,
  },
});

export default RegisterDetailsScreen;