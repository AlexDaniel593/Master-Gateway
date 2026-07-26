'use client';

import { create } from 'zustand';
import type { MenuTree } from './types';

interface MenuState {
  menuTree: MenuTree[];
  isLoading: boolean;
  setMenuTree: (tree: MenuTree[]) => void;
  setLoading: (loading: boolean) => void;
}

export const menuStore = create<MenuState>((set) => ({
  menuTree: [],
  isLoading: false,
  setMenuTree: (tree) => set({ menuTree: tree, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
