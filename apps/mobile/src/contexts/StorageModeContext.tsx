import React, { createContext, useContext, ReactNode } from 'react';

export type StorageMode = 'local' | 'cloud';

const StorageModeContext = createContext<StorageMode | undefined>(undefined);

export function StorageModeProvider({
  mode,
  children,
}: {
  mode: StorageMode;
  children: ReactNode;
}) {
  return (
    <StorageModeContext.Provider value={mode}>
      {children}
    </StorageModeContext.Provider>
  );
}

export function useStorageMode(): StorageMode {
  const mode = useContext(StorageModeContext);
  if (mode === undefined) {
    throw new Error('useStorageMode must be used within StorageModeProvider');
  }
  return mode;
}
