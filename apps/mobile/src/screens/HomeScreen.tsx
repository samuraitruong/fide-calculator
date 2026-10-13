import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { RatingType } from '@fide-calculator/shared';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseRatingList } from '@/hooks/useSupabaseRatingList';
import FideCalculator from '@/components/FideCalculator';
import { colors, spacing } from '../theme/tokens';

export default function HomeScreen() {
  const storageMode = useStorageMode();
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
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.screenInset,
    paddingBottom: spacing.xxxl + spacing.xl,
    alignItems: 'stretch',
  },
});
