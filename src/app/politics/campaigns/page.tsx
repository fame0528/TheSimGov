"use client";

import React, { useMemo } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useToast } from "@/lib/hooks/ui/useToast";
import { usePolitics } from "@/lib/hooks/usePolitics";

export default function CampaignManagerPage() {
  const toast = useToast();
  const { campaigns, isLoading, error, refresh, createCampaign, updateCampaign } = usePolitics().useCampaigns();

  const header = useMemo(() => (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">Campaign Manager</h1>
      <div className="flex items-center gap-2">
        <Button variant="flat" onPress={() => refresh()}>Refresh</Button>
        <Button color="primary" onPress={() => createCampaign()?.then(() => toast.success("Campaign created")).catch((e: any) => toast.error(`Create failed: ${e?.message ?? "Unknown error"}`))}>New Campaign</Button>
      </div>
    </div>
  ), [refresh, createCampaign]);

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>{header}</CardHeader>
        <Divider />
        <CardBody>
          <Tabs aria-label="Campaign tabs">
            <Tab key="strategy" title="Strategy">
              <StrategyTab campaigns={campaigns ?? []} onUpdate={updateCampaign} />
            </Tab>
            <Tab key="budget" title="Budget">
              <BudgetTab campaigns={campaigns ?? []} onUpdate={updateCampaign} />
            </Tab>
            <Tab key="polling" title="Polling">
              <PollingTab campaigns={campaigns ?? []} />
            </Tab>
            <Tab key="metrics" title="Metrics">
              <MetricsTab campaigns={campaigns ?? []} />
            </Tab>
            <Tab key="staff" title="Staff">
              <StaffTab campaigns={campaigns ?? []} onUpdate={updateCampaign} />
            </Tab>
            <Tab key="events" title="Events">
              <EventsTab campaigns={campaigns ?? []} onUpdate={updateCampaign} />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function StrategyTab({ campaigns, onUpdate }: { campaigns: any[]; onUpdate: (id: string, patch: any) => Promise<void> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((c) => (
        <div key={c._id} className="rounded-lg border border-default-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{c.name}</span>
            <Chip color={c.status === "Active" ? "success" : c.status === "Paused" ? "warning" : "default"}>{c.status}</Chip>
          </div>
          <Section title="Targeting">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select label="Primary Demographic" selectedKeys={[c.target?.primary ?? ""]} onSelectionChange={(key) => onUpdate(c._id, { target: { ...c.target, primary: key?.toString() } })}>
                <SelectItem key="Youth">Youth</SelectItem>
                <SelectItem key="Parents">Parents</SelectItem>
                <SelectItem key="Seniors">Seniors</SelectItem>
                <SelectItem key="Veterans">Veterans</SelectItem>
              </Select>
              <Select label="Secondary Demographic" selectedKeys={[c.target?.secondary ?? ""]} onSelectionChange={(key) => onUpdate(c._id, { target: { ...c.target, secondary: key?.toString() } })}>
                <SelectItem key="Suburban">Suburban</SelectItem>
                <SelectItem key="Urban">Urban</SelectItem>
                <SelectItem key="Rural">Rural</SelectItem>
              </Select>
            </div>
          </Section>
          <Section title="Messaging">
            <Input label="Core Message" defaultValue={c.messaging?.core ?? ""} onChange={(e) => onUpdate(c._id, { messaging: { ...c.messaging, core: e.target.value } })} />
            <Input label="Secondary Message" defaultValue={c.messaging?.secondary ?? ""} onChange={(e) => onUpdate(c._id, { messaging: { ...c.messaging, secondary: e.target.value } })} />
          </Section>
        </div>
      ))}
    </div>
  );
}

function BudgetTab({ campaigns, onUpdate }: { campaigns: any[]; onUpdate: (id: string, patch: any) => Promise<void> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((c) => (
        <div key={c._id} className="rounded-lg border border-default-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{c.name}</span>
            <Chip color="primary">${c.budget?.total ?? 0}</Chip>
          </div>
          <Section title="Allocation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input type="number" label="TV/Radio" defaultValue={String(c.budget?.tv ?? 0)} onChange={(e) => onUpdate(c._id, { budget: { ...c.budget, tv: Number(e.target.value) } })} />
              <Input type="number" label="Digital" defaultValue={String(c.budget?.digital ?? 0)} onChange={(e) => onUpdate(c._id, { budget: { ...c.budget, digital: Number(e.target.value) } })} />
              <Input type="number" label="Field" defaultValue={String(c.budget?.field ?? 0)} onChange={(e) => onUpdate(c._id, { budget: { ...c.budget, field: Number(e.target.value) } })} />
              <Input type="number" label="Print" defaultValue={String(c.budget?.print ?? 0)} onChange={(e) => onUpdate(c._id, { budget: { ...c.budget, print: Number(e.target.value) } })} />
            </div>
          </Section>
        </div>
      ))}
    </div>
  );
}

function PollingTab({ campaigns }: { campaigns: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((c) => (
        <div key={c._id} className="rounded-lg border border-default-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{c.name}</span>
            <Chip color="secondary">{c.polling?.trend ?? "Stable"}</Chip>
          </div>
          <p className="text-default-500">Polling trends and charts will render here (Phase 6 later step).</p>
        </div>
      ))}
    </div>
  );
}

function MetricsTab({ campaigns }: { campaigns: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((c) => (
        <div key={c._id} className="rounded-lg border border-default-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{c.name}</span>
            <Chip color="success">{c.metrics?.score ?? 0}</Chip>
          </div>
          <p className="text-default-500">Engagement, conversion, fundraising metrics will render here.</p>
        </div>
      ))}
    </div>
  );
}

function StaffTab({ campaigns, onUpdate }: { campaigns: any[]; onUpdate: (id: string, patch: any) => Promise<void> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((c) => (
        <div key={c._id} className="rounded-lg border border-default-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{c.name}</span>
            <Chip color="warning">{c.staff?.length ?? 0} staff</Chip>
          </div>
          <Section title="Staffing">
            <Input label="Add Staff" placeholder="Name" onChange={(e) => onUpdate(c._id, { staffAdd: e.target.value })} />
          </Section>
        </div>
      ))}
    </div>
  );
}

function EventsTab({ campaigns, onUpdate }: { campaigns: any[]; onUpdate: (id: string, patch: any) => Promise<void> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((c) => (
        <div key={c._id} className="rounded-lg border border-default-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{c.name}</span>
            <Chip color="primary">{c.events?.length ?? 0} events</Chip>
          </div>
          <Section title="New Event">
            <Input label="Event Name" placeholder="Town Hall" onChange={(e) => onUpdate(c._id, { eventAdd: e.target.value })} />
          </Section>
        </div>
      ))}
    </div>
  );
}
