"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface BusinessListParams {
  ownerId?: string;
  companyId?: string;
  category?: string;
  status?: string;
  state?: string;
  city?: string;
  limit?: number;
  skip?: number;
}

export function useBusinessList(params?: BusinessListParams) {
  const qs = new URLSearchParams(
    Object.entries(params || {}).reduce<Record<string,string>>((acc,[k,v]) => {
      if (v === undefined || v === null) return acc;
      acc[k] = String(v);
      return acc;
    }, {})
  ).toString();
  const { data, error, isLoading, mutate } = useSWR(`/api/business${qs ? `?${qs}` : ''}`, fetcher);
  return {
    data: data?.businesses ?? [],
    pagination: data?.pagination ?? { total: 0, limit: params?.limit ?? 50, skip: params?.skip ?? 0, pages: 0 },
    error,
    isLoading,
    mutate,
  } as const;
}

export function useBusiness(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/business/${id}` : null, fetcher);
  return { business: data?.business ?? null, error, isLoading, mutate } as const;
}

export async function createBusiness(payload: any, idempotencyKey?: string) {
  const resp = await fetch('/api/business', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify(payload),
  });
  return resp.json();
}

export async function updateBusiness(id: string, payload: any & { version?: number; ifUnmodifiedSince?: string }) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (payload.ifUnmodifiedSince) headers['If-Unmodified-Since'] = payload.ifUnmodifiedSince;
  const { ifUnmodifiedSince: _removed, ...body } = payload;
  const resp = await fetch(`/api/business/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return resp.json();
}

export async function deleteBusiness(id: string, opts?: { version?: number; ifUnmodifiedSince?: string }) {
  const headers: Record<string,string> = {};
  if (typeof opts?.version === 'number') headers['If-Match-Version'] = String(opts.version);
  if (opts?.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;
  const resp = await fetch(`/api/business/${id}`, { method: 'DELETE', headers });
  if (resp.status === 204) return { success: true };
  return resp.json();
}
