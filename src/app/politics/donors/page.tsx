"use client";

import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useToast } from "@/lib/hooks/ui/useToast";
import { usePolitics } from "@/lib/hooks/usePolitics";

export default function DonorManagementPage() {
  const toast = useToast();
  const { donors, fundraising, reports, isLoading, error, refresh, addDonor, scheduleEvent } = usePolitics().useDonors();

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold">Donor Management & Fundraising</h1>
            <div className="flex items-center gap-2">
              <Button variant="flat" onPress={() => refresh()}>Refresh</Button>
              <Button color="primary" onPress={() => scheduleEvent({ name: "Fundraiser" }).then(() => toast.success("Event scheduled")).catch((e: any) => toast.error(`Schedule failed: ${e?.message ?? "Unknown error"}`))}>New Event</Button>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Tabs aria-label="Donor tabs">
            <Tab key="database" title="Donor DB">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Add Donor</h2>
                  <Input label="Name" placeholder="John Smith" />
                  <Input label="Amount" type="number" placeholder="250" />
                  <Button color="primary" onPress={() => addDonor({ name: "John Smith", amount: 250 })}>Add</Button>
                </div>
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Donors</h2>
                  <p className="text-default-500">Total: {donors?.length ?? 0}</p>
                </div>
              </div>
            </Tab>
            <Tab key="fundraising" title="Fundraising Events">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Upcoming</h2>
                  <p className="text-default-500">Count: {fundraising?.events?.length ?? 0}</p>
                </div>
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Schedule Event</h2>
                  <Input label="Event Name" placeholder="Dinner" />
                  <Button color="primary">Schedule</Button>
                </div>
              </div>
            </Tab>
            <Tab key="reports" title="Reports">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Summary</h2>
                  <p className="text-default-500">Raised: ${reports?.raised ?? 0}</p>
                </div>
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Bundlers</h2>
                  <p className="text-default-500">Count: {reports?.bundlers ?? 0}</p>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
