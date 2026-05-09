import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/core/ConfirmDialog';
import { Header } from '../../../components/core/Header';
import { OptionsDialog } from '../../../components/core/OptionsDialog';
import { FREE_LIMITS } from '../../../constants/iap';
import { CategoryType } from '../../../db/schema';
import { usePremium } from '../../../providers/PremiumProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { fromDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { Category } from '../api/categories';
import { CategoryTypeSelector } from '../components/CategoryTypeSelector';
import { useCategories, useDeleteCategory } from '../hooks/categories';

// ─── Local row ───────────────────────────────────────────────────────────────
const CategoryRow = React.memo(function CategoryRow({
  item,
  onPress,
  onLongPress,
}: {
  item: Category;
  onPress: (item: Category) => void;
  onLongPress: (item: Category) => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createRowStyles(theme), [theme]);

  const catColor = useMemo(
    () => (item.color != null ? fromDbColor(item.color) : colors.primary),
    [item.color, colors.primary]
  );

  const handlePress = useCallback(() => onPress(item), [onPress, item]);
  const handleLongPress = useCallback(() => onLongPress(item), [onLongPress, item]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={280}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: catColor + '20' }]}>
        <Ionicons name={resolveIcon(item.icon, 'grid-outline')} size={22} color={catColor} />
      </View>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </TouchableOpacity>
  );
});

// ─── Screen ──────────────────────────────────────────────────────────────────
export const CategoriesScreen = React.memo(function CategoriesScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isPremium, showAlert } = usePremium();
  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeType, setActiveType] = useState<CategoryType>('DR');
  const [query, setQuery] = useState('');
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      categories
        ?.filter((cat) => cat.type === activeType)
        .filter((cat) => (q ? cat.name.toLowerCase().includes(q) : true))
        .sort((a, b) => a.name.localeCompare(b.name)) ?? []
    );
  }, [categories, activeType, query]);

  const handleCreate = useCallback(() => {
    if (!isPremium && (categories?.length ?? 0) >= FREE_LIMITS.CATEGORIES) {
      showAlert({
        title: 'Category limit reached',
        message: `Free users can create up to ${FREE_LIMITS.CATEGORIES} categories. Upgrade to Pro for unlimited!`,
        type: 'warning',
        buttons: [
          { text: 'Maybe later', style: 'cancel' },
          { text: 'Upgrade now', onPress: () => router.push('/premium') },
        ],
      });
      return;
    }
    router.push('/categories/create');
  }, [router, isPremium, categories, showAlert]);

  const handleEdit = useCallback((category: Category) => {
    router.push(`/categories/edit/${category.id}`);
  }, [router]);

  const handleLongPress = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setShowManageDialog(true);
  }, []);

  const handleDelete = useCallback((id: number) => {
    deleteCategory(id);
  }, [deleteCategory]);

  const renderItem = useCallback(({ item }: { item: Category }) => (
    <CategoryRow item={item} onPress={handleEdit} onLongPress={handleLongPress} />
  ), [handleEdit, handleLongPress]);

  const keyExtractor = useCallback((item: Category) => item.id.toString(), []);

  const manageOptions = useMemo(() => {
    if (!selectedCategory) return [];
    return [
      {
        key: 'edit',
        label: 'Edit category',
        icon: 'create-outline' as const,
        onPress: () => {
          setShowManageDialog(false);
          handleEdit(selectedCategory);
        },
      },
      {
        key: 'delete',
        label: 'Delete category',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => {
          setShowManageDialog(false);
          setShowDeleteDialog(true);
        },
      },
    ];
  }, [selectedCategory, handleEdit]);

  const typeLabel = activeType === 'DR' ? 'expense' : activeType === 'CR' ? 'income' : 'transfer';

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Categories"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleCreate} activeOpacity={0.75}>
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.filtersWrap}>
        <CategoryTypeSelector
          activeType={activeType}
          onTypeChange={setActiveType}
          theme={theme}
        />
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.85}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          key={activeType}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="grid-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No categories</Text>
              <Text style={styles.emptyText}>
                {query
                  ? 'No matches for your search.'
                  : `No ${typeLabel} categories yet.`}
              </Text>
              {!query && (
                <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate} activeOpacity={0.8}>
                  <Text style={styles.emptyBtnText}>Create category</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <OptionsDialog
        visible={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        title="Manage category"
        subtitle={selectedCategory?.name}
        options={manageOptions}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete category"
        message="This will delete the category and associated transactions."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!selectedCategory) return;
          handleDelete(selectedCategory.id);
          setSelectedCategory(null);
        }}
      />
    </SafeAreaView>
  );
});

const createRowStyles = (theme: Theme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[16],
    gap: theme.spacing[16],
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filtersWrap: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing[12],
    gap: theme.spacing[8],
  },
  searchWrap: {
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    paddingHorizontal: theme.spacing[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: theme.fontFamilies.sans,
    fontSize: 14,
    color: theme.colors.text,
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[4],
    paddingBottom: 40,
    gap: theme.spacing[8],
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  emptyTitle: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
    marginTop: theme.spacing[8],
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyBtn: {
    marginTop: theme.spacing[8],
    height: 40,
    paddingHorizontal: theme.spacing[20],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtnText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
});
