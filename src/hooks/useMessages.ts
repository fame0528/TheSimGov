/**
 * @fileoverview Messages Hook
 * @module hooks/useMessages
 * 
 * OVERVIEW:
 * React hook for fetching, sending, and managing messages using SWR.
 * Provides optimistic updates for seamless user experience.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import type {
  MessageDTO,
  MessageFolder,
  PaginatedResponse,
  CreateMessageRequest,
  UpdateMessageRequest,
} from '@/lib/types/messages';
import { messagesEndpoints } from '@/lib/api/endpoints';

// ============================================================
// TYPES
// ============================================================

interface MessagesApiResponse extends PaginatedResponse<MessageDTO> {
  success: boolean;
  error?: string;
}

interface SingleMessageResponse {
  success: boolean;
  message?: MessageDTO;
  error?: string;
}

interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
  error?: string;
}

interface UseMessagesOptions {
  folder?: MessageFolder;
  page?: number;
  limit?: number;
  search?: string;
  threadId?: string;
  enabled?: boolean;
  refreshInterval?: number;
}

interface UseMessagesReturn {
  messages: MessageDTO[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  unreadCount: number;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  sendMessage: (request: CreateMessageRequest) => Promise<MessageDTO>;
  updateMessage: (id: string, updates: UpdateMessageRequest) => Promise<MessageDTO>;
  deleteMessage: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  toggleStar: (id: string, starred: boolean) => Promise<void>;
  claimAttachment: (id: string, attachmentIndex: number) => Promise<void>;
}

interface UseMessageReturn {
  message: MessageDTO | null;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

interface UseUnreadCountReturn {
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// ============================================================
// FETCHER
// ============================================================

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

async function poster<T, R>(url: string, data: T): Promise<R> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Request failed');
  }
  
  return result;
}

async function patcher<T, R>(url: string, data: T): Promise<R> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Request failed');
  }
  
  return result;
}

async function deleter(url: string): Promise<void> {
  const response = await fetch(url, { method: 'DELETE' });
  const result = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Request failed');
  }
}

// ============================================================
// BUILD URL HELPER
// ============================================================

function buildUrl(options: UseMessagesOptions): string {
  const params = new URLSearchParams();
  
  if (options.threadId) {
    params.set('threadId', options.threadId);
  } else {
    params.set('folder', options.folder || 'inbox');
  }
  
  params.set('page', String(options.page || 1));
  params.set('limit', String(options.limit || 20));
  
  if (options.search) {
    params.set('search', options.search);
  }
  
  return `/api/messages?${params.toString()}`;
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook to fetch messages with filtering and pagination
 */
export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const {
    folder = 'inbox',
    page = 1,
    limit = 20,
    search,
    threadId,
    enabled = true,
    refreshInterval,
  } = options;

  const url = enabled ? buildUrl({ folder, page, limit, search, threadId }) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<MessagesApiResponse>(
    url,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  /**
   * Refresh messages list
   */
  const refresh = async () => {
    await mutate();
    // Also refresh unread count
    await globalMutate(messagesEndpoints.unread);
  };

  /**
   * Send a new message
   */
  const sendMessage = async (request: CreateMessageRequest): Promise<MessageDTO> => {
    const result = await poster<CreateMessageRequest, SingleMessageResponse>(
      messagesEndpoints.create,
      request
    );
    
    // Refresh lists
    await refresh();
    
    return result.message!;
  };

  /**
   * Update a message
   */
  const updateMessage = async (id: string, updates: UpdateMessageRequest): Promise<MessageDTO> => {
    const result = await patcher<UpdateMessageRequest, SingleMessageResponse>(
      messagesEndpoints.update(id),
      updates
    );
    
    // Optimistic update in current list
    if (data?.data) {
      const updatedMessages = data.data.map(m => 
        m.id === id ? { ...m, ...result.message } : m
      );
      mutate({ ...data, data: updatedMessages }, false);
    }
    
    return result.message!;
  };

  /**
   * Delete a message (soft delete)
   */
  const deleteMessage = async (id: string): Promise<void> => {
    await deleter(messagesEndpoints.delete(id));
    
    // Remove from current list
    if (data?.data) {
      const filteredMessages = data.data.filter(m => m.id !== id);
      mutate({ ...data, data: filteredMessages, total: data.total - 1 }, false);
    }
    
    // Refresh unread count
    await globalMutate(messagesEndpoints.unread);
  };

  /**
   * Mark a message as read
   */
  const markAsRead = async (id: string): Promise<void> => {
    await updateMessage(id, { isRead: true });
    await globalMutate(messagesEndpoints.unread);
  };

  /**
   * Toggle star status
   */
  const toggleStar = async (id: string, starred: boolean): Promise<void> => {
    await updateMessage(id, { isStarred: starred });
  };

  /**
   * Claim a currency attachment
   */
  const claimAttachment = async (id: string, attachmentIndex: number): Promise<void> => {
    await updateMessage(id, { claimAttachmentIndex: attachmentIndex });
  };

  return {
    messages: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    totalPages: data?.totalPages || 0,
    hasMore: data?.hasMore || false,
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isValidating,
    error: error ?? (data?.success === false ? new Error(data.error) : null),
    refresh,
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    toggleStar,
    claimAttachment,
  };
}

/**
 * Hook to fetch a single message by ID
 */
export function useMessage(id: string | null, enabled = true): UseMessageReturn {
  const { data, error, isLoading, isValidating, mutate } = useSWR<SingleMessageResponse>(
    enabled && id ? messagesEndpoints.byId(id) : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    message: data?.success ? data.message ?? null : null,
    isLoading,
    isValidating,
    error: error ?? (data?.success === false ? new Error(data.error) : null),
    refresh: async () => { await mutate(); },
  };
}

/**
 * Hook to fetch unread message count (for notification badges)
 */
export function useUnreadCount(enabled = true): UseUnreadCountReturn {
  const { data, error, isLoading, mutate } = useSWR<UnreadCountResponse>(
    enabled ? messagesEndpoints.unread : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    unreadCount: data?.success ? data.unreadCount : 0,
    isLoading,
    error: error ?? null,
    refresh: async () => { await mutate(); },
  };
}

/**
 * Hook to fetch a message thread
 */
export function useMessageThread(threadId: string | null, enabled = true): UseMessagesReturn {
  return useMessages({
    threadId: threadId || undefined,
    enabled: enabled && !!threadId,
  });
}

export default useMessages;
