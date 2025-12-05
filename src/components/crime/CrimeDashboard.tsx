/**
 * @fileoverview Crime Dashboard Component - Main tabbed interface for Crime operations
 * @module components/crime/CrimeDashboard
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

'use client';

import React from 'react';
import { Tabs, Tab, Button, Card, CardBody } from '@heroui/react';
import { Factory, Truck, ShoppingBag, DollarSign, Flame, Plus, ShoppingCart } from 'lucide-react';
import type { CrimeSummary } from '@/hooks/useCrime';
import { FacilityCard } from './FacilityCard';
import { RouteCard } from './RouteCard';
import { ListingCard } from './ListingCard';
import { ChannelCard } from './ChannelCard';
import { HeatDisplay } from './HeatDisplay';
import { TradingDashboard } from './trading/TradingDashboard';

interface CrimeDashboardProps {
  summary: CrimeSummary;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreateFacility: () => void;
  onCreateRoute: () => void;
  onCreateListing: () => void;
  onCreateChannel: () => void;
}

export function CrimeDashboard({
  summary,
  activeTab,
  onTabChange,
  onCreateFacility,
  onCreateRoute,
  onCreateListing,
  onCreateChannel,
}: CrimeDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent backdrop-blur-xl border border-blue-500/20">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                <Factory className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Facilities</p>
              <p className="text-5xl font-black text-white">{summary.totalFacilities}</p>
              <p className="text-xs text-slate-500">{summary.activeFacilities} Active</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent backdrop-blur-xl border border-emerald-500/20">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                <Truck className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Routes</p>
              <p className="text-5xl font-black text-white">{summary.totalRoutes}</p>
              <p className="text-xs text-slate-500">{summary.activeRoutes} Active</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 via-violet-600/5 to-transparent backdrop-blur-xl border border-violet-500/20">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                <ShoppingBag className="h-8 w-8 text-violet-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Listings</p>
              <p className="text-5xl font-black text-white">{summary.totalListings}</p>
              <p className="text-xs text-slate-500">{summary.activeListings} Active</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-xl border border-amber-500/20">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                <DollarSign className="h-8 w-8 text-amber-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Channels</p>
              <p className="text-5xl font-black text-white">{summary.totalChannels}</p>
              <p className="text-xs text-slate-500">{summary.totalChannels} Total</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => onTabChange(key as string)}
        variant="underlined"
        fullWidth
        classNames={{
          base: 'w-full',
          tabList: 'w-full relative rounded-none p-0 border-b border-white/10 bg-black/20 backdrop-blur-xl',
          cursor: 'w-full bg-gradient-to-r from-blue-500 to-violet-600',
          tab: 'h-14 text-slate-400 data-[hover=true]:text-white',
          tabContent: 'group-data-[selected=true]:text-white font-semibold'
        }}
      >
        <Tab
          key="overview"
          title={
            <div className="flex items-center space-x-2">
              <Flame className="h-4 w-4" />
              <span>Overview</span>
            </div>
          }
        >
          <div className="py-6 space-y-6">
            {/* Heat Levels */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Heat Levels</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-xl border border-amber-500/20">
                  <CardBody className="p-6">
                    <div className="space-y-2 text-center">
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Global Heat</p>
                      <p className="text-5xl font-black text-amber-400">{summary.globalHeat}%</p>
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-gradient-to-br from-rose-500/10 via-rose-600/5 to-transparent backdrop-blur-xl border border-rose-500/20">
                  <CardBody className="p-6">
                    <div className="space-y-2 text-center">
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">User Heat</p>
                      <p className="text-5xl font-black text-rose-400">{summary.userHeat}%</p>
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-transparent backdrop-blur-xl border border-orange-500/20">
                  <CardBody className="p-6">
                    <div className="space-y-2 text-center">
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Avg Risk</p>
                      <p className="text-5xl font-black text-orange-400">{summary.averageRiskScore.toFixed(0)}%</p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent backdrop-blur-xl border border-emerald-500/20">
                  <CardBody className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Avg Quality</p>
                      <p className="text-5xl font-black text-white">{summary.averageQuality.toFixed(0)}%</p>
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-xl border border-amber-500/20">
                  <CardBody className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Avg Route Risk</p>
                      <p className="text-5xl font-black text-white">{summary.averageRiskScore.toFixed(0)}%</p>
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent backdrop-blur-xl border border-emerald-500/20">
                  <CardBody className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Inventory Value</p>
                      <p className="text-5xl font-black text-white">${summary.totalInventoryValue.toLocaleString()}</p>
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/10 via-violet-600/5 to-transparent backdrop-blur-xl border border-violet-500/20">
                  <CardBody className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Avg Fee</p>
                      <p className="text-5xl font-black text-white">{summary.averageFeePercent.toFixed(1)}%</p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </Tab>

        <Tab
          key="facilities"
          title={
            <div className="flex items-center space-x-2">
              <Factory className="h-4 w-4" />
              <span>Facilities</span>
            </div>
          }
        >
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Production Facilities</h3>
              <Button
                color="primary"
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onCreateFacility}
              >
                New Facility
              </Button>
            </div>
            {summary.totalFacilities > 0 ? (
              <div className="text-center p-8">
                <p className="text-slate-400">You have {summary.totalFacilities} facilities. Individual facility management coming soon.</p>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent backdrop-blur-xl border border-blue-500/20">
                <CardBody className="p-8 text-center">
                  <p className="text-slate-400 mb-4">No facilities yet. Create your first facility to start production.</p>
                  <Button
                    color="primary"
                    className="mt-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={onCreateFacility}
                  >
                    Create First Facility
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="routes"
          title={
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4" />
              <span>Routes</span>
            </div>
          }
        >
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Distribution Routes</h3>
              <Button
                color="primary"
                className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onCreateRoute}
              >
                New Route
              </Button>
            </div>
            {summary.totalRoutes > 0 ? (
              <div className="text-center p-8">
                <p className="text-slate-400">You have {summary.totalRoutes} routes. Individual route management coming soon.</p>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent backdrop-blur-xl border border-emerald-500/20">
                <CardBody className="p-8 text-center">
                  <p className="text-slate-400 mb-4">No routes yet. Create your first route to start distribution.</p>
                  <Button
                    color="primary"
                    className="mt-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={onCreateRoute}
                  >
                    Create First Route
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="marketplace"
          title={
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Marketplace</span>
            </div>
          }
        >
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Marketplace Listings</h3>
              <Button
                color="primary"
                className="bg-gradient-to-br from-violet-500 to-violet-600 text-white font-semibold"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onCreateListing}
              >
                New Listing
              </Button>
            </div>
            {summary.totalListings > 0 ? (
              <div className="text-center p-8">
                <p className="text-slate-400">You have {summary.totalListings} listings. Individual listing management coming soon.</p>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-violet-500/10 via-violet-600/5 to-transparent backdrop-blur-xl border border-violet-500/20">
                <CardBody className="p-8 text-center">
                  <p className="text-slate-400 mb-4">No listings yet. Create your first listing to start selling.</p>
                  <Button
                    color="primary"
                    className="mt-4 bg-gradient-to-br from-violet-500 to-violet-600 text-white font-semibold"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={onCreateListing}
                  >
                    Create First Listing
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="laundering"
          title={
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Laundering</span>
            </div>
          }
        >
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Laundering Channels</h3>
              <Button
                color="primary"
                className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onCreateChannel}
              >
                New Channel
              </Button>
            </div>
            {summary.totalChannels > 0 ? (
              <div className="text-center p-8">
                <p className="text-slate-400">You have {summary.totalChannels} channels. Individual channel management coming soon.</p>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-xl border border-amber-500/20">
                <CardBody className="p-8 text-center">
                  <p className="text-slate-400 mb-4">No channels yet. Create your first channel to start laundering funds.</p>
                  <Button
                    color="primary"
                    className="mt-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={onCreateChannel}
                  >
                    Create First Channel
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="trading"
          title={
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Street Trading</span>
            </div>
          }
        >
          <div className="py-6">
            <TradingDashboard />
          </div>
        </Tab>

        <Tab
          key="heat"
          title={
            <div className="flex items-center space-x-2">
              <Flame className="h-4 w-4" />
              <span>Heat</span>
            </div>
          }
        >
          <div className="py-6">
            <h3 className="text-2xl font-bold text-white mb-4">Heat Level Monitoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-rose-500/10 via-rose-600/5 to-transparent backdrop-blur-xl border border-rose-500/20">
                <CardBody className="p-6">
                  <div className="text-center space-y-2">
                    <Flame className="h-12 w-12 text-rose-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Global Heat</p>
                    <p className="text-5xl font-black text-rose-400">{summary.globalHeat}%</p>
                  </div>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-xl border border-amber-500/20">
                <CardBody className="p-6">
                  <div className="text-center space-y-2">
                    <Flame className="h-12 w-12 text-amber-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">User Heat</p>
                    <p className="text-5xl font-black text-amber-400">{summary.userHeat}%</p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

export default CrimeDashboard;
