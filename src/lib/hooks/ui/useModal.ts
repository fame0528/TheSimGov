/**
 * @fileoverview Modal State Management Hook
 * @module lib/hooks/ui/useModal
 * 
 * OVERVIEW:
 * Manages open/close state for modals and dialogs.
 * Provides consistent modal state management pattern.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { useState, useCallback } from 'react';

export interface ModalState {
  /** Modal open state */
  isOpen: boolean;
  /** Open modal */
  open: () => void;
  /** Close modal */
  close: () => void;
  /** Toggle modal */
  toggle: () => void;
}

/**
 * useModal - Modal state management
 * 
 * @param defaultOpen - Initial state (default: false)
 * 
 * @example
 * ```tsx
 * const modal = useModal();
 * 
 * return (
 *   <>
 *     <Button onClick={modal.open}>Create Company</Button>
 *     <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *       <CreateCompanyForm onSuccess={modal.close} />
 *     </Modal>
 *   </>
 * );
 * ```
 */
export function useModal(defaultOpen = false): ModalState {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, open, close, toggle };
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Simple**: Boolean state with helpers
 * 2. **Memoized**: Callbacks use useCallback for performance
 * 3. **Flexible**: Works with any modal component
 * 4. **Consistent**: Same pattern across all modals
 * 
 * PREVENTS:
 * - Duplicate modal state management
 * - Inconsistent open/close patterns
 */
