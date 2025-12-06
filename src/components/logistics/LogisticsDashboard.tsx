/**
 * @file src/components/logistics/LogisticsDashboard.tsx
 * @description Dashboard component for logistics resources - AAA Design
 * @created 2025-12-05
 *
 * OVERVIEW:
 * Displays all logistics resources in a tabbed dashboard with filters and CRUD actions.
 * Uses HeroUI Tabs, Card, and SWR hooks for data.
 */

import React, { useState, useMemo } from 'react';
import { Tabs, Tab, Card, CardHeader, CardBody, Button, Input, Chip } from '@heroui/react';
import { Truck, Warehouse, Route, FileText, Package, TrendingUp, DollarSign } from 'lucide-react';
import { useVehicles, useWarehouses, useRoutes, useContracts, useShipments } from '@/hooks/useLogistics';
import { LogisticsCard } from './LogisticsCard';

/**
 * KPI Card component - AAA Design matching Banking
 */
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-900/30 text-blue-400',
    green: 'bg-green-900/30 text-green-400',
    yellow: 'bg-yellow-900/30 text-yellow-400',
    red: 'bg-red-900/30 text-red-400',
    purple: 'bg-purple-900/30 text-purple-400',
  };

  return (
    <Card className="p-4 bg-slate-800/50 border border-slate-700">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1 text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </Card>
  );
}

export function LogisticsDashboard({ companyId }: { companyId: string }) {
  const [tab, setTab] = useState<'vehicles' | 'warehouses' | 'routes' | 'contracts' | 'shipments'>('vehicles');
  const [search, setSearch] = useState('');

  const { data: vehicles = [] } = useVehicles(companyId);
  const { data: warehouses = [] } = useWarehouses(companyId);
  const { data: routes = [] } = useRoutes(companyId);
  const { data: contracts = [] } = useContracts(companyId);
  const { data: shipments = [] } = useShipments(companyId);

  const tabData = {
    vehicles,
    warehouses,
    routes,
    contracts,
    shipments,
  };

  const filtered = tabData[tab].filter((r) => {
    if (!search) return true;
    return JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
  });

  // Calculate metrics
  const totalVehicles = vehicles.length;
  const totalWarehouses = warehouses.length;
  const activeShipments = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Logistics Dashboard</h1>
        <p className="text-gray-400 mt-1">Manage vehicles, warehouses, routes, and shipments</p>
      </div>

      {/* KPI Cards - AAA Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Vehicles"
          value={totalVehicles}
          subtitle="Fleet size"
          icon={Truck}
          color="blue"
        />
        <KPICard
          title="Warehouses"
          value={totalWarehouses}
          subtitle="Storage facilities"
          icon={Warehouse}
          color="green"
        />
        <KPICard
          title="Active Shipments"
          value={activeShipments}
          subtitle="In transit"
          icon={Package}
          color="yellow"
        />
        <KPICard
          title="Active Contracts"
          value={activeContracts}
          subtitle="Ongoing agreements"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Tabs and Content - AAA Design */}
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between gap-4 p-4">
          <Tabs 
            selectedKey={tab} 
            onSelectionChange={k => setTab(k as typeof tab)}
            color="primary"
            classNames={{
              tabList: "bg-slate-700/50",
              cursor: "bg-primary",
              tab: "text-gray-400 data-[selected=true]:text-white",
            }}
          >
            <Tab key="vehicles" title="🚛 Vehicles" />
            <Tab key="warehouses" title="🏭 Warehouses" />
            <Tab key="routes" title="🗺️ Routes" />
            <Tab key="contracts" title="📄 Contracts" />
            <Tab key="shipments" title="📦 Shipments" />
          </Tabs>
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
            classNames={{
              input: "bg-slate-700 text-white",
              inputWrapper: "bg-slate-700 border-slate-600"
            }}
          />
        </CardHeader>
        <CardBody className="p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No results found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((r, i) => (
                <LogisticsCard key={r.id || i} resource={r} type={tab.slice(0, -1) as 'vehicle' | 'warehouse' | 'route' | 'contract' | 'shipment'} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
