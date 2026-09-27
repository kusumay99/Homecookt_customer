import { useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
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
import { useLocalSearchParams, useRouter } from "expo-router";

// ============================================================
// API
// ============================================================

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// COLORS
// ============================================================

const AppColors = {
  orange: "#F97316",
  gold: "#F59E0B",
  foreground: "#1F2937",
  mutedForeground: "#6B7280",
  muted: "#F3F4F6",
  cream: "#FFF7ED",
  white: "#FFFFFF",
  background1: "#FEF0E6",
  background2: "#FEF8F3",
  border: "#E5E7EB",
  error: "#DC2626",
};

// ============================================================
// OTP SCREEN
// ============================================================

const OTPScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ==========================================================
  // EXPO ROUTER PARAMS
  // ==========================================================

  const method =
    typeof params.method === "string"
      ? params.method
      : "email";

  const value =
    typeof params.value === "string"
      ? params.value
      : "";

  const password =
    typeof params.password === "string"
      ? params.password
      : "";

  const usernameParam =
    typeof params.username === "string"
      ? params.username
      : "";

  // ==========================================================
  // OTP STATE
  // ==========================================================

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // ==========================================================
  // INPUT REFS
  // ==========================================================

  const inputRefs = useRef([]);

  // ==========================================================
  // MASK EMAIL / PHONE
  // ==========================================================

  const maskedValue = () => {
    const v = value || "";

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    if (method === "phone") {
      if (v.length > 4) {
        return `${v.substring(0, v.length - 4)}****`;
      }

      return "****";
    }

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    const at = v.indexOf("@");

    if (at > 2) {
      return `${v.substring(0, 2)}***${v.substring(at)}`;
    }

    if (at >= 0) {
      return `***${v.substring(at)}`;
    }

    return "***";
  };

  // ==========================================================
  // OTP COMPLETE
  // ==========================================================

  const isFilled = otp.every(
    (item) => item.length === 1
  );

  // ==========================================================
  // HANDLE OTP CHANGE
  // ==========================================================

  const handleChange = (text, index) => {
    // --------------------------------------------------------
    // Keep numbers only
    // --------------------------------------------------------

    const numericText = text.replace(/[^0-9]/g, "");

    // --------------------------------------------------------
    // HANDLE PASTE
    // --------------------------------------------------------

    if (numericText.length > 1) {
      const pastedDigits = numericText
        .substring(0, 6 - index)
        .split("");

      const newOtp = [...otp];

      pastedDigits.forEach((digit, i) => {
        const targetIndex = index + i;

        if (targetIndex < 6) {
          newOtp[targetIndex] = digit;
        }
      });

      setOtp(newOtp);

      const lastIndex = Math.min(
        index + pastedDigits.length - 1,
        5
      );

      if (lastIndex < 5) {
        inputRefs.current[lastIndex + 1]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }

      return;
    }

    // --------------------------------------------------------
    // SINGLE DIGIT
    // --------------------------------------------------------

    const newOtp = [...otp];

    newOtp[index] = numericText.substring(0, 1);

    setOtp(newOtp);

    // --------------------------------------------------------
    // MOVE TO NEXT BOX
    // --------------------------------------------------------

    if (
      numericText.length > 0 &&
      index < 5
    ) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ==========================================================
  // HANDLE BACKSPACE
  // ==========================================================

  const handleKeyPress = (event, index) => {
    const key = event?.nativeEvent?.key;

    if (
      key === "Backspace" &&
      otp[index] === "" &&
      index > 0
    ) {
      const newOtp = [...otp];

      newOtp[index - 1] = "";

      setOtp(newOtp);

      inputRefs.current[index - 1]?.focus();
    }
  };

  // ==========================================================
  // GET API ERROR MESSAGE
  // ==========================================================

  const getErrorMessage = (data, defaultMessage) => {
    if (
      typeof data?.detail === "string" &&
      data.detail.trim()
    ) {
      return data.detail;
    }

    if (
      typeof data?.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }

    if (
      typeof data?.error === "string" &&
      data.error.trim()
    ) {
      return data.error;
    }

    if (Array.isArray(data?.errors)) {
      const message = data.errors
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return (
            item?.msg ||
            item?.message ||
            item?.detail ||
            "Invalid input"
          );
        })
        .filter(Boolean)
        .join("\n");

      if (message) {
        return message;
      }
    }

    if (Array.isArray(data?.detail)) {
      const message = data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return (
            item?.msg ||
            item?.message ||
            item?.detail ||
            "Invalid input"
          );
        })
        .filter(Boolean)
        .join("\n");

      if (message) {
        return message;
      }
    }

    return defaultMessage;
  };

  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  const verifyOTP = async () => {
    // --------------------------------------------------------
    // Validate OTP
    // --------------------------------------------------------

    if (!isFilled) {
      Alert.alert(
        "Enter OTP",
        "Please enter the complete 6-digit verification code."
      );
      return;
    }

    // --------------------------------------------------------
    // Validate email
    // --------------------------------------------------------

    if (!value.trim()) {
      Alert.alert(
        "Error",
        "Email address is missing. Please go back and register again."
      );
      return;
    }

    // --------------------------------------------------------
    // Validate password
    //
    // Your backend verification endpoint expects password.
    // --------------------------------------------------------

    if (!password) {
      Alert.alert(
        "Error",
        "Registration password is missing. Please go back and register again."
      );
      return;
    }

    // --------------------------------------------------------
    // Prevent duplicate request
    // --------------------------------------------------------

    if (isLoading || isResending) {
      return;
    }

    try {
      setIsLoading(true);

      const cleanEmail =
        value.trim().toLowerCase();

      const cleanOTP =
        otp.join("").trim();

      // ------------------------------------------------------
      // REQUEST BODY
      // ------------------------------------------------------

      const requestBody = {
        email: cleanEmail,
        otp: cleanOTP,
        password: password,
      };

      console.log(
        "================================================"
      );

      console.log(
        "VERIFY OTP REQUEST"
      );

      console.log(
        "VERIFY OTP URL =>",
        `${BASE_URL}/api/v1/users/verify-otp`
      );

      console.log(
        "EMAIL =>",
        cleanEmail
      );

      console.log(
        "OTP =>",
        cleanOTP
      );

      console.log(
        "PASSWORD PROVIDED =>",
        !!password
      );

      console.log(
        "================================================"
      );

      // ------------------------------------------------------
      // ABORT CONTROLLER
      // ------------------------------------------------------

      const controller =
        new AbortController();

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 20000);

      let response;

      try {
        response = await fetch(
          `${BASE_URL}/api/v1/users/verify-otp`,
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
      // READ RESPONSE
      // ------------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        "VERIFY OTP STATUS =>",
        response.status
      );

      console.log(
        "VERIFY OTP RESPONSE =>",
        responseText
      );

      // ------------------------------------------------------
      // PARSE RESPONSE
      // ------------------------------------------------------

      let data = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.log(
            "VERIFY OTP JSON PARSE ERROR =>",
            parseError
          );
        }
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      if (
        response.ok &&
        (
          data?.success === true ||
          data?.status === "success" ||
          data?.message
            ?.toString()
            .toLowerCase()
            .includes("success")
        )
      ) {
        console.log(
          "================================================"
        );

        console.log(
          "OTP VERIFICATION SUCCESS"
        );

        console.log(
          "ACCOUNT CREATED SUCCESSFULLY"
        );

        console.log(
          "NO REGISTRATION TOKEN WILL BE STORED"
        );

        console.log(
          "NAVIGATING TO LOGIN SCREEN"
        );

        console.log(
          "================================================"
        );

        // ----------------------------------------------------
        // IMPORTANT:
        //
        // DO NOT STORE:
        //
        // access_token
        // refresh_token
        // user_id
        // user session
        //
        // Registration should finish at Login screen.
        // ----------------------------------------------------

        Alert.alert(
          "Account Created",
          "Your account has been created successfully. Please login to continue.",
          [
            {
              text: "OK",

              onPress: () => {
                router.replace(
                  "/Login_screen"
                );
              },
            },
          ],
          {
            cancelable: false,
          }
        );

        return;
      }

      // ======================================================
      // API ERROR
      // ======================================================

      const errorMessage =
        getErrorMessage(
          data,
          "The OTP is invalid or has expired. Please try again."
        );

      Alert.alert(
        "Verification Failed",
        errorMessage
      );
    } catch (error) {
      console.log(
        "VERIFY OTP ERROR =>",
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
      // NETWORK ERROR
      // ------------------------------------------------------

      if (
        error?.message
          ?.toLowerCase()
          .includes("network")
      ) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again."
        );

        return;
      }

      // ------------------------------------------------------
      // GENERAL ERROR
      // ------------------------------------------------------

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to verify OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // RESEND OTP
  // ==========================================================

  const resendOTP = async () => {
    // --------------------------------------------------------
    // Prevent duplicate resend
    // --------------------------------------------------------

    if (isResending || isLoading) {
      return;
    }

    // --------------------------------------------------------
    // Validate email
    // --------------------------------------------------------

    if (!value.trim()) {
      Alert.alert(
        "Error",
        "Email address is missing."
      );

      return;
    }

    try {
      setIsResending(true);

      const cleanEmail =
        value.trim().toLowerCase();

      // ------------------------------------------------------
      // USERNAME
      // ------------------------------------------------------

      const username =
        usernameParam.trim() ||
        cleanEmail.split("@")[0];

      console.log(
        "================================================"
      );

      console.log(
        "RESEND OTP REQUEST"
      );

      console.log(
        "RESEND OTP URL =>",
        `${BASE_URL}/api/v1/users/send-otp`
      );

      console.log(
        "EMAIL =>",
        cleanEmail
      );

      console.log(
        "USERNAME =>",
        username
      );

      console.log(
        "================================================"
      );

      // ------------------------------------------------------
      // ABORT CONTROLLER
      // ------------------------------------------------------

      const controller =
        new AbortController();

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 20000);

      let response;

      try {
        response = await fetch(
          `${BASE_URL}/api/v1/users/send-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              email: cleanEmail,
              username: username,
            }),

            signal:
              controller.signal,
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      // ------------------------------------------------------
      // READ RESPONSE
      // ------------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        "RESEND OTP STATUS =>",
        response.status
      );

      console.log(
        "RESEND OTP RESPONSE =>",
        responseText
      );

      // ------------------------------------------------------
      // PARSE JSON
      // ------------------------------------------------------

      let data = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.log(
            "RESEND OTP JSON PARSE ERROR =>",
            parseError
          );
        }
      }

      // ======================================================
      // RESEND SUCCESS
      // ======================================================

      if (
        response.ok &&
        (
          data?.success === true ||
          data?.status === "success" ||
          data?.message
            ?.toString()
            .toLowerCase()
            .includes("sent")
        )
      ) {
        console.log(
          "NEW OTP SENT SUCCESSFULLY"
        );

        // ----------------------------------------------------
        // Clear old OTP
        // ----------------------------------------------------

        setOtp([
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        // ----------------------------------------------------
        // Focus first OTP box
        // ----------------------------------------------------

        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);

        Alert.alert(
          "OTP Sent",
          `A new verification code has been sent to ${maskedValue()}.`
        );

        return;
      }

      // ======================================================
      // RESEND ERROR
      // ======================================================

      const errorMessage =
        getErrorMessage(
          data,
          "Unable to resend OTP. Please try again."
        );

      Alert.alert(
        "Resend Failed",
        errorMessage
      );
    } catch (error) {
      console.log(
        "RESEND OTP ERROR =>",
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
      // NETWORK ERROR
      // ------------------------------------------------------

      if (
        error?.message
          ?.toLowerCase()
          .includes("network")
      ) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again."
        );

        return;
      }

      // ------------------------------------------------------
      // GENERAL ERROR
      // ------------------------------------------------------

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to resend OTP. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  // ==========================================================
  // RENDER OTP BOX
  // ==========================================================

  const renderOTPBox = (index) => {
    const filled =
      otp[index].length > 0;

    return (
      <TextInput
        key={index}
        ref={(ref) => {
          inputRefs.current[index] = ref;
        }}
        value={otp[index]}
        onChangeText={(text) => {
          handleChange(text, index);
        }}
        onKeyPress={(event) => {
          handleKeyPress(event, index);
        }}
        keyboardType={
          Platform.OS === "ios"
            ? "number-pad"
            : "numeric"
        }
        maxLength={1}
        textAlign="center"
        selectTextOnFocus
        autoCorrect={false}
        autoCapitalize="none"
        editable={
          !isLoading &&
          !isResending
        }
        style={[
          styles.otpInput,
          filled &&
            styles.otpInputFilled,
        ]}
        placeholder=""
      />
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          AppColors.background1
        }
      />

      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <LinearGradient
        colors={[
          AppColors.background1,
          AppColors.background2,
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
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* ==================================================
              BACK BUTTON
          ================================================== */}

          <View
            style={
              styles.backButtonContainer
            }
          >
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={
                isLoading ||
                isResending
              }
              onPress={() => {
                router.back();
              }}
              style={
                styles.backButton
              }
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={
                  AppColors.foreground
                }
              />
            </TouchableOpacity>
          </View>

          {/* ==================================================
              LOCK ICON
          ================================================== */}

          <View
            style={
              styles.lockContainer
            }
          >
            <LinearGradient
              colors={[
                AppColors.orange,
                AppColors.gold,
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
                styles.lockGradient
              }
            >
              <Text
                style={
                  styles.lockEmoji
                }
              >
                🔐
              </Text>
            </LinearGradient>
          </View>

          {/* ==================================================
              TITLE
          ================================================== */}

          <Text
            style={styles.title}
          >
            Verify Your{" "}
            {method === "phone"
              ? "Phone"
              : "Email"}
          </Text>

          {/* ==================================================
              SUBTITLE
          ================================================== */}

          <Text
            style={styles.subtitle}
          >
            Enter the 6-digit code sent
            {"\n"}
            to {maskedValue()}
          </Text>

          {/* ==================================================
              OTP CARD
          ================================================== */}

          <View
            style={styles.otpCard}
          >
            {/* =================================================
                OTP INPUTS
            ================================================= */}

            <View
              style={styles.otpRow}
            >
              {otp.map(
                (_, index) =>
                  renderOTPBox(index)
              )}
            </View>

            {/* =================================================
                VERIFY BUTTON
            ================================================= */}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={
                isLoading ||
                isResending ||
                !isFilled
              }
              onPress={
                verifyOTP
              }
              style={
                styles.buttonWrapper
              }
            >
              <LinearGradient
                colors={[
                  AppColors.orange,
                  AppColors.gold,
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
                  styles.verifyButton,
                  (!isFilled ||
                    isLoading ||
                    isResending) &&
                    styles.verifyButtonDisabled,
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
                        AppColors.white
                      }
                    />

                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Verifying...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Verify & Continue
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* =================================================
                RESEND OTP
            ================================================= */}

            <View
              style={
                styles.resendRow
              }
            >
              <Text
                style={
                  styles.resendText
                }
              >
                Didn't receive the
                code?{" "}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={
                  isResending ||
                  isLoading
                }
                onPress={
                  resendOTP
                }
              >
                {isResending ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      AppColors.orange
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.resendButton
                    }
                  >
                    Resend
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
      AppColors.background1,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: "center",
  },

  // ==========================================================
  // BACK BUTTON
  // ==========================================================

  backButtonContainer: {
    alignSelf: "stretch",
  },

  backButton: {
    width: 44,
    height: 44,

    backgroundColor:
      AppColors.white,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 2,
  },

  // ==========================================================
  // LOCK ICON
  // ==========================================================

  lockContainer: {
    alignItems: "center",
    marginTop: 32,
  },

  lockGradient: {
    width: 80,
    height: 80,

    borderRadius: 24,

    alignItems: "center",
    justifyContent: "center",

    shadowColor:
      AppColors.orange,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.35,
    shadowRadius: 20,

    elevation: 8,
  },

  lockEmoji: {
    fontSize: 38,
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    marginTop: 24,

    textAlign: "center",

    fontSize: 24,

    fontWeight: "800",

    color:
      AppColors.foreground,
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    marginTop: 8,

    textAlign: "center",

    fontSize: 14,

    lineHeight: 21,

    color:
      AppColors.mutedForeground,
  },

  // ==========================================================
  // OTP CARD
  // ==========================================================

  otpCard: {
    marginTop: 32,

    padding: 24,

    backgroundColor:
      "rgba(255,255,255,0.85)",

    borderRadius: 24,

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.8)",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.06,

    shadowRadius: 15,

    elevation: 3,
  },

  // ==========================================================
  // OTP ROW
  // ==========================================================

  otpRow: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",
  },

  // ==========================================================
  // OTP INPUT
  // ==========================================================

  otpInput: {
    width: 43,
    height: 56,

    borderRadius: 14,

    backgroundColor:
      AppColors.muted,

    borderWidth: 1.5,

    borderColor:
      "transparent",

    textAlign: "center",

    fontSize: 22,

    fontWeight: "700",

    color:
      AppColors.orange,

    padding: 0,
  },

  otpInputFilled: {
    backgroundColor:
      AppColors.cream,

    borderColor:
      AppColors.orange,
  },

  // ==========================================================
  // VERIFY BUTTON
  // ==========================================================

  buttonWrapper: {
    marginTop: 24,

    width: "100%",
  },

  verifyButton: {
    height: 52,

    borderRadius: 16,

    alignItems: "center",

    justifyContent: "center",

    shadowColor:
      AppColors.orange,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.25,

    shadowRadius: 10,

    elevation: 4,
  },

  verifyButtonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color:
      AppColors.white,

    fontSize: 15,

    fontWeight: "700",
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 10,
  },

  // ==========================================================
  // RESEND
  // ==========================================================

  resendRow: {
    marginTop: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    minHeight: 24,
  },

  resendText: {
    fontSize: 13,

    color:
      AppColors.mutedForeground,
  },

  resendButton: {
    fontSize: 13,

    fontWeight: "600",

    color:
      AppColors.orange,
  },
});

// ============================================================
// EXPORT
// ============================================================

export default OTPScreen;