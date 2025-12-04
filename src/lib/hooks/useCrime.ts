"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMarketplace(params?: { substance?: string; state?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const { data, error, isLoading } = useSWR(`/api/crime/marketplace${qs ? `?${qs}` : ""}`, fetcher);
  return { data: data?.data ?? [], error, isLoading } as const;
}

export function useFacilities(params?: { ownerId?: string; type?: string; state?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const { data, error, isLoading } = useSWR(`/api/crime/facilities${qs ? `?${qs}` : ""}`, fetcher);
  return { data: data?.data ?? [], error, isLoading } as const;
}

export function useRoutes(params?: { ownerId?: string; origin?: string; destination?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const { data, error, isLoading } = useSWR(`/api/crime/routes${qs ? `?${qs}` : ""}`, fetcher);
  return { data: data?.data ?? [], error, isLoading } as const;
}

export function useTransactions(params?: { userId?: string; status?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const { data, error, isLoading } = useSWR(`/api/crime/transactions${qs ? `?${qs}` : ""}`, fetcher);
  return { data: data?.data ?? [], error, isLoading } as const;
}

export function useLaundering(params?: { method?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const { data, error, isLoading } = useSWR(`/api/crime/laundering${qs ? `?${qs}` : ""}`, fetcher);
  return { data: data?.data ?? [], error, isLoading } as const;
}

export function useHeat(params?: { scope?: string; scopeId?: string; state?: string; city?: string }) {
  const qs = new URLSearchParams(
    params?.scope && params?.scopeId
      ? { scope: params.scope, scopeId: params.scopeId }
      : params?.state && params?.city
      ? { scope: "City", scopeId: `${params.state}:${params.city}` }
      : {}
  ).toString();
  const { data, error, isLoading, mutate } = useSWR<{ data: unknown; meta?: unknown }>(qs ? `/api/crime/heat?${qs}` : null, fetcher);
  return { data: data?.data ?? null, error, isLoading, meta: data?.meta, mutate } as const;
}
