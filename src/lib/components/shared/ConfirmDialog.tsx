/**
 * @fileoverview Confirm Dialog Component
 * @module lib/components/shared/ConfirmDialog
 * 
 * OVERVIEW:
 * Reusable confirmation modal for destructive actions.
 * Prevents accidental deletions/actions with user confirmation.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Button } from '@heroui/button';
import { useRef } from 'react';

export interface ConfirmDialogProps {
  /** Dialog open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button color scheme */
  confirmColorScheme?: string;
  /** Loading state during confirm */
  isLoading?: boolean;
}

/**
 * ConfirmDialog - Confirmation modal for destructive actions
 * 
 * @example
 * ```tsx
 * const { isOpen, onOpen, onClose } = useDisclosure();
 * 
 * <Button onClick={onOpen}>Delete Company</Button>
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onConfirm={handleDelete}
 *   title="Delete Company"
 *   message="Are you sure? This action cannot be undone."
 *   confirmText="Delete"
 *   confirmColorScheme="red"
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColorScheme = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="text-lg font-bold">
          {title}
        </ModalHeader>

        <ModalBody>{message}</ModalBody>

        <ModalFooter>
          <Button
            ref={cancelRef}
            onPress={onClose}
            isDisabled={isLoading}
            variant="flat"
          >
            {cancelText}
          </Button>
          <Button
            color={confirmColorScheme as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'}
            onPress={handleConfirm}
            className="ml-3"
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Accessibility**: Focus management with ref
 * 2. **Loading State**: Disables buttons during async operations
 * 3. **Customizable**: Text and color scheme props
 * 4. **HeroUI Modal**: Uses @heroui/modal for proper modal behavior
 * 
 * PREVENTS:
 * - Duplicate confirmation modal logic
 * - Accidental destructive actions
 * - Inconsistent confirmation UX
 */
