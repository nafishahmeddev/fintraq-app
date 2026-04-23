import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList,  Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../../components/ui/BlurBackground';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { CategoryType } from '../../../db/schema';
import { useTheme } from '../../../providers/ThemeProvider';
import { Category } from '../api/categories';
import { CategoryCard } from '../components/CategoryCard';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { CategoryTypeSelector } from '../components/CategoryTypeSelector';
import { useCategories, useDeleteCategory } from '../hooks/categories';

export const CategoriesScreen = () => {
  const { colors } = useTheme();
  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeType, setActiveType] = useState<CategoryType>('DR');
  const [query, setQuery] = useState('');
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredCategories = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      categories
        ?.filter((cat) => cat.type === activeType)
        .filter((cat) => (q ? cat.name.toLowerCase().includes(q) : true))
        .sort((a, b) => a.name.localeCompare(b.name)) || []
    );
  }, [categories, activeType, query]);

  const totalByType = React.useMemo(
    () => categories?.filter((cat) => cat.type === activeType).length ?? 0,
    [categories, activeType]
  );

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    deleteCategory(id);
  };

  const manageOptions = React.useMemo(() => {
    if (!selectedCategory) return [];

    return [
      {
        key: 'edit-category',
        label: 'Edit category',
        icon: 'create-outline' as const,
        onPress: () => handleEdit(selectedCategory),
      },
      {
        key: 'delete-category',
        label: 'Delete category',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setShowDeleteDialog(true),
      },
    ];
  }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <Header title="Categories" subtitle="Organize your spending" showBack />

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.filtersWrap}>
            <CategoryTypeSelector
              activeType={activeType}
              onTypeChange={setActiveType}
              colors={colors}
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
              {query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.85}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterMetaRow}>
              <Text style={styles.filterMetaText}>{filteredCategories.length} shown</Text>
              <Text style={styles.filterMetaText}>{totalByType} total</Text>
            </View>
          </View>

          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <CategoryCard
                item={item}
                index={index}
                colors={colors}
                onPress={handleEdit}
                onLongPress={(cat) => {
                  setSelectedCategory(cat);
                  setShowManageDialog(true);
                }}
              />
            )}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            key={`${activeType}-list`}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="sparkles-outline" size={22} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Nothing here yet</Text>
                <Text style={styles.emptyText}>
                  No {activeType === 'DR' ? 'expense' : activeType === 'CR' ? 'income' : 'transfer'} categories match your current filter.
                </Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate}>
                  <Text style={styles.emptyBtnText}>Create category</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      <CategoryFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        category={selectedCategory || undefined}
      />

      <OptionsDialog
        visible={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        title="Manage Category"
        subtitle={selectedCategory?.name}
        options={manageOptions}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Category"
        message="This will delete the category and associated transactions."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!selectedCategory) return;
          handleDelete(selectedCategory.id);
          setSelectedCategory(null);
        }}
      />
    </SafeAreaView>
  );
};

