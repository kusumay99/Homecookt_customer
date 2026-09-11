import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://api.homecookt.com";

// ============================================================
// SEARCH SCREEN
// ============================================================

const SearchScreen = ({ navigation }) => {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === "dark";

  // ============================================================
  // STATE
  // ============================================================

  const [query, setQuery] = useState("");

  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] =
    useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const searchInputRef = useRef(null);

  const searchTimeoutRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);

  // ============================================================
  // COLORS
  // ============================================================

  const colors = {
    background: isDark ? "#121212" : "#F7F8FA",
    card: isDark ? "#1E1E1E" : "#FFFFFF",
    input: isDark ? "#202020" : "#FFFFFF",
    border: isDark ? "#333333" : "#E6E6E6",
    text: isDark ? "#FFFFFF" : "#111111",
    secondaryText: isDark ? "#BDBDBD" : "#666666",
    muted: isDark ? "#8D8D8D" : "#888888",
    orange: "#F28C28",
    gold: "#F5B83D",
    iconBackground: isDark ? "#242424" : "#EEEEF0",
  };

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = async () => {
    try {
      return (
        (await AsyncStorage.getItem("access_token")) || ""
      );
    } catch (error) {
      console.log("Token error:", error);
      return "";
    }
  };

  // ============================================================
  // NORMALIZE IMAGE URL
  // ============================================================

  const getImageUrl = (image) => {
    if (!image) {
      return null;
    }

    const imageString = String(image).trim();

    if (!imageString) {
      return null;
    }

    if (
      imageString.startsWith("http://") ||
      imageString.startsWith("https://")
    ) {
      return imageString;
    }

    if (imageString.startsWith("/")) {
      return `${BASE_URL}${imageString}`;
    }

    return `${BASE_URL}/${imageString}`;
  };

  // ============================================================
  // SEARCH FOOD API
  // ============================================================

  const searchFood = async (searchQuery, showLoader = true) => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setIsLoading(true);
      }

      const token = await getToken();

      const url =
        `${BASE_URL}/api/v1/search?query=` +
        encodeURIComponent(trimmedQuery);

      console.log("====================================");
      console.log("SEARCH FOOD API");
      console.log("URL:", url);
      console.log("====================================");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data = {};

      try {
        data = await response.json();
      } catch (error) {
        data = {};
      }

      console.log("SEARCH STATUS:", response.status);
      console.log("SEARCH RESPONSE:", data);

      if (response.status === 200) {
        const results =
          data?.results ??
          data?.foods ??
          data?.data ??
          [];

        setSearchResults(
          Array.isArray(results) ? results : []
        );
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.log("Search food error:", error);
      setSearchResults([]);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  // ============================================================
  // GET SEARCH SUGGESTIONS API
  // ============================================================

  const getSuggestions = async (searchQuery) => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSuggestions([]);
      return;
    }

    try {
      setIsSuggestionsLoading(true);

      const token = await getToken();

      const url =
        `${BASE_URL}/api/v1/search-suggestions?q=` +
        encodeURIComponent(trimmedQuery);

      console.log("====================================");
      console.log("SEARCH SUGGESTIONS API");
      console.log("URL:", url);
      console.log("====================================");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data = {};

      try {
        data = await response.json();
      } catch (error) {
        data = {};
      }

      console.log(
        "SUGGESTIONS STATUS:",
        response.status
      );

      if (response.status === 200) {
        const result =
          data?.suggestions ??
          data?.data ??
          [];

        setSuggestions(
          Array.isArray(result) ? result : []
        );
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.log(
        "Suggestions error:",
        error
      );

      setSuggestions([]);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  // ============================================================
  // HANDLE SEARCH TEXT
  // ============================================================

  const handleSearchChange = (text) => {
    setQuery(text);

    // Clear previous debounce timers
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(
        suggestionTimeoutRef.current
      );
    }

    const trimmedText = text.trim();

    // ----------------------------------------------------------
    // Empty search
    // ----------------------------------------------------------

    if (!trimmedText) {
      setSuggestions([]);
      setSearchResults([]);
      setIsLoading(false);
      setIsSuggestionsLoading(false);
      return;
    }

    // ----------------------------------------------------------
    // Suggestions debounce
    // ----------------------------------------------------------

    suggestionTimeoutRef.current =
      setTimeout(() => {
        getSuggestions(trimmedText);
      }, 250);

    // ----------------------------------------------------------
    // Search debounce
    // ----------------------------------------------------------

    searchTimeoutRef.current =
      setTimeout(() => {
        searchFood(trimmedText);
      }, 450);
  };

  // ============================================================
  // SELECT SUGGESTION
  // ============================================================

  const selectSuggestion = (suggestion) => {
    const selected = String(suggestion);

    // Clear timers
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(
        suggestionTimeoutRef.current
      );
    }

    setQuery(selected);
    setSuggestions([]);

    Keyboard.dismiss();

    searchFood(selected);
  };

  // ============================================================
  // CLEAR SEARCH
  // ============================================================

  const clearSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(
        suggestionTimeoutRef.current
      );
    }

    setQuery("");
    setSuggestions([]);
    setSearchResults([]);
    setIsLoading(false);

    searchInputRef.current?.focus();
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const onRefresh = async () => {
    if (!query.trim()) {
      return;
    }

    try {
      setRefreshing(true);

      await searchFood(query, false);
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================
  // NAVIGATE TO DISH DETAIL
  // ============================================================

  const openDish = (item) => {
    /*
      Your Flutter code does:

      final dish = Dish.fromJson(item);

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => DishDetailScreen(
            dish: dish,
          ),
        ),
      );

      Here we pass the complete API object.
      Your DishDetailScreen can read route.params.dish.
    */

    navigation.navigate("DishDetail", {
      dish: item,
    });
  };

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (suggestionTimeoutRef.current) {
        clearTimeout(
          suggestionTimeoutRef.current
        );
      }
    };
  }, []);

  // ============================================================
  // RENDER SUGGESTION
  // ============================================================

  const renderSuggestion = ({
    item,
    index,
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.suggestionItem,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() =>
          selectSuggestion(item)
        }
      >
        <View
          style={[
            styles.suggestionIcon,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.orange}
          />
        </View>

        <Text
          style={[
            styles.suggestionText,
            {
              color: colors.text,
            },
          ]}
          numberOfLines={1}
        >
          {String(item)}
        </Text>

        <Ionicons
          name="arrow-up-outline"
          size={18}
          color={colors.muted}
          style={{
            transform: [{ rotate: "45deg" }],
          }}
        />
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDER FOOD CARD
  // ============================================================

  const renderFood = ({ item, index }) => {
    const imageUrl = getImageUrl(
      item?.image ??
        item?.food_image ??
        item?.food_photo
    );

    const name =
      item?.name ??
      item?.food_name ??
      item?.title ??
      "Unnamed Dish";

    const price =
      item?.price ??
      item?.food_price ??
      item?.amount ??
      0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.foodCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => openDish(item)}
      >
        {/* ================================================= */}
        {/* IMAGE */}
        {/* ================================================= */}

        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{
                uri: imageUrl,
              }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Ionicons
                name="fast-food-outline"
                size={30}
                color={colors.orange}
              />
            </View>
          )}
        </View>

        {/* ================================================= */}
        {/* INFO */}
        {/* ================================================= */}

        <View style={styles.foodInfo}>
          <Text
            style={[
              styles.foodName,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={2}
          >
            {name}
          </Text>

          <Text
            style={[
              styles.foodPrice,
              {
                color: colors.orange,
              },
            ]}
          >
            ₹{price}
          </Text>
        </View>

        {/* ================================================= */}
        {/* ARROW */}
        {/* ================================================= */}

        <View
          style={[
            styles.arrowContainer,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.secondaryText}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // EMPTY STATE
  // ============================================================

  const renderEmptyState = () => {
    const isSearching =
      query.trim().length > 0;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>
          🔍
        </Text>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {isSearching
            ? "No results found"
            : "Start typing to search..."}
        </Text>

        {isSearching ? (
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: colors.muted,
              },
            ]}
          >
            Try searching for another dish,
            chef, or cuisine
          </Text>
        ) : null}
      </View>
    );
  };

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle={
          isDark
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          colors.background
        }
      />

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <View style={styles.header}>
        {/* BACK BUTTON */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            navigation.goBack();
          }}
          style={[
            styles.backButton,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        {/* ================================================== */}
        {/* SEARCH INPUT */}
        {/* ================================================== */}

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                colors.input,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={21}
            color={colors.orange}
            style={styles.searchIcon}
          />

          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              {
                color: colors.text,
              },
            ]}
            value={query}
            onChangeText={
              handleSearchChange
            }
            placeholder="Search dishes, chefs, cuisines..."
            placeholderTextColor={
              colors.muted
            }
            autoFocus={true}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* CLEAR BUTTON */}

          {query.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={clearSearch}
              style={styles.clearButton}
            >
              <Ionicons
                name="close"
                size={18}
                color={colors.secondaryText}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.orange}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: colors.secondaryText,
              },
            ]}
          >
            Searching...
          </Text>
        </View>
      ) : query.trim().length === 0 ? (
        renderEmptyState()
      ) : suggestions.length > 0 ? (
        /* ==================================================== */
        /* SUGGESTIONS */
        /* ==================================================== */

        <FlatList
          data={suggestions}
          keyExtractor={(item, index) =>
            `${String(item)}-${index}`
          }
          renderItem={
            renderSuggestion
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={{
            paddingBottom: 30,
          }}
          ListHeaderComponent={
            <View
              style={
                styles.suggestionHeader
              }
            >
              <Text
                style={[
                  styles.suggestionHeaderText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Suggestions
              </Text>

              {isSuggestionsLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.orange}
                />
              ) : null}
            </View>
          }
        />
      ) : searchResults.length === 0 ? (
        /* ==================================================== */
        /* NO RESULTS */
        /* ==================================================== */

        renderEmptyState()
      ) : (
        /* ==================================================== */
        /* SEARCH RESULTS */
        /* ==================================================== */

        <FlatList
          data={searchResults}
          keyExtractor={(item, index) =>
            String(
              item?.id ??
                item?.food_id ??
                item?._id ??
                index
            )
          }
          renderItem={renderFood}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.resultsContainer
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.orange}
              colors={[colors.orange]}
            />
          }
          ListHeaderComponent={
            <View
              style={styles.resultsHeader}
            >
              <Text
                style={[
                  styles.resultsTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Search Results
              </Text>

              <Text
                style={[
                  styles.resultsCount,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                {searchResults.length}{" "}
                {searchResults.length ===
                1
                  ? "result"
                  : "results"}
              </Text>
            </View>
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
  container: {
    flex: 1,
  },

  // ============================================================
  // HEADER
  // ============================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // ============================================================
  // SEARCH
  // ============================================================

  searchContainer: {
    flex: 1,
    height: 48,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderRadius: 15,

    paddingLeft: 12,
    paddingRight: 6,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: 48,

    fontSize: 14,

    paddingVertical: 0,
  },

  clearButton: {
    width: 38,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },

  // ============================================================
  // LOADING
  // ============================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // ============================================================
  // EMPTY STATE
  // ============================================================

  emptyContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 30,
  },

  emptyEmoji: {
    fontSize: 56,
  },

  emptyTitle: {
    marginTop: 16,

    fontSize: 16,
    fontWeight: "600",

    textAlign: "center",
  },

  emptySubtitle: {
    marginTop: 8,

    fontSize: 13,

    textAlign: "center",

    lineHeight: 20,
  },

  // ============================================================
  // SUGGESTIONS
  // ============================================================

  suggestionHeader: {
    height: 48,

    paddingHorizontal: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  suggestionHeaderText: {
    fontSize: 13,
    fontWeight: "600",
  },

  suggestionItem: {
    minHeight: 58,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 18,

    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  suggestionIcon: {
    width: 36,
    height: 36,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  suggestionText: {
    flex: 1,

    fontSize: 14,
    fontWeight: "500",
  },

  // ============================================================
  // RESULTS
  // ============================================================

  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 14,
  },

  resultsTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  resultsCount: {
    fontSize: 12,
  },

  // ============================================================
  // FOOD CARD
  // ============================================================

  foodCard: {
    minHeight: 84,

    flexDirection: "row",
    alignItems: "center",

    borderRadius: 16,

    borderWidth: 1,

    marginBottom: 12,

    padding: 10,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,

    elevation: 2,
  },

  imageContainer: {
    width: 64,
    height: 64,

    borderRadius: 11,

    overflow: "hidden",
  },

  foodImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  // ============================================================
  // FOOD INFO
  // ============================================================

  foodInfo: {
    flex: 1,

    paddingHorizontal: 12,
  },

  foodName: {
    fontSize: 15,
    fontWeight: "600",

    lineHeight: 20,
  },

  foodPrice: {
    marginTop: 7,

    fontSize: 14,
    fontWeight: "700",
  },

  // ============================================================
  // ARROW
  // ============================================================

  arrowContainer: {
    width: 34,
    height: 34,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },
});

export default SearchScreen;