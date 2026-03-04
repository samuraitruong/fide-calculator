import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type MenuContextValue = {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);

  return (
    <MenuContext.Provider value={{ open, openMenu, closeMenu, toggleMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (ctx === undefined) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return ctx;
}
