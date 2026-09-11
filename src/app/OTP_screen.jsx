import { useRef, useState } from "react";
import {
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
};

// ============================================================
// OTP SCREEN
// ============================================================

const OTPScreen = ({ route, navigation }) => {
  // ----------------------------------------------------------
  // Receive method and value
  //
  // Example:
  // navigation.navigate("OTP", {
  //   method: "phone",
  //   value: "+919542679596",
  // });
  //
  // OR
  //
  // navigation.navigate("OTP", {
  //   method: "email",
  //   value: "example@gmail.com",
  // });
  // ----------------------------------------------------------

  const method = route?.params?.method || "email";
  const value = route?.params?.value || "";

  // ----------------------------------------------------------
  // OTP state
  // ----------------------------------------------------------

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);

  // ----------------------------------------------------------
  // Input references
  // ----------------------------------------------------------

  const inputRefs = useRef([]);

  // ----------------------------------------------------------
  // Mask phone/email
  // ----------------------------------------------------------

  const maskedValue = () => {
    const v = value || "";

    // Phone
    if (method === "phone") {
      if (v.length > 4) {
        return `${v.substring(0, v.length - 4)}****`;
      }

      return "****";
    }

    // Email
    const at = v.indexOf("@");

    if (at > 2) {
      return `${v[0]}***${v.substring(at)}`;
    }

    if (at >= 0) {
      return `***${v.substring(at)}`;
    }

    return "***";
  };

  // ----------------------------------------------------------
  // Check whether all OTP boxes are filled
  // ----------------------------------------------------------

  const isFilled = otp.every((item) => item.length > 0);

  // ----------------------------------------------------------
  // Handle OTP input
  // ----------------------------------------------------------

  const handleChange = (text, index) => {
    // Keep only numbers
    const numericText = text.replace(/[^0-9]/g, "");

    // --------------------------------------------------------
    // If user pasted multiple digits
    // --------------------------------------------------------

    if (numericText.length > 1) {
      const pastedDigits = numericText.substring(0, 6).split("");

      const newOtp = [...otp];

      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);

      const nextIndex = Math.min(
        index + pastedDigits.length,
        5
      );

      inputRefs.current[nextIndex]?.focus();

      return;
    }

    // --------------------------------------------------------
    // Normal single digit
    // --------------------------------------------------------

    const newOtp = [...otp];

    newOtp[index] = numericText;

    setOtp(newOtp);

    // Move to next input
    if (numericText.length > 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ----------------------------------------------------------
  // Handle backspace
  // ----------------------------------------------------------

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (
      nativeEvent.key === "Backspace" &&
      otp[index] === "" &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ----------------------------------------------------------
  // Verify OTP
  // ----------------------------------------------------------

  const verifyOTP = async () => {
    if (!isFilled) {
      Alert.alert(
        "Enter OTP",
        "Please enter the complete 6-digit verification code."
      );
      return;
    }

    try {
      setIsLoading(true);

      // ------------------------------------------------------
      // Demo delay
      // ------------------------------------------------------

      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      // ------------------------------------------------------
      // IMPORTANT:
      // Replace the demo verification above with your API.
      //
      // Example:
      //
      // const response = await fetch(
      //   "https://api.homecookt.com/api/v1/users/verify-otp",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       method,
      //       value,
      //       otp: otp.join(""),
      //     }),
      //   }
      // );
      //
      // const data = await response.json();
      //
      // if (!response.ok) {
      //   throw new Error(data.detail || "Invalid OTP");
      // }
      // ------------------------------------------------------

      setIsLoading(false);

      // ------------------------------------------------------
      // Navigate to MainShell and clear navigation history
      // ------------------------------------------------------

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "MainShell",
          },
        ],
      });
    } catch (error) {
      setIsLoading(false);

      Alert.alert(
        "Verification Failed",
        error?.message || "Invalid OTP. Please try again."
      );
    }
  };

  // ----------------------------------------------------------
  // Demo behavior from Flutter
  // ----------------------------------------------------------

  const handleVerifyPress = () => {
    if (isFilled) {
      verifyOTP();
      return;
    }

    // Same demo behavior as Flutter:
    // Fill all OTP boxes with "1"
    const demoOtp = ["1", "1", "1", "1", "1", "1"];

    setOtp(demoOtp);

    verifyOTPWithDemo(demoOtp);
  };

  // ----------------------------------------------------------
  // Verify demo OTP
  // ----------------------------------------------------------

  const verifyOTPWithDemo = async (demoOtp) => {
    try {
      setIsLoading(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      setIsLoading(false);

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "MainShell",
          },
        ],
      });
    } catch (error) {
      setIsLoading(false);

      Alert.alert(
        "Verification Failed",
        error?.message || "Unable to verify OTP."
      );
    }
  };

  // ----------------------------------------------------------
  // Resend OTP
  // ----------------------------------------------------------

  const resendOTP = async () => {
    try {
      // ------------------------------------------------------
      // Replace this with your resend OTP API.
      //
      // Example:
      //
      // await fetch(
      //   "https://api.homecookt.com/api/v1/users/resend-otp",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       method,
      //       value,
      //     }),
      //   }
      // );
      // ------------------------------------------------------

      Alert.alert(
        "OTP Sent",
        `A new verification code has been sent to ${maskedValue()}.`
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error?.message || "Unable to resend OTP."
      );
    }
  };

  // ----------------------------------------------------------
  // Render OTP box
  // ----------------------------------------------------------

  const renderOTPBox = (index) => {
    const filled = otp[index].length > 0;

    return (
      <TextInput
        key={index}
        ref={(ref) => {
          inputRefs.current[index] = ref;
        }}
        value={otp[index]}
        onChangeText={(text) =>
          handleChange(text, index)
        }
        onKeyPress={(event) =>
          handleKeyPress(event, index)
        }
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
        style={[
          styles.otpInput,
          filled && styles.otpInputFilled,
        ]}
        placeholder=""
      />
    );
  };

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AppColors.background1}
      />

      <LinearGradient
        colors={[
          AppColors.background1,
          AppColors.background2,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================================
              BACK BUTTON
          ================================================== */}

          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={AppColors.foreground}
              />
            </TouchableOpacity>
          </View>

          {/* ==================================================
              LOCK ICON
          ================================================== */}

          <View style={styles.lockContainer}>
            <LinearGradient
              colors={[
                AppColors.orange,
                AppColors.gold,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.lockGradient}
            >
              <Text style={styles.lockEmoji}>
                🔐
              </Text>
            </LinearGradient>
          </View>

          {/* ==================================================
              TITLE
          ================================================== */}

          <Text style={styles.title}>
            Verify Your{" "}
            {method === "phone" ? "Phone" : "Email"}
          </Text>

          {/* ==================================================
              SUBTITLE
          ================================================== */}

          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            {maskedValue()}
          </Text>

          {/* ==================================================
              OTP CARD
          ================================================== */}

          <View style={styles.otpCard}>
            {/* OTP INPUTS */}

            <View style={styles.otpRow}>
              {otp.map((_, index) =>
                renderOTPBox(index)
              )}
            </View>

            {/* ==================================================
                VERIFY BUTTON
            ================================================== */}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading}
              onPress={handleVerifyPress}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={[
                  AppColors.orange,
                  AppColors.gold,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.verifyButton,
                  isLoading &&
                    styles.verifyButtonDisabled,
                ]}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <View style={styles.spinner} />

                    <Text style={styles.buttonText}>
                      Verifying...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>
                    Verify & Continue
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ==================================================
                RESEND
            ================================================== */}

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>
                Didn't receive the code?{" "}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={resendOTP}
              >
                <Text style={styles.resendButton}>
                  Resend
                </Text>
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
  container: {
    flex: 1,
    backgroundColor: AppColors.background1,
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
    backgroundColor: AppColors.white,
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

    shadowColor: AppColors.orange,
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
    color: AppColors.foreground,
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.mutedForeground,
  },

  // ==========================================================
  // OTP CARD
  // ==========================================================

  otpCard: {
    marginTop: 32,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 24,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",

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
    justifyContent: "space-between",
    alignItems: "center",
  },

  // ==========================================================
  // OTP INPUT
  // ==========================================================

  otpInput: {
    width: 43,
    height: 56,

    borderRadius: 14,

    backgroundColor: AppColors.muted,

    borderWidth: 1.5,
    borderColor: "transparent",

    textAlign: "center",

    fontSize: 22,
    fontWeight: "700",

    color: AppColors.orange,

    padding: 0,
  },

  otpInputFilled: {
    backgroundColor: AppColors.cream,
    borderColor: AppColors.orange,
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

    shadowColor: AppColors.orange,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,

    elevation: 4,
  },

  verifyButtonDisabled: {
    opacity: 0.75,
  },

  buttonText: {
    color: AppColors.white,
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
  },

  spinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderTopColor: AppColors.white,
    marginRight: 10,
  },

  // ==========================================================
  // RESEND
  // ==========================================================

  resendRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  resendText: {
    fontSize: 13,
    color: AppColors.mutedForeground,
  },

  resendButton: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.orange,
  },
});

export default OTPScreen;