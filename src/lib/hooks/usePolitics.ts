import { useMemo } from "react";

type AsyncFn<TArgs extends any[] = any[], TReturn = void> = (...args: TArgs) => Promise<TReturn>;

export function usePolitics() {
  const useCampaigns = () => {
    const campaigns: any[] = [];
    const isLoading = false;
    const error = undefined as unknown as Error | undefined;
    const refresh: AsyncFn = async () => {};
    const createCampaign: AsyncFn = async () => {};
    const updateCampaign: AsyncFn<[string, any]> = async () => {};
    return { campaigns, isLoading, error, refresh, createCampaign, updateCampaign };
  };

  const useDonors = () => {
    const donors: any[] = [];
    const fundraising: any = { events: [] };
    const reports: any = { raised: 0, bundlers: 0 };
    const isLoading = false;
    const error = undefined as unknown as Error | undefined;
    const refresh: AsyncFn = async () => {};
    const addDonor: AsyncFn<[any]> = async () => {};
    const scheduleEvent: AsyncFn<[any]> = async () => {};
    return { donors, fundraising, reports, isLoading, error, refresh, addDonor, scheduleEvent };
  };

  const useOutreach = () => {
    const phoneBank: any = { queued: 0, completed: 0 };
    const canvass: any = { doors: 0 };
    const events: any[] = [];
    const volunteers: any[] = [];
    const gotv: any = { contacts: 0 };
    const isLoading = false;
    const error = undefined as unknown as Error | undefined;
    const refresh: AsyncFn = async () => {};
    const mutate: AsyncFn<[any]> = async () => {};
    return { phoneBank, canvass, events, volunteers, gotv, isLoading, error, refresh, mutate };
  };

  const usePolicy = () => {
    const bills: any[] = [];
    const policies: any[] = [];
    const isLoading = false;
    const error = undefined as unknown as Error | undefined;
    const refresh: AsyncFn = async () => {};
    const createBill: AsyncFn = async () => {};
    const updateBill: AsyncFn<[string, any]> = async () => {};
    const voteBill: AsyncFn<[string, string]> = async () => {};
    return { bills, policies, isLoading, error, refresh, createBill, updateBill, voteBill };
  };

  const useDistricts = () => {
    const districts: any[] = [];
    const demographics: any = {};
    const isLoading = false;
    const error = undefined as unknown as Error | undefined;
    const refresh: AsyncFn = async () => {};
    return { districts, demographics, isLoading, error, refresh };
  };

  return useMemo(() => ({ useCampaigns, useDonors, useOutreach, usePolicy, useDistricts }), []);
}

export default usePolitics;