/**
 * @file lib/notifications/toast.ts
 * @description Centralized toast notification utilities using react-toastify
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Provides strongly-typed toast notification helpers for consistent UX across the app.
 * Supports success, error, warning, info, and contract-specific notification types.
 */

import { toast, ToastOptions, Id } from 'react-toastify';

/**
 * Default toast configuration for consistent styling
 */
const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'dark',
};

/**
 * Success notification (green)
 */
export const notifySuccess = (message: string, options?: ToastOptions): Id => {
  return toast.success(message, { ...defaultOptions, ...options });
};

/**
 * Error notification (red)
 */
export const notifyError = (message: string, options?: ToastOptions): Id => {
  return toast.error(message, { ...defaultOptions, ...options });
};

/**
 * Warning notification (orange)
 */
export const notifyWarning = (message: string, options?: ToastOptions): Id => {
  return toast.warning(message, { ...defaultOptions, ...options });
};

/**
 * Info notification (blue)
 */
export const notifyInfo = (message: string, options?: ToastOptions): Id => {
  return toast.info(message, { ...defaultOptions, ...options });
};

/**
 * Contract-specific notifications
 */
export const contractNotifications = {
  /** Bid submitted successfully */
  bidSubmitted: (contractTitle: string, rank: number, totalBids: number, winProbability: number) => {
    return notifySuccess(
      `Bid submitted for "${contractTitle}"! Ranked ${rank}/${totalBids} with ${winProbability}% win chance`,
      { autoClose: 7000 }
    );
  },

  /**
   * Bid failed
   */
  bidFailed: (contractTitle: string, reason: string) => {
    return notifyError(`Failed to submit bid for "${contractTitle}": ${reason}`);
  },

  /**
   * Milestone completed
   */
  milestoneCompleted: (milestoneName: string, contractTitle: string, qualityScore?: number) => {
    const qualityText = qualityScore ? ` (Quality: ${qualityScore})` : '';
    return notifySuccess(`Milestone "${milestoneName}" completed for ${contractTitle}${qualityText}!`);
  },

  /**
   * Contract completed
   */
  contractCompleted: (contractTitle: string, finalPayment: number, reputationImpact: number) => {
    const reputationText = reputationImpact > 0 
      ? `+${reputationImpact} reputation` 
      : reputationImpact < 0 
        ? `${reputationImpact} reputation` 
        : 'no reputation change';
    return notifySuccess(
      `Contract "${contractTitle}" completed! Payment: $${finalPayment.toLocaleString()} • ${reputationText}`,
      { autoClose: 10000 }
    );
  },

  /**
   * Progress updated
   */
  progressUpdated: (contractTitle: string, completionPercentage: number) => {
    return notifyInfo(`${contractTitle}: ${completionPercentage.toFixed(1)}% complete`);
  },

  /**
   * Deadline warning (contract approaching deadline)
   */
  deadlineWarning: (contractTitle: string, daysRemaining: number) => {
    return notifyWarning(
      `"${contractTitle}" deadline approaching! ${daysRemaining} days remaining`,
      { autoClose: 8000 }
    );
  },

  /**
   * Quality score alert
   */
  qualityAlert: (contractTitle: string, qualityScore: number, tier: string) => {
    if (qualityScore >= 85) {
      return notifySuccess(`Excellent quality on "${contractTitle}"! Score: ${qualityScore} (${tier})`);
    } else if (qualityScore >= 70) {
      return notifyInfo(`Good quality on "${contractTitle}". Score: ${qualityScore} (${tier})`);
    } else {
      return notifyWarning(`Quality concerns on "${contractTitle}". Score: ${qualityScore} (${tier})`);
    }
  },

  /**
   * Auto-progression complete
   */
  autoProgressionComplete: (contractTitle: string, dailyProgress: number, estimatedCompletion?: string) => {
    const estText = estimatedCompletion 
      ? ` • Est. completion: ${new Date(estimatedCompletion).toLocaleDateString()}` 
      : '';
    return notifyInfo(
      `Auto-progression applied to "${contractTitle}". Daily rate: ${dailyProgress.toFixed(2)}%${estText}`,
      { autoClose: 6000 }
    );
  },

  /**
   * Bid won notification
   */
  bidWon: (contractTitle: string, bidAmount: number) => {
    return notifySuccess(
      `🎉 Congratulations! You won the contract "${contractTitle}" with bid of $${bidAmount.toLocaleString()}!`,
      { autoClose: 10000 }
    );
  },

  /**
   * Bid lost notification
   */
  bidLost: (contractTitle: string) => {
    return notifyInfo(`Your bid for "${contractTitle}" was not selected. Better luck next time!`);
  },

  /**
   * Penalty applied
   */
  penaltyApplied: (contractTitle: string, penaltyAmount: number, reason: string) => {
    return notifyWarning(
      `Penalty applied to "${contractTitle}": $${penaltyAmount.toLocaleString()} (${reason})`,
      { autoClose: 8000 }
    );
  },

  /**
   * Bonus earned
   */
  bonusEarned: (contractTitle: string, bonusAmount: number, reason: string) => {
    return notifySuccess(
      `Bonus earned on "${contractTitle}": +$${bonusAmount.toLocaleString()} (${reason})`,
      { autoClose: 8000 }
    );
  },
};

/**
 * Generic notification with custom styling
 */
export const notify = (message: string, options?: ToastOptions): Id => {
  return toast(message, { ...defaultOptions, ...options });
};

/**
 * Dismiss a specific toast by ID
 */
export const dismissToast = (toastId: Id): void => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all active toasts
 */
export const dismissAllToasts = (): void => {
  toast.dismiss();
};

/**
 * Promise-based toast for async operations
 * @example
 * notifyPromise(
 *   apiCall(),
 *   {
 *     pending: 'Submitting bid...',
 *     success: 'Bid submitted!',
 *     error: 'Failed to submit bid'
 *   }
 * );
 */
export const notifyPromise = <T = unknown,>(
  promise: Promise<T>,
  messages: {
    pending: string;
    success: string;
    error: string;
  },
  options?: Partial<ToastOptions>
): Promise<T> => {
  return toast.promise<T>(
    promise,
    messages,
    { ...defaultOptions, ...options } as ToastOptions<T>
  );
};
