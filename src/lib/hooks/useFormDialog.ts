'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form dialog state (open/new/edit/save pattern)
 * Reduces boilerplate for CRUD dialogs across sections
 */
export function useFormDialog<T extends object>(initialState: T) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string } & T | null>(null);
  const [formData, setFormData] = useState<T>(initialState);

  const openNewDialog = useCallback(() => {
    setEditingItem(null);
    setFormData(initialState);
    setDialogOpen(true);
  }, [initialState]);

  const openEditDialog = useCallback((item: { id: string } & T) => {
    setEditingItem(item);
    setFormData(item);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingItem(null);
  }, []);

  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);

  return {
    dialogOpen,
    setDialogOpen,
    editingItem,
    setEditingItem,
    formData,
    setFormData,
    updateFormData,
    openNewDialog,
    openEditDialog,
    closeDialog,
    resetFormData,
    isNew: !editingItem,
  };
}

/**
 * Custom hook for delete confirmation dialog
 */
export function useDeleteDialog() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openDeleteDialog = useCallback((id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeletingId(null);
  }, []);

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    deletingId,
    openDeleteDialog,
    closeDeleteDialog,
  };
}

/**
 * Custom hook for managing filter state
 */
export function useFilter<T extends string>(defaultFilter: T) {
  const [filter, setFilter] = useState<T>(defaultFilter);

  const updateFilter = useCallback((newFilter: T) => {
    setFilter(newFilter);
  }, []);

  const resetFilter = useCallback(() => {
    setFilter(defaultFilter);
  }, [defaultFilter]);

  return {
    filter,
    setFilter,
    updateFilter,
    resetFilter,
  };
}

/**
 * Custom hook for managing sort state
 */
export function useSort<T extends string>(defaultSort: T, defaultDirection: 'asc' | 'desc' = 'asc') {
  const [sortBy, setSortBy] = useState<T>(defaultSort);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultDirection);

  const updateSort = useCallback((newSort: T) => {
    if (sortBy === newSort) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSort);
      setSortDirection('asc');
    }
  }, [sortBy]);

  return {
    sortBy,
    sortDirection,
    updateSort,
    setSortDirection,
  };
}

/**
 * Custom hook for managing pagination state
 */
export function usePagination(defaultPageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    offset: (currentPage - 1) * pageSize,
  };
}

const formDialogHooks = {
  useFormDialog,
  useDeleteDialog,
  useFilter,
  useSort,
  usePagination,
};

export default formDialogHooks;
