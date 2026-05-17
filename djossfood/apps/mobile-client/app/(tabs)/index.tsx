import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useLocation } from '../../hooks/useLocation';
import { useRestaurants, useSearch, useFeaturedRestaurants } from '../../hooks/useRestaurants';
import RestaurantCard from '../../components/RestaurantCard';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { location } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const firstName = profile?.full_name?.split(' ')[0] ?? 'cher client';
  const city = location?.city ?? 'Cameroun';

  const {
    data: restaurantsData,
    isLoading: restaurantsLoading,
    refetch: refetchRestaurants,
  } = useRestaurants();

  const {
    data: featured,
    isLoading: featuredLoading,
  } = useFeaturedRestaurants();

  const {
    data: searchResults,
    isLoading: searchLoading,
  } = useSearch(
    submittedQuery,
    location?.city,
    location?.latitude,
    location?.longitude,
  );

  const isSearching = submittedQuery.length > 0;

  const handleSearchSubmit = useCallback(() => {
    setSubmittedQuery(searchQuery.trim());
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSubmittedQuery('');
  }, []);

  const handleRestaurantPress = useCallback((id: string) => {
    router.push(`/restaurant/${id}` as any);
  }, []);

  const nearbyRestaurants = restaurantsData?.restaurants ?? [];
  const featuredRestaurants = featured ?? [];

  const renderRestaurantCard = useCallback(
    ({ item }: { item: any }) => (
      <RestaurantCard
        restaurant={item}
        distanceKm={item.distance_km}
        onPress={() => handleRestaurantPress(item.id)}
      />
    ),
    [handleRestaurantPress],
  );

  const renderFeaturedCard = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.featuredCardWrapper}>
        <RestaurantCard
          restaurant={item}
          onPress={() => handleRestaurantPress(item.id)}
        />
      </View>
    ),
    [handleRestaurantPress],
  );

  if (restaurantsLoading && !restaurantsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {firstName}</Text>
        <View style={styles.locationBadge}>
          <Text style={styles.locationText}>📍 {city}</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un restaurant ou un plat..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {isSearching && (
          <Text style={styles.clearButton} onPress={handleClearSearch}>
            ✕
          </Text>
        )}
      </View>

      {/* Featured section – hidden when searching */}
      {!isSearching && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurants en vedette</Text>
          {featuredLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors.primaryGreen}
              style={styles.inlineLoader}
            />
          ) : featuredRestaurants.length === 0 ? null : (
            <FlatList
              data={featuredRestaurants}
              keyExtractor={(item) => item.id}
              renderItem={renderFeaturedCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredListContent}
            />
          )}
        </View>
      )}

      {/* Search results or nearby restaurants */}
      <View style={styles.sectionFlex}>
        <Text style={styles.sectionTitle}>
          {isSearching ? 'Résultats' : 'Près de chez vous'}
        </Text>

        {searchLoading ? (
          <ActivityIndicator
            size="small"
            color={Colors.primaryGreen}
            style={styles.inlineLoader}
          />
        ) : isSearching ? (
          searchResults && searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Aucun résultat pour "{submittedQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderRestaurantCard}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )
        ) : nearbyRestaurants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucun restaurant disponible pour le moment
            </Text>
          </View>
        ) : (
          <FlatList
            data={nearbyRestaurants}
            keyExtractor={(item) => item.id}
            renderItem={renderRestaurantCard}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={restaurantsLoading}
                onRefresh={() => refetchRestaurants()}
                colors={[Colors.primaryGreen]}
                tintColor={Colors.primaryGreen}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  locationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadii.full,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  searchInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingRight: 40,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.bg,
  },
  clearButton: {
    position: 'absolute',
    right: Spacing.xl + Spacing.sm,
    top: Spacing.md + 12,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  section: {
    paddingTop: Spacing.md,
  },
  sectionFlex: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  inlineLoader: {
    paddingVertical: Spacing.xl,
  },
  featuredListContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  featuredCardWrapper: {
    width: 280,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});