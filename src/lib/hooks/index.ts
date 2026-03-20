/**
 * Custom Hooks Index
 * Re-exports all custom hooks for easy importing
 */

// Form and Dialog Hooks
export {
  useFormDialog,
  useDeleteDialog,
  useFilter,
  useSort,
  usePagination,
} from './useFormDialog';

// Utility Hooks
export {
  useLocalStorage,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersDarkMode,
  useOnlineStatus,
} from './useLocalStorage';

// Default export
import formDialogHooks from './useFormDialog';
import utilityHooks from './useLocalStorage';

export default {
  ...formDialogHooks,
  ...utilityHooks,
};
