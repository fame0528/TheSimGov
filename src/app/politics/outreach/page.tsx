"use client";

import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { useToast } from "@/lib/hooks/ui/useToast";
import { usePolitics } from "@/lib/hooks/usePolitics";

export default function OutreachPage() {
  const toast = useToast();
  const { phoneBank, canvass, events, volunteers, gotv, isLoading, error, refresh, mutate } = usePolitics().useOutreach();

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold">Voter Outreach & Ground Game</h1>
            <div className="flex items-center gap-2">
              <Button variant="flat" onPress={() => refresh()}>Refresh</Button>
              <Button color="primary" onPress={() => mutate({ sync: true }).then(() => toast.success("Synced latest lists")).catch((e: any) => toast.error(`Sync failed: ${e?.message ?? "Unknown error"}`))}>Sync Lists</Button>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Tabs aria-label="Outreach tabs">
            <Tab key="phone" title="Phone Bank">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Scripts</h2>
                  <Input label="Script" placeholder="Hi, I'm calling about..." />
                  <Button color="primary">Save Script</Button>
                </div>
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Call Queue</h2>
                  <p className="text-default-500">Queued: {phoneBank?.queued ?? 0}</p>
                  <p className="text-default-500">Completed: {phoneBank?.completed ?? 0}</p>
                </div>
              </div>
            </Tab>
            <Tab key="canvass" title="Canvass">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Routes</h2>
                  <Input label="New Route" placeholder="District 12 - North" />
                  <Button color="primary">Add Route</Button>
                </div>
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Progress</h2>
                  <p className="text-default-500">Doors knocked: {canvass?.doors ?? 0}</p>
                </div>
              </div>
            </Tab>
            <Tab key="events" title="Events">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Upcoming Events</h2>
                  <p className="text-default-500">Count: {events?.length ?? 0}</p>
                </div>
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Create Event</h2>
                  <Input label="Event Name" placeholder="Town Hall" />
                  <Button color="primary">Schedule</Button>
                </div>
              </div>
            </Tab>
            <Tab key="volunteers" title="Volunteers">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Roster</h2>
                  <p className="text-default-500">Total: {volunteers?.length ?? 0}</p>
                </div>
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Add Volunteer</h2>
                  <Input label="Name" placeholder="Jane Doe" />
                  <Button color="primary">Add</Button>
                </div>
              </div>
            </Tab>
            <Tab key="gotv" title="GOTV">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Plan</h2>
                  <Input label="Plan Name" placeholder="Weekend Blitz" />
                  <Button color="primary">Save Plan</Button>
                </div>
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Metrics</h2>
                  <p className="text-default-500">Contacts: {gotv?.contacts ?? 0}</p>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
