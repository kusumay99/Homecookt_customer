import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router, useLocalSearchParams } from "expo-router";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import AsyncStorage from "@react-native-async-storage/async-storage";

import DateTimePicker from "@react-native-community/datetimepicker";

import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

const BASE_URL = "https://api.homecookt.com";

const UpdateProfileScreen = () => {
  // ============================================================
  // EXPO ROUTER PARAMS
  // ============================================================

  const params = useLocalSearchParams();

  const rawUser = Array.isArray(params?.user)
    ? params.user[0]
    : params?.user;

  let passedUser = {};

  try {
    passedUser = rawUser ? JSON.parse(rawUser) : {};
  } catch (error) {
    console.log("USER PARAM PARSE ERROR =>", error);
    passedUser = {};
  }

  console.log("UPDATE PROFILE USER =>", passedUser);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [name, setName] = useState(
    passedUser?.name?.toString() || ""
  );

  const [phone, setPhone] = useState(
    passedUser?.phone_number?.toString() ||
      passedUser?.phone?.toString() ||
      ""
  );

  const [gender, setGender] = useState(
    passedUser?.gender?.toString() || ""
  );

  const [dob, setDob] = useState(
    passedUser?.dob?.toString() || ""
  );

  const [bio, setBio] = useState(
    passedUser?.bio?.toString() || ""
  );

  const [country, setCountry] = useState(
    passedUser?.country?.toString() || ""
  );

  const [state, setState] = useState(
    passedUser?.state?.toString() || ""
  );

  const [city, setCity] = useState(
    passedUser?.city?.toString() || ""
  );

  const [pincode, setPincode] = useState(
    passedUser?.pincode?.toString() ||
      passedUser?.postal_code?.toString() ||
      ""
  );

  const [address, setAddress] = useState(
    passedUser?.address?.toString() || ""
  );

  const [latitude, setLatitude] = useState(
    passedUser?.latitude?.toString() || ""
  );

  const [longitude, setLongitude] = useState(
    passedUser?.longitude?.toString() || ""
  );

  const [foodPreferences, setFoodPreferences] =
    useState(
      passedUser?.food_preferences?.toString() || ""
    );

  const [dietaryPreference, setDietaryPreference] =
    useState(
      passedUser?.dietary_preference?.toString() || ""
    );

  const [favoriteCuisine, setFavoriteCuisine] =
    useState(
      passedUser?.favorite_cuisine?.toString() || ""
    );

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const [profileImage, setProfileImage] = useState(null);

  const [existingProfileImage, setExistingProfileImage] =
    useState(
      passedUser?.profile_photo ||
        passedUser?.profile_image ||
        passedUser?.image ||
        passedUser?.image_url ||
        ""
    );

  // ============================================================
  // UI STATE
  // ============================================================

  const [isLoading, setIsLoading] = useState(false);

  const [isProfileLoading, setIsProfileLoading] =
    useState(true);

  const [showGenderModal, setShowGenderModal] =
    useState(false);

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [selectedDate, setSelectedDate] =
    useState(new Date(2000, 0, 1));

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = async () => {
    try {
      const accessToken =
        await AsyncStorage.getItem("access_token");

      if (accessToken) {
        console.log("UPDATE PROFILE TOKEN => available");
        return accessToken;
      }

      // Compatibility with older storage
      const accessToken2 =
        await AsyncStorage.getItem("accessToken");

      if (accessToken2) {
        return accessToken2;
      }

      const token =
        await AsyncStorage.getItem("token");

      return token || "";
    } catch (error) {
      console.log("TOKEN ERROR =>", error);
      return "";
    }
  };

  // ============================================================
  // IMAGE URL
  // ============================================================

  const getImageUrl = (image) => {
    if (!image || typeof image !== "string") {
      return "";
    }

    const cleanImage = image.trim();

    if (!cleanImage) {
      return "";
    }

    if (
      cleanImage.startsWith("http://") ||
      cleanImage.startsWith("https://")
    ) {
      return cleanImage;
    }

    const cleanPath = cleanImage.replace(/^\/+/, "");

    return `${BASE_URL}/${cleanPath}`;
  };

  // ============================================================
  // GET PROFILE
  // ============================================================

  const getProfile = async () => {
    try {
      setIsProfileLoading(true);

      const token = await getToken();

      if (!token) {
        console.log("NO ACCESS TOKEN FOUND");

        setIsProfileLoading(false);

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

      const responseText = await response.text();

      console.log(
        "GET PROFILE STATUS =>",
        response.status
      );

      console.log(
        "GET PROFILE BODY =>",
        responseText
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert(
            "Session Expired",
            "Please login again.",
            [
              {
                text: "OK",
                onPress: async () => {
                  await AsyncStorage.clear();
                  router.replace("/Login");
                },
              },
            ]
          );
        }

        return;
      }

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (error) {
        console.log(
          "PROFILE JSON ERROR =>",
          error
        );

        return;
      }

      /*
        Backend can return:

        {
          data: {...}
        }

        OR

        {
          profile: {...}
        }

        OR directly:
        {...}
      */

      const user =
        data?.profile ||
        data?.data ||
        data?.user ||
        data;

      if (!user || typeof user !== "object") {
        console.log(
          "INVALID PROFILE RESPONSE =>",
          data
        );

        return;
      }

      setName(
        user?.name?.toString() || ""
      );

      setPhone(
        user?.phone_number?.toString() ||
          user?.phone?.toString() ||
          ""
      );

      setGender(
        user?.gender?.toString() || ""
      );

      setDob(
        user?.dob?.toString() || ""
      );

      setBio(
        user?.bio?.toString() || ""
      );

      setCountry(
        user?.country?.toString() || ""
      );

      setState(
        user?.state?.toString() || ""
      );

      setCity(
        user?.city?.toString() || ""
      );

      setPincode(
        user?.pincode?.toString() ||
          user?.postal_code?.toString() ||
          ""
      );

      setAddress(
        user?.address?.toString() || ""
      );

      setLatitude(
        user?.latitude?.toString() || ""
      );

      setLongitude(
        user?.longitude?.toString() || ""
      );

      setFoodPreferences(
        user?.food_preferences?.toString() || ""
      );

      setDietaryPreference(
        user?.dietary_preference?.toString() || ""
      );

      setFavoriteCuisine(
        user?.favorite_cuisine?.toString() || ""
      );

      setExistingProfileImage(
        user?.profile_photo ||
          user?.profile_image ||
          user?.image ||
          user?.image_url ||
          ""
      );

      console.log(
        "PROFILE LOADED SUCCESSFULLY"
      );
    } catch (error) {
      console.log(
        "GET PROFILE ERROR =>",
        error
      );
    } finally {
      setIsProfileLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    getProfile();

    // We intentionally do not automatically
    // overwrite saved address/location here.
    // User can press "Use Current".
  }, []);

  // ============================================================
  // PICK PROFILE IMAGE
  // ============================================================

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access to select a profile photo."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        return;
      }

      console.log(
        "SELECTED PROFILE IMAGE =>",
        asset
      );

      setProfileImage(asset);
    } catch (error) {
      console.log(
        "IMAGE PICK ERROR =>",
        error
      );

      Alert.alert(
        "Error",
        "Unable to select profile image."
      );
    }
  };

  // ============================================================
  // CURRENT LOCATION
  // ============================================================

  const getCurrentLocation = async () => {
    try {
      Keyboard.dismiss();

      const enabled =
        await Location.hasServicesEnabledAsync();

      if (!enabled) {
        Alert.alert(
          "Location Disabled",
          "Please enable location services on your device."
        );

        return;
      }

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (
        permission.status !==
        Location.PermissionStatus.GRANTED
      ) {
        Alert.alert(
          "Permission Required",
          "Please allow location permission to use your current location."
        );

        return;
      }

      const position =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      console.log(
        "CURRENT LATITUDE =>",
        lat
      );

      console.log(
        "CURRENT LONGITUDE =>",
        lng
      );

      setLatitude(String(lat));
      setLongitude(String(lng));

      try {
        const places =
          await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          });

        if (
          places &&
          places.length > 0
        ) {
          const place = places[0];

          console.log(
            "CURRENT LOCATION DETAILS =>",
            place
          );

          setCountry(
            place.country || ""
          );

          setState(
            place.region ||
              place.subregion ||
              ""
          );

          setCity(
            place.city ||
              place.district ||
              place.subregion ||
              ""
          );

          setPincode(
            place.postalCode || ""
          );

          const parts = [];

          if (place.name) {
            parts.push(place.name);
          }

          if (place.street) {
            parts.push(place.street);
          }

          if (
            place.city ||
            place.district
          ) {
            parts.push(
              place.city ||
                place.district
            );
          }

          if (place.region) {
            parts.push(place.region);
          }

          if (place.postalCode) {
            parts.push(
              place.postalCode
            );
          }

          const generatedAddress =
            parts
              .filter(Boolean)
              .filter(
                (value, index, array) =>
                  array.indexOf(value) === index
              )
              .join(", ");

          if (generatedAddress) {
            setAddress(
              generatedAddress
            );
          }
        }
      } catch (error) {
        console.log(
          "REVERSE GEOCODING ERROR =>",
          error
        );

        Alert.alert(
          "Location",
          "Coordinates were detected, but address details could not be retrieved."
        );
      }
    } catch (error) {
      console.log(
        "LOCATION ERROR =>",
        error
      );

      Alert.alert(
        "Location Error",
        error?.message ||
          "Unable to get your current location."
      );
    }
  };

  // ============================================================
  // FORMAT DOB
  // ============================================================

  const formatDate = (date) => {
    const day = String(
      date.getDate()
    ).padStart(2, "0");

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const year =
      date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // ============================================================
  // PARSE DOB
  // ============================================================

  const parseDob = (value) => {
    if (!value) {
      return null;
    }

    const text = String(value).trim();

    // DD-MM-YYYY
    let match = text.match(
      /^(\d{2})-(\d{2})-(\d{4})$/
    );

    if (match) {
      const day = Number(match[1]);
      const month =
        Number(match[2]) - 1;
      const year = Number(match[3]);

      const date =
        new Date(
          year,
          month,
          day
        );

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    // YYYY-MM-DD
    match = text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (match) {
      const year = Number(match[1]);
      const month =
        Number(match[2]) - 1;
      const day = Number(match[3]);

      const date =
        new Date(
          year,
          month,
          day
        );

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    return null;
  };

  // ============================================================
  // OPEN DATE PICKER
  // ============================================================

  const openDatePicker = () => {
    Keyboard.dismiss();

    const parsedDate =
      parseDob(dob);

    const initialDate =
      parsedDate ||
      new Date(2000, 0, 1);

    setSelectedDate(
      initialDate
    );

    setShowDatePicker(true);
  };

  // ============================================================
  // DATE CHANGE
  // ============================================================

  const onDateChange = (
    event,
    date
  ) => {
    if (
      Platform.OS === "android"
    ) {
      setShowDatePicker(false);
    }

    if (!date) {
      return;
    }

    setSelectedDate(date);

    setDob(
      formatDate(date)
    );
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert(
        "Validation",
        "Name is required."
      );

      return false;
    }

    if (!phone.trim()) {
      Alert.alert(
        "Validation",
        "Phone Number is required."
      );

      return false;
    }

    if (!gender.trim()) {
      Alert.alert(
        "Validation",
        "Please select your gender."
      );

      return false;
    }

    if (!dob.trim()) {
      Alert.alert(
        "Validation",
        "Date of Birth is required."
      );

      return false;
    }

    if (!country.trim()) {
      Alert.alert(
        "Validation",
        "Country is required."
      );

      return false;
    }

    if (!state.trim()) {
      Alert.alert(
        "Validation",
        "State is required."
      );

      return false;
    }

    if (!city.trim()) {
      Alert.alert(
        "Validation",
        "City is required."
      );

      return false;
    }

    if (!pincode.trim()) {
      Alert.alert(
        "Validation",
        "Pincode is required."
      );

      return false;
    }

    if (!address.trim()) {
      Alert.alert(
        "Validation",
        "Address is required."
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // GET ERROR MESSAGE
  // ============================================================

  const getErrorMessage = (
    responseText,
    status
  ) => {
    let message =
      `Failed to update profile (${status}).`;

    if (!responseText) {
      return message;
    }

    try {
      const data =
        JSON.parse(responseText);

      if (
        typeof data?.message ===
        "string"
      ) {
        return data.message;
      }

      if (
        typeof data?.detail ===
        "string"
      ) {
        return data.detail;
      }

      if (
        typeof data?.error ===
        "string"
      ) {
        return data.error;
      }

      if (
        Array.isArray(
          data?.detail
        )
      ) {
        return data.detail
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
              "Invalid field"
            );
          })
          .join("\n");
      }

      if (
        Array.isArray(
          data?.errors
        )
      ) {
        return data.errors
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
              "Invalid field"
            );
          })
          .join("\n");
      }

      return message;
    } catch (error) {
      return responseText || message;
    }
  };

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  const updateProfile = async () => {
    if (isLoading) {
      return;
    }

    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const token =
        await getToken();

      if (!token) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.clear();
                router.replace("/Login");
              },
            },
          ]
        );

        return;
      }

      const formData =
        new FormData();

      // ========================================================
      // TEXT FIELDS
      // ========================================================

      formData.append(
        "name",
        name.trim()
      );

      formData.append(
        "phone_number",
        phone.trim()
      );

      formData.append(
        "gender",
        gender.trim()
      );

      formData.append(
        "dob",
        dob.trim()
      );

      formData.append(
        "bio",
        bio.trim()
      );

      formData.append(
        "country",
        country.trim()
      );

      formData.append(
        "state",
        state.trim()
      );

      formData.append(
        "city",
        city.trim()
      );

      formData.append(
        "pincode",
        pincode.trim()
      );

      formData.append(
        "address",
        address.trim()
      );

      formData.append(
        "latitude",
        latitude.trim()
      );

      formData.append(
        "longitude",
        longitude.trim()
      );

      formData.append(
        "food_preferences",
        foodPreferences.trim()
      );

      formData.append(
        "dietary_preference",
        dietaryPreference.trim()
      );

      formData.append(
        "favorite_cuisine",
        favoriteCuisine.trim()
      );

      // ========================================================
      // PROFILE PHOTO
      // ========================================================

      if (profileImage?.uri) {
        const uri =
          profileImage.uri;

        const fileName =
          profileImage.fileName ||
          uri.split("/").pop() ||
          `profile_${Date.now()}.jpg`;

        let mimeType =
          profileImage.mimeType;

        if (!mimeType) {
          const extension =
            fileName
              .split(".")
              .pop()
              ?.toLowerCase();

          if (
            extension === "png"
          ) {
            mimeType =
              "image/png";
          } else if (
            extension === "webp"
          ) {
            mimeType =
              "image/webp";
          } else {
            mimeType =
              "image/jpeg";
          }
        }

        formData.append(
          "profile_photo",
          {
            uri,
            name: fileName,
            type: mimeType,
          }
        );

        console.log(
          "PROFILE PHOTO ATTACHED =>",
          {
            uri,
            name: fileName,
            type: mimeType,
          }
        );
      }

      console.log(
        "UPDATING PROFILE..."
      );

      const controller =
        new AbortController();

      const timeout =
        setTimeout(() => {
          controller.abort();
        }, 30000);

      let response;

      try {
        response = await fetch(
          `${BASE_URL}/api/v1/users/profile`,
          {
            method: "PUT",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            /*
              IMPORTANT:

              Do NOT manually set:

              Content-Type:
              multipart/form-data

              React Native must generate
              the multipart boundary itself.
            */

            body: formData,

            signal:
              controller.signal,
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      const responseText =
        await response.text();

      console.log(
        "UPDATE PROFILE STATUS =>",
        response.status
      );

      console.log(
        "UPDATE PROFILE BODY =>",
        responseText
      );

      // ========================================================
      // SUCCESS
      // ========================================================

      if (response.ok) {
        Alert.alert(
          "Success",
          "Profile updated successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                /*
                  Expo Router replacement for:

                  navigation.goBack()
                */

                router.back();
              },
            },
          ]
        );

        return;
      }

      // ========================================================
      // UNAUTHORIZED
      // ========================================================

      if (
        response.status === 401
      ) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.clear();
                router.replace("/Login");
              },
            },
          ]
        );

        return;
      }

      // ========================================================
      // ERROR
      // ========================================================

      const errorMessage =
        getErrorMessage(
          responseText,
          response.status
        );

      Alert.alert(
        "Update Failed",
        errorMessage
      );
    } catch (error) {
      console.log(
        "UPDATE PROFILE ERROR =>",
        error
      );

      if (
        error?.name ===
        "AbortError"
      ) {
        Alert.alert(
          "Timeout",
          "The server took too long to respond. Please try again."
        );
      } else {
        Alert.alert(
          "Error",
          error?.message ||
            "Something went wrong while updating your profile."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // INPUT FIELD
  // ============================================================

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    multiline = false,
    icon,
  }) => {
    return (
      <View
        style={styles.fieldWrapper}
      >
        <Text style={styles.label}>
          {label}
        </Text>

        <View
          style={[
            styles.inputContainer,
            multiline &&
              styles.multilineContainer,
          ]}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color="#F59E0B"
              style={
                styles.inputIcon
              }
            />
          )}

          <TextInput
            value={value}
            onChangeText={
              onChangeText
            }
            placeholder={
              placeholder
            }
            placeholderTextColor="#9CA3AF"
            keyboardType={
              keyboardType
            }
            multiline={
              multiline
            }
            numberOfLines={
              multiline ? 4 : 1
            }
            editable={!isLoading}
            textAlignVertical={
              multiline
                ? "top"
                : "center"
            }
            style={[
              styles.input,
              multiline &&
                styles.multilineInput,
            ]}
          />
        </View>
      </View>
    );
  };

  // ============================================================
  // GENDER FIELD
  // ============================================================

  const GenderField = () => {
    return (
      <View
        style={styles.fieldWrapper}
      >
        <Text style={styles.label}>
          Gender
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isLoading}
          onPress={() =>
            setShowGenderModal(true)
          }
          style={
            styles.selectContainer
          }
        >
          <Ionicons
            name="person-outline"
            size={20}
            color="#F59E0B"
          />

          <Text
            style={[
              styles.selectText,
              !gender &&
                styles.placeholderText,
            ]}
          >
            {gender ||
              "Select Gender"}
          </Text>

          <Ionicons
            name="chevron-down"
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================
  // DOB FIELD
  // ============================================================

  const DateField = () => {
    return (
      <View
        style={styles.fieldWrapper}
      >
        <Text style={styles.label}>
          Date of Birth
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isLoading}
          onPress={
            openDatePicker
          }
          style={
            styles.selectContainer
          }
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#F59E0B"
          />

          <Text
            style={[
              styles.selectText,
              !dob &&
                styles.placeholderText,
            ]}
          >
            {dob ||
              "Select Date of Birth"}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const renderProfileImage = () => {
    if (profileImage?.uri) {
      return (
        <Image
          source={{
            uri: profileImage.uri,
          }}
          style={
            styles.profileImage
          }
        />
      );
    }

    const existingImageUrl =
      getImageUrl(
        existingProfileImage
      );

    if (existingImageUrl) {
      return (
        <Image
          source={{
            uri: existingImageUrl,
          }}
          style={
            styles.profileImage
          }
          onError={(error) => {
            console.log(
              "PROFILE IMAGE ERROR =>",
              error?.nativeEvent?.error
            );
          }}
        />
      );
    }

    return (
      <View
        style={
          styles.profilePlaceholder
        }
      >
        <Ionicons
          name="person"
          size={55}
          color="#9CA3AF"
        />
      </View>
    );
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (isProfileLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          "top",
          "left",
          "right",
          "bottom",
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#F59E0B"
        />

        <LinearGradient
          colors={[
            "#F59E0B",
            "#F97316",
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0,
          }}
          style={styles.header}
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            Update Profile
          </Text>

          <View
            style={
              styles.headerPlaceholder
            }
          />
        </LinearGradient>

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#F59E0B"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // MAIN SCREEN
  // ============================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "left",
        "right",
        "bottom",
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#F59E0B"
      />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <LinearGradient
        colors={[
          "#F59E0B",
          "#F97316",
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 0,
        }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
          disabled={isLoading}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text
          style={
            styles.headerTitle
          }
        >
          Update Profile
        </Text>

        <View
          style={
            styles.headerPlaceholder
          }
        />
      </LinearGradient>

      {/* ======================================================
          BODY
      ====================================================== */}

      <KeyboardAvoidingView
        style={
          styles.keyboardView
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={
            styles.contentContainer
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
        }
        >
          {/* ==================================================
              PROFILE PHOTO
          ================================================== */}

          <View
            style={
              styles.profileSection
            }
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={pickImage}
              disabled={isLoading}
              style={
                styles.profileImageWrapper
              }
            >
              {renderProfileImage()}

              <View
                style={
                  styles.cameraButton
                }
              >
                <Ionicons
                  name="camera"
                  size={21}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>

            <Text
              style={
                styles.changePhotoText
              }
            >
              Tap to change profile photo
            </Text>
          </View>

          {/* ==================================================
              PERSONAL INFORMATION
          ================================================== */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Personal Information
          </Text>

          <InputField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            icon="person-outline"
          />

          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <GenderField />

          <DateField />

          <InputField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
            icon="document-text-outline"
          />

          {/* ==================================================
              LOCATION
          ================================================== */}

          <View
            style={
              styles.sectionHeaderRow
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Location
            </Text>

            <TouchableOpacity
              onPress={
                getCurrentLocation
              }
              disabled={isLoading}
              style={
                styles.locationButton
              }
            >
              <Ionicons
                name="locate-outline"
                size={17}
                color="#F59E0B"
              />

              <Text
                style={
                  styles.locationButtonText
                }
              >
                Use Current
              </Text>
            </TouchableOpacity>
          </View>

          <InputField
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="Enter country"
            icon="globe-outline"
          />

          <InputField
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="Enter state"
            icon="map-outline"
          />

          <InputField
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            icon="business-outline"
          />

          <InputField
            label="Pincode"
            value={pincode}
            onChangeText={setPincode}
            placeholder="Enter pincode"
            keyboardType="number-pad"
            icon="pin-outline"
          />

          <InputField
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            multiline
            icon="location-outline"
          />

          {/* ==================================================
              COORDINATES
          ================================================== */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Location Coordinates
          </Text>

          <InputField
            label="Latitude"
            value={latitude}
            onChangeText={setLatitude}
            placeholder="Latitude"
            keyboardType="decimal-pad"
            icon="navigate-outline"
          />

          <InputField
            label="Longitude"
            value={longitude}
            onChangeText={setLongitude}
            placeholder="Longitude"
            keyboardType="decimal-pad"
            icon="navigate-outline"
          />

          {/* ==================================================
              FOOD PREFERENCES
          ================================================== */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Food Preferences
          </Text>

          <InputField
            label="Food Preferences"
            value={foodPreferences}
            onChangeText={
              setFoodPreferences
            }
            placeholder="Example: Biryani, Indian food"
            multiline
            icon="restaurant-outline"
          />

          <InputField
            label="Dietary Preference"
            value={
              dietaryPreference
            }
            onChangeText={
              setDietaryPreference
            }
            placeholder="Example: Vegetarian"
            icon="leaf-outline"
          />

          <InputField
            label="Favorite Cuisine"
            value={
              favoriteCuisine
            }
            onChangeText={
              setFavoriteCuisine
            }
            placeholder="Example: Indian, Chinese"
            icon="fast-food-outline"
          />

          {/* ==================================================
              UPDATE BUTTON
          ================================================== */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={
              updateProfile
            }
            disabled={isLoading}
            style={
              styles.updateButton
            }
          >
            <LinearGradient
              colors={[
                "#F59E0B",
                "#F97316",
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
                styles.updateGradient
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
                      styles.buttonText
                    }
                  >
                    Updating...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Update Profile
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View
            style={
              styles.bottomSpacing
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ======================================================
          GENDER MODAL
      ====================================================== */}

      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowGenderModal(false)
        }
      >
        <TouchableOpacity
          activeOpacity={1}
          style={
            styles.modalOverlay
          }
          onPress={() =>
            setShowGenderModal(false)
          }
        >
          <TouchableOpacity
            activeOpacity={1}
            style={
              styles.genderModal
            }
          >
            <View
              style={
                styles.modalHandle
              }
            />

            <Text
              style={
                styles.modalTitle
              }
            >
              Select Gender
            </Text>

            {[
              "Male",
              "Female",
              "Other",
            ].map((item) => (
              <TouchableOpacity
                key={item}
                style={
                  styles.genderOption
                }
                onPress={() => {
                  setGender(item);
                  setShowGenderModal(
                    false
                  );
                }}
              >
                <View
                  style={
                    styles.genderIcon
                  }
                >
                  <Ionicons
                    name={
                      item ===
                      "Male"
                        ? "male"
                        : item ===
                          "Female"
                        ? "female"
                        : "person"
                    }
                    size={20}
                    color="#F59E0B"
                  />
                </View>

                <Text
                  style={
                    styles.genderText
                  }
                >
                  {item}
                </Text>

                {gender ===
                  item && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#F59E0B"
                  />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ======================================================
          DATE PICKER
      ====================================================== */}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={
            Platform.OS === "ios"
              ? "spinner"
              : "default"
          }
          minimumDate={
            new Date(1950, 0, 1)
          }
          maximumDate={
            new Date()
          }
          onChange={
            onDateChange
          }
        />
      )}
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  keyboardView: {
    flex: 1,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.15)",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  headerPlaceholder: {
    width: 42,
    height: 42,
  },

  // ==========================================================
  // BODY
  // ==========================================================

  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  contentContainer: {
    padding: 16,
  },

  // ==========================================================
  // PROFILE PHOTO
  // ==========================================================

  profileSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },

  profileImageWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    position: "relative",
  },

  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    resizeMode: "cover",
    backgroundColor: "#E5E7EB",
  },

  profilePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 3,
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  changePhotoText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
  },

  // ==========================================================
  // SECTION
  // ==========================================================

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 15,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
  },

  locationButtonText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },

  // ==========================================================
  // INPUT
  // ==========================================================

  fieldWrapper: {
    marginBottom: 16,
  },

  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  multilineContainer: {
    alignItems: "flex-start",
    minHeight: 115,
    paddingTop: 15,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    paddingVertical: 0,
  },

  multilineInput: {
    minHeight: 85,
    paddingTop: 0,
  },

  // ==========================================================
  // SELECT
  // ==========================================================

  selectContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  selectText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111827",
  },

  placeholderText: {
    color: "#9CA3AF",
  },

  // ==========================================================
  // BUTTON
  // ==========================================================

  updateButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
  },

  updateGradient: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 9,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FA",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 15,
  },

  // ==========================================================
  // GENDER MODAL
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  genderModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 35,
  },

  modalHandle: {
    width: 45,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  genderOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  genderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  genderText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },

  // ==========================================================
  // BOTTOM
  // ==========================================================

  bottomSpacing: {
    height: 35,
  },
});

export default UpdateProfileScreen;

