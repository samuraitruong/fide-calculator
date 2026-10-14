import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { RatingType } from '@fide-calculator/shared';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseRatingList } from '@/hooks/useSupabaseRatingList';
import { useTheme } from '../contexts/ThemeContext';
import FideCalculator from '@/components/FideCalculator';

export default function HomeScreen() {
  const storageMode = useStorageMode();
  const { colors, spacing } = useTheme();
  const { activeProfile } = useAuth();
  const {
    activeProfile: localActiveProfile,
    results: localResults,
    addResult: localAddResult,
    updateResult: localUpdateResult,
    removeResult: localRemoveResult,
  } = useLocalStorage();
  const [ratingType, setRatingType] = useState<RatingType>('standard');
  const {
    results: cloudResults,
    addResult: cloudAddResult,
    updateResult: cloudUpdateResult,
    removeResult: cloudRemoveResult,
  } = useSupabaseRatingList(ratingType);

  const isLocal = storageMode === 'local';
  const profile = isLocal ? localActiveProfile : activeProfile;
  const results = isLocal ? localResults : cloudResults;
  const addResult = isLocal ? localAddResult : cloudAddResult;
  const updateResult = isLocal ? localUpdateResult : cloudUpdateResult;
  const removeResult = isLocal ? localRemoveResult : cloudRemoveResult;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.canvas }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.screenInset,
          paddingBottom: spacing.xxxl + spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
    >
      <FideCalculator
        mode={storageMode}
        ratingType={ratingType}
        onChangeRatingType={setRatingType}
        profile={profile}
        results={results}
        addResult={addResult}
        updateResult={updateResult}
        removeResult={removeResult}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
});
