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
import { useLocalSearchParams, useRouter } from "expo-router";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// COLORS
// ============================================================

const COLORS = {
  orange: "#F97316",
  gold: "#FBBF24",

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
// REGISTER DETAILS SCREEN
// ============================================================

const RegisterDetailsScreen = () => {
  const router = useRouter();

  const params = useLocalSearchParams();

  // ==========================================================
  // SELECTED ROLES
  // ==========================================================

  let selectedRoles = ["customer"];

  try {
    if (params?.selectedRoles) {
      if (
        Array.isArray(
          params.selectedRoles
        )
      ) {
        selectedRoles =
          params.selectedRoles;
      } else if (
        typeof params.selectedRoles ===
        "string"
      ) {
        try {
          const parsed =
            JSON.parse(
              params.selectedRoles
            );

          if (
            Array.isArray(parsed)
          ) {
            selectedRoles = parsed;
          } else if (
            parsed
          ) {
            selectedRoles = [parsed];
          }
        } catch {
          selectedRoles = [
            params.selectedRoles,
          ];
        }
      }
    }
  } catch (error) {
    console.log(
      "ROLE PARAM ERROR =>",
      error
    );
  }

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [email, setEmail] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  // ==========================================================
  // TERMS
  // ==========================================================

  const [
    termsAccepted,
    setTermsAccepted,
  ] = useState(false);

  const [
    termsError,
    setTermsError,
  ] = useState("");

  // ==========================================================
  // LOADING
  // ==========================================================

  const [isLoading, setIsLoading] =
    useState(false);

  // ==========================================================
  // PASSWORD VISIBILITY
  // ==========================================================

  const [
    obscurePassword,
    setObscurePassword,
  ] = useState(true);

  const [
    obscureConfirm,
    setObscureConfirm,
  ] = useState(true);

  // ==========================================================
  // VALIDATION ERRORS
  // ==========================================================

  const [emailError, setEmailError] =
    useState("");

  const [
    countryError,
    setCountryError,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    confirmPasswordError,
    setConfirmPasswordError,
  ] = useState("");

  // ==========================================================
  // DETECT COUNTRY ON SCREEN LOAD
  // ==========================================================

  useEffect(() => {
    detectCountry();
  }, []);

  // ==========================================================
  // COUNTRY DETECTION
  // ==========================================================

  const detectCountry = async () => {
    try {
      console.log(
        "COUNTRY DETECTION STARTED"
      );

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        console.log(
          "LOCATION SERVICES DISABLED"
        );

        setCountry("IN");
        return;
      }

      let permission =
        await Location.getForegroundPermissionsAsync();

      if (
        permission.status !==
        "granted"
      ) {
        permission =
          await Location.requestForegroundPermissionsAsync();
      }

      if (
        permission.status !==
        "granted"
      ) {
        console.log(
          "LOCATION PERMISSION DENIED"
        );

        // Default country
        setCountry("IN");
        return;
      }

      const location =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,
          }
        );

      console.log(
        "LATITUDE =>",
        location.coords.latitude
      );

      console.log(
        "LONGITUDE =>",
        location.coords.longitude
      );

      const results =
        await Location.reverseGeocodeAsync(
          {
            latitude:
              location.coords
                .latitude,

            longitude:
              location.coords
                .longitude,
          }
        );

      console.log(
        "REVERSE GEOCODE =>",
        results
      );

      if (
        results &&
        results.length > 0
      ) {
        const detectedCountry =
          results[0]
            ?.isoCountryCode;

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

      // India fallback
      setCountry("IN");
    }
  };

  // ==========================================================
  // EMAIL VALIDATION
  // ==========================================================

  const validateEmail = (
    value
  ) => {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return "Required";
    }

    const emailRegex =
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (
      !emailRegex.test(
        trimmed
      )
    ) {
      return "Enter a valid email address";
    }

    return "";
  };

  // ==========================================================
  // PASSWORD VALIDATION
  // ==========================================================

  const validatePassword = (
    value
  ) => {
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
  // EMAIL CHANGE
  // ==========================================================

  const handleEmailChange = (
    value
  ) => {
    setEmail(value);

    if (emailError) {
      setEmailError(
        validateEmail(value)
      );
    }
  };

  // ==========================================================
  // PASSWORD CHANGE
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
        value ===
          confirmPassword
          ? ""
          : "Passwords do not match"
      );
    }
  };

  // ==========================================================
  // CONFIRM PASSWORD CHANGE
  // ==========================================================

  const handleConfirmPasswordChange = (
    value
  ) => {
    setConfirmPassword(value);

    if (confirmPasswordError) {
      setConfirmPasswordError(
        value === password
          ? ""
          : "Passwords do not match"
      );
    }
  };

  // ==========================================================
  // TERMS CHECKBOX
  // ==========================================================

  const toggleTerms = () => {
    setTermsAccepted(
      (previous) => {
        const next =
          !previous;

        if (next) {
          setTermsError("");
        }

        return next;
      }
    );
  };

  // ==========================================================
  // OPEN TERMS & CONDITIONS
  //
  // IMPORTANT:
  // This opens the existing Privacy Policy screen.
  //
  // Expo Router file:
  // src/app/Privacy_policy_screen.jsx
  //
  // ==========================================================

  const openTermsAndConditions =
    () => {
      router.push(
        "/Privacy_policy_screen"
      );
    };

  // ==========================================================
  // VALIDATE COMPLETE FORM
  // ==========================================================

  const validateForm = () => {
    let valid = true;

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    const emailValidation =
      validateEmail(email);

    if (emailValidation) {
      setEmailError(
        emailValidation
      );

      valid = false;
    } else {
      setEmailError("");
    }

    // --------------------------------------------------------
    // COUNTRY
    // --------------------------------------------------------

    if (!country.trim()) {
      setCountryError(
        "Country is required"
      );

      valid = false;
    } else {
      setCountryError("");
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    const passwordValidation =
      validatePassword(password);

    if (passwordValidation) {
      setPasswordError(
        passwordValidation
      );

      valid = false;
    } else {
      setPasswordError("");
    }

    // --------------------------------------------------------
    // CONFIRM PASSWORD
    // --------------------------------------------------------

    const confirmValidation =
      validateConfirmPassword(
        confirmPassword
      );

    if (confirmValidation) {
      setConfirmPasswordError(
        confirmValidation
      );

      valid = false;
    } else {
      setConfirmPasswordError("");
    }

    // --------------------------------------------------------
    // TERMS
    // --------------------------------------------------------

    if (!termsAccepted) {
      setTermsError(
        "Please accept the Terms & Conditions"
      );

      valid = false;
    } else {
      setTermsError("");
    }

    return valid;
  };

  // ==========================================================
  // REGISTER USER
  // ==========================================================

  const registerUser = async () => {
    Keyboard.dismiss();

    console.log(
      "REGISTER BUTTON PRESSED"
    );

    // --------------------------------------------------------
    // VALIDATE
    // --------------------------------------------------------

    if (!validateForm()) {
      console.log(
        "FORM VALIDATION FAILED"
      );

      return;
    }

    // --------------------------------------------------------
    // PREVENT DOUBLE REQUEST
    // --------------------------------------------------------

    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      // ------------------------------------------------------
      // REQUEST BODY
      // ------------------------------------------------------

      const requestBody = {
        email:
          email.trim(),

        country:
          country
            .trim()
            .toUpperCase(),

        password:
          password.trim(),

        role: ["customer"],
      };

      console.log(
        "SIGNUP REQUEST =>",
        requestBody
      );

      // ------------------------------------------------------
      // ABORT CONTROLLER
      // ------------------------------------------------------

      const controller =
        new AbortController();

      const timeoutId =
        setTimeout(() => {
          controller.abort();
        }, 20000);

      let response;

      try {
        response =
          await fetch(
            `${BASE_URL}/api/v1/users/signup`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body:
                JSON.stringify(
                  requestBody
                ),

              signal:
                controller.signal,
            }
          );
      } finally {
        clearTimeout(
          timeoutId
        );
      }

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        "SIGNUP STATUS =>",
        response.status
      );

      console.log(
        "SIGNUP RESPONSE =>",
        responseText
      );

      // ------------------------------------------------------
      // PARSE JSON
      // ------------------------------------------------------

      let data = {};

      if (responseText) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch (parseError) {
          console.log(
            "SIGNUP JSON PARSE ERROR =>",
            parseError
          );

          data = {};
        }
      }

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      if (
        response.status === 200 ||
        response.status === 201
      ) {
        const message =
          data?.message ||
          "Registration successful. OTP sent to your email.";

        console.log(
          "SIGNUP SUCCESS =>",
          message
        );

        Alert.alert(
          "Success",
          message,
          [
            {
              text: "OK",
              onPress: () => {
                // ------------------------------------------
                // EXPO ROUTER → OTP
                // ------------------------------------------

                router.push({
                  pathname:
                    "/OTP",

                  params: {
                    method:
                      "email",

                    value:
                      email.trim(),
                  },
                });
              },
            },
          ]
        );

        return;
      }

      // ------------------------------------------------------
      // API ERROR
      // ------------------------------------------------------

      let errorMessage =
        "Registration failed";

      if (
        typeof data?.detail ===
        "string"
      ) {
        errorMessage =
          data.detail;
      } else if (
        typeof data?.message ===
        "string"
      ) {
        errorMessage =
          data.message;
      } else if (
        typeof data?.error ===
        "string"
      ) {
        errorMessage =
          data.error;
      } else if (
        Array.isArray(
          data?.detail
        )
      ) {
        errorMessage =
          data.detail
            .map((item) => {
              if (
                typeof item ===
                "string"
              ) {
                return item;
              }

              return (
                item?.msg ||
                item?.message ||
                "Invalid input"
              );
            })
            .join("\n");
      }

      Alert.alert(
        "Registration Failed",
        errorMessage
      );
    } catch (error) {
      console.log(
        "REGISTER ERROR =>",
        error
      );

      // ------------------------------------------------------
      // TIMEOUT
      // ------------------------------------------------------

      if (
        error?.name ===
        "AbortError"
      ) {
        Alert.alert(
          "Request Timeout",
          "The server took too long to respond. Please try again."
        );

        return;
      }

      // ------------------------------------------------------
      // NETWORK
      // ------------------------------------------------------

      if (
        error?.message
          ?.toLowerCase()
          .includes(
            "network"
          )
      ) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again."
        );

        return;
      }

      // ------------------------------------------------------
      // GENERAL
      // ------------------------------------------------------

      Alert.alert(
        "Error",
        error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // INPUT COMPONENT
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
        style={
          styles.inputContainer
        }
      >
        <View
          style={[
            styles.inputWrapper,

            error &&
              styles.inputWrapperError,

            !editable &&
              styles.inputWrapperDisabled,
          ]}
        >
          {/* INPUT ICON */}

          <Ionicons
            name={icon}
            size={21}
            color={
              COLORS.orange
            }
            style={
              styles.inputIcon
            }
          />

          {/* INPUT */}

          <TextInput
            style={
              styles.input
            }
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
            editable={
              editable
            }
            keyboardType={
              keyboardType
            }
            autoCapitalize={
              autoCapitalize
            }
            autoCorrect={
              false
            }
            returnKeyType="next"
          />

          {/* EYE ICON */}

          {onToggleSecure ? (
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
          ) : null}
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
  // ROLE BADGE
  // ==========================================================

  const renderRoleBadge = (
    role,
    index
  ) => {
    return (
      <View
        key={`${role}-${index}`}
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
            styles.roleText
          }
        >
          {String(role)
            .toUpperCase()}
        </Text>
      </View>
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View
      style={
        styles.container
      }
    >
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
          KEYBOARD CONTAINER
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
              REGISTER ICON
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
            style={
              styles.title
            }
          >
            Create Account
          </Text>

          {/* ==================================================
              ROLES
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
            style={
              styles.formCard
            }
          >
            {/* =================================================
                EMAIL
            ================================================= */}

            {renderInput({
              icon:
                "mail-outline",

              placeholder:
                "Email Address",

              value:
                email,

              onChangeText:
                handleEmailChange,

              keyboardType:
                "email-address",

              autoCapitalize:
                "none",

              error:
                emailError,
            })}

            {/* =================================================
                COUNTRY
            ================================================= */}

            {renderInput({
              icon:
                "flag-outline",

              placeholder:
                country
                  ? "Country"
                  : "Detecting Country...",

              value:
                country,

              onChangeText:
                setCountry,

              editable:
                false,

              autoCapitalize:
                "characters",

              error:
                countryError,
            })}

            {/* =================================================
                PASSWORD
            ================================================= */}

            {renderInput({
              icon:
                "lock-closed-outline",

              placeholder:
                "Password",

              value:
                password,

              onChangeText:
                handlePasswordChange,

              secureTextEntry:
                obscurePassword,

              onToggleSecure:
                () =>
                  setObscurePassword(
                    (
                      previous
                    ) =>
                      !previous
                  ),

              error:
                passwordError,
            })}

            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

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
                    (
                      previous
                    ) =>
                      !previous
                  ),

              error:
                confirmPasswordError,
            })}

            {/* =================================================
                TERMS & CONDITIONS
            ================================================= */}

            <View
              style={
                styles.termsContainer
              }
            >
              {/* CHECKBOX */}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={
                  toggleTerms
                }
                style={
                  styles.checkboxButton
                }
              >
                <View
                  style={[
                    styles.checkbox,

                    termsAccepted &&
                      styles.checkboxChecked,

                    termsError &&
                      !termsAccepted &&
                      styles.checkboxError,
                  ]}
                >
                  {termsAccepted ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={
                        COLORS.white
                      }
                    />
                  ) : null}
                </View>
              </TouchableOpacity>

              {/* TERMS TEXT */}

              <View
                style={
                  styles.termsTextContainer
                }
              >
                <Text
                  style={
                    styles.termsText
                  }
                >
                  I agree to the{" "}
                  <Text
                    style={
                      styles.termsLink
                    }
                    onPress={
                      openTermsAndConditions
                    }
                  >
                    Terms & Conditions
                  </Text>
                  {" "}and acknowledge that I have read the Privacy Policy.
                </Text>
              </View>
            </View>

            {/* TERMS ERROR */}

            {termsError ? (
              <Text
                style={
                  styles.termsErrorText
                }
              >
                {termsError}
              </Text>
            ) : null}

            {/* =================================================
                CREATE ACCOUNT BUTTON
            ================================================= */}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={
                isLoading
              }
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
                  <View
                    style={
                      styles.loadingContainer
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.white
                      }
                    />

                    <Text
                      style={
                        styles.loadingText
                      }
                    >
                      Creating Account...
                    </Text>
                  </View>
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

          {/* ==================================================
              BOTTOM SPACING
          ================================================== */}

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
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // CONTAINER
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
  // ICON
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

    color:
      COLORS.foreground,
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
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 30,

    backgroundColor:
      "#FFEDD5",

    gap: 5,
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
  // INPUT
  // ==========================================================

  inputContainer: {
    marginBottom: 18,
  },

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

  inputWrapperDisabled: {
    backgroundColor:
      "#F3F4F6",
  },

  inputIcon: {
    marginLeft: 16,

    marginRight: 10,
  },

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

    color:
      COLORS.error,

    fontSize: 12,

    fontWeight: "500",
  },

  // ==========================================================
  // TERMS
  // ==========================================================

  termsContainer: {
    flexDirection: "row",

    alignItems: "flex-start",

    marginTop: 2,

    marginBottom: 4,

    paddingHorizontal: 2,
  },

  checkboxButton: {
    width: 28,

    height: 28,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 8,
  },

  checkbox: {
    width: 21,

    height: 21,

    borderRadius: 6,

    borderWidth: 2,

    borderColor:
      "#D1D5DB",

    backgroundColor:
      COLORS.white,

    alignItems: "center",

    justifyContent: "center",
  },

  checkboxChecked: {
    backgroundColor:
      COLORS.orange,

    borderColor:
      COLORS.orange,
  },

  checkboxError: {
    borderColor:
      "#EF4444",
  },

  termsTextContainer: {
    flex: 1,

    paddingTop: 1,
  },

  termsText: {
    fontSize: 13,

    lineHeight: 20,

    color: "#6B7280",
  },

  termsLink: {
    color:
      COLORS.orange,

    fontWeight: "700",

    textDecorationLine:
      "underline",
  },

  termsErrorText: {
    marginTop: 3,

    marginLeft: 38,

    color:
      COLORS.error,

    fontSize: 12,

    fontWeight: "500",
  },

  // ==========================================================
  // BUTTON
  // ==========================================================

  buttonContainer: {
    width: "100%",

    height: 58,

    marginTop: 18,

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

  loadingContainer: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 10,
  },

  loadingText: {
    color:
      COLORS.white,

    fontSize: 15,

    fontWeight: "600",
  },

  // ==========================================================
  // BOTTOM
  // ==========================================================

  bottomSpacing: {
    height: 40,
  },
});

export default RegisterDetailsScreen;

