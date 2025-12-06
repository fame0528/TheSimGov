// OVERVIEW: Energy overview dashboard composition shell
// Date: 2025-11-28
import React from 'react';
import { Tabs, Tab } from '@heroui/react';
import { OilGasOperations } from './OilGasOperations';
import { RenewableEnergyDashboard } from './RenewableEnergyDashboard';

type TabKey = 'oil-gas' | 'renewables';

export function EnergyDashboard() {
  const [tab, setTab] = React.useState<TabKey>('oil-gas');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Energy Industry Dashboard</h1>
        <p className="text-gray-400 mt-1">Manage oil, gas, and renewable energy operations</p>
      </div>

      {/* Tabs - AAA Design */}
      <Tabs 
        selectedKey={tab} 
        onSelectionChange={(key) => setTab(key as TabKey)}
        color="primary"
        classNames={{
          tabList: "bg-slate-800/50 border border-slate-700",
          cursor: "bg-primary",
          tab: "text-gray-400 data-[selected=true]:text-white",
          tabContent: "group-data-[selected=true]:text-white"
        }}
      >
        <Tab key="oil-gas" title="⛽ Oil & Gas" />
        <Tab key="renewables" title="🌱 Renewables" />
      </Tabs>

      {tab === 'oil-gas' ? <OilGasOperations /> : <RenewableEnergyDashboard />}
    </div>
  );
}

export default EnergyDashboard;
