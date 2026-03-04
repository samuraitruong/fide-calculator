import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { RatingType } from '@fide-calculator/shared';
import { useStorageMode } from '@/contexts/StorageModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseRatingList } from '@/hooks/useSupabaseRatingList';
import FideCalculator from '@/components/FideCalculator';

export default function HomeScreen() {
  const storageMode = useStorageMode();
  const { activeProfile } = useAuth();
  const {
    activeProfile: localActiveProfile,
    results: localResults,
    addResult: localAddResult,
    updateResult: localUpdateResult,
  } = useLocalStorage();
  const [ratingType, setRatingType] = useState<RatingType>('standard');
  const {
    results: cloudResults,
    addResult: cloudAddResult,
    updateResult: cloudUpdateResult,
  } = useSupabaseRatingList(ratingType);

  const isLocal = storageMode === 'local';
  const profile = isLocal ? localActiveProfile : activeProfile;
  const results = isLocal ? localResults : cloudResults;
  const addResult = isLocal ? localAddResult : cloudAddResult;
  const updateResult = isLocal ? localUpdateResult : cloudUpdateResult;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FideCalculator
        mode={storageMode}
        ratingType={ratingType}
        onChangeRatingType={setRatingType}
        profile={profile}
        results={results}
        addResult={addResult}
        updateResult={updateResult}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'stretch',
  },
});
