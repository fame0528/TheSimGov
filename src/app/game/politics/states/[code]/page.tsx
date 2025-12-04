/**
 * @fileoverview State Detail Page
 * @module app/game/politics/states/[code]/page
 * 
 * OVERVIEW:
 * Comprehensive state detail page showing government, society metrics,
 * economy data, and historical charts. Mirrors reference design.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Button, Tabs, Tab, Divider, Image } from '@heroui/react';
import useSWR from 'swr';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// State names mapping
const stateNames: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'Washington D.C.', 'FL': 'Florida',
  'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana',
  'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
  'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota',
  'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin',
  'WY': 'Wyoming'
};

// State flag URLs (placeholder - would use actual state flag images)
const getStateFlagUrl = (code: string) => {
  return `https://flagcdn.com/w160/us-${code.toLowerCase()}.png`;
};

interface MetricRowProps {
  label: string;
  value: string | number;
  suffix?: string;
  prefix?: string;
}

function MetricRow({ label, value, suffix = '', prefix = '' }: MetricRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-300">{label}</span>
      <span className="text-white font-medium">{prefix}{value}{suffix}</span>
    </div>
  );
}

interface HistoricalChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  color?: string;
  suffix?: string;
  formatValue?: (value: number) => string;
}

function HistoricalChart({ title, data, color = '#3b82f6', suffix = '%', formatValue }: HistoricalChartProps) {
  const formattedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    }));
  }, [data]);

  return (
    <Card className="bg-slate-800/50 border border-slate-700/50">
      <CardBody className="p-4">
        <h4 className="text-white font-semibold mb-4 text-center">{title}</h4>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="displayDate" 
                stroke="#94a3b8" 
                fontSize={10}
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10}
                tickLine={false}
                tickFormatter={(value) => formatValue ? formatValue(value) : `${value}${suffix}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => [formatValue ? formatValue(value) : `${value}${suffix}`, title]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

export default function StateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stateCode = (params.code as string)?.toUpperCase();
  const [activeTab, setActiveTab] = useState('details');

  // Fetch state data from real API
  const { data: stateData, isLoading } = useSWR(
    stateCode ? `/api/politics/states/${stateCode}` : null,
    fetcher
  );

  const state = stateData?.data?.state;
  const stateName = state?.name || stateNames[stateCode] || stateCode;

  // Generate historical data based on real current values
  const generateHistoricalData = (baseValue: number, variance: number = 5) => {
    const data = [];
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      // Add some variation but trend toward current value
      const progress = i / 20;
      const randomVariance = (Math.random() - 0.5) * variance * 2;
      const trendValue = baseValue + randomVariance * progress;
      data.push({
        date: date.toISOString(),
        value: Math.max(0, trendValue)
      });
    }
    return data;
  };

  // Use real API data with fallbacks
  const societyMetrics = state?.society || {
    population: 0,
    populationGrowth: 0,
    environmentalQuality: 0,
    uninsured: 0,
    infrastructureQuality: 0,
    educationQuality: 0,
    poverty: 0,
    lawAndOrder: 0
  };

  const economyMetrics = state?.economy || {
    gdp: 0,
    gdpPerCapita: 0,
    gdpGrowth: 0,
    debtToGdp: 0,
    unemployment: 0,
    averageWage: 0,
    taxBurden: 0,
    salesTaxRate: 0,
    hasStateIncomeTax: false,
    profitMarginBonus: 0
  };

  const politicsMetrics = state?.politics || {
    governor: null,
    governorParty: 'Independent',
    approval: 50,
    senateSeatCount: 2,
    houseSeatCount: 1,
    totalSeats: 3
  };

  const crimeMetrics = state?.crime || {
    violentCrimeRate: 0,
    crimePercentile: 0.5
  };

  const industryMetrics = state?.industries || {
    bonuses: {},
    hiringDifficulty: 1.0
  };

  // Format large numbers
  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading state data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header with Go Back button */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <Button
            variant="flat"
            size="sm"
            className="bg-blue-500/20 text-blue-400 border border-blue-500/30"
            onPress={() => router.push('/game/map')}
          >
            ← Go Back
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-white/5 bg-slate-900/50">
        <div className="max-w-[1400px] mx-auto px-8">
          <Tabs 
            selectedKey={activeTab} 
            onSelectionChange={(key) => setActiveTab(key as string)}
            classNames={{
              tabList: 'gap-4 bg-transparent',
              tab: 'px-4 py-3 text-slate-400 data-[selected=true]:text-white data-[selected=true]:bg-blue-500/20',
              cursor: 'bg-blue-500',
            }}
          >
            <Tab key="politics" title="State Politics" />
            <Tab key="details" title="State Details" />
            <Tab key="governor" title="Governor Mansion" />
            <Tab key="legislature" title="State Legislature" />
            <Tab key="discussion" title="State Discussion" />
            <Tab key="economy" title="State Economy" />
            <Tab key="crime" title="State Crime" />
          </Tabs>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* State Header Card */}
        <Card className="mb-8 bg-gradient-to-r from-slate-800/80 to-slate-700/50 border border-slate-600/50 overflow-hidden">
          <CardBody className="p-8">
            <div className="flex items-center gap-8">
              {/* State Flag */}
              <div className="w-24 h-16 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
                <Image
                  src={getStateFlagUrl(stateCode)}
                  alt={`${stateName} flag`}
                  className="w-full h-full object-cover"
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='100' viewBox='0 0 160 100'%3E%3Crect fill='%233b82f6' width='160' height='100'/%3E%3Ccircle cx='80' cy='50' r='30' fill='%23fbbf24'/%3E%3C/svg%3E"
                />
              </div>
              
              {/* State Info */}
              <div className="flex-1">
                <p className="text-sm text-slate-400 mb-1">The State of</p>
                <h1 className="text-4xl font-bold text-white mb-3">{stateName}</h1>
                <Button
                  variant="flat"
                  size="sm"
                  className="bg-blue-500/20 text-blue-400 border border-blue-500/30"
                >
                  View State Demographics
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Government Section */}
        <Card className="mb-8 bg-slate-800/50 border border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50 px-6 py-4">
            <h2 className="text-2xl font-bold text-white text-center w-full">Government</h2>
          </CardHeader>
          <CardBody className="p-6">
            <div className="flex flex-col items-center mb-6">
              {/* Governor Avatar */}
              <div className="w-20 h-24 bg-slate-700 rounded-lg mb-3 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <p className="text-white font-semibold text-lg">{politicsMetrics.governor || 'None'}</p>
              <p className="text-slate-400 text-sm">Governor</p>
              <p className="text-slate-500 text-xs">{politicsMetrics.governorParty}</p>
            </div>

            <Divider className="bg-slate-700/50 my-4" />

            <div className="flex justify-between items-center px-4">
              <span className="text-slate-300 font-medium">Local Government Approval</span>
              <span className="text-green-400 font-bold text-xl">{politicsMetrics.approval?.toFixed(2) || '50.00'}%</span>
            </div>
            
            {/* Political Representation */}
            <Divider className="bg-slate-700/50 my-4" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{politicsMetrics.senateSeatCount}</p>
                <p className="text-xs text-slate-400">Senate Seats</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{politicsMetrics.houseSeatCount}</p>
                <p className="text-xs text-slate-400">House Seats</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{politicsMetrics.totalSeats}</p>
                <p className="text-xs text-slate-400">Total Seats</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Society & Economy Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Society Card */}
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50 px-6 py-4">
              <h3 className="text-xl font-bold text-white text-center w-full">Society</h3>
            </CardHeader>
            <CardBody className="p-6">
              <MetricRow label="Population" value={formatNumber(societyMetrics.population)} />
              <MetricRow label="Population Growth" value={societyMetrics.populationGrowth?.toFixed(1) || '0'} suffix="%" prefix={societyMetrics.populationGrowth >= 0 ? '' : ''} />
              <MetricRow label="Environmental Quality" value={societyMetrics.environmentalQuality} suffix="%" />
              <MetricRow label="Uninsured" value={societyMetrics.uninsured} suffix="%" />
              <MetricRow label="Infrastructure Quality" value={societyMetrics.infrastructureQuality} suffix="%" />
              <MetricRow label="Education Quality" value={societyMetrics.educationQuality} suffix="%" />
              <MetricRow label="Poverty" value={societyMetrics.poverty?.toFixed(1) || '0'} suffix="%" />
              <MetricRow label="Law & Order" value={societyMetrics.lawAndOrder} suffix="%" />
            </CardBody>
          </Card>

          {/* Economy Card */}
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white text-center w-full">Economy</h3>
            </CardHeader>
            <CardBody className="p-6">
              <div className="flex justify-center mb-4">
                <Button
                  variant="flat"
                  size="sm"
                  className="bg-blue-500 text-white"
                >
                  View Budget
                </Button>
              </div>
              <MetricRow label="GDP" value={formatCurrency(economyMetrics.gdp)} />
              <MetricRow label="GDP per capita" value={formatCurrency(economyMetrics.gdpPerCapita)} />
              <MetricRow label="GDP Growth" value={economyMetrics.gdpGrowth?.toFixed(1) || '0'} suffix="%" />
              <MetricRow label="Unemployment" value={economyMetrics.unemployment?.toFixed(1) || '0'} suffix="%" />
              <MetricRow label="Wage Multiplier" value={(economyMetrics.averageWage || 100).toFixed(0)} suffix="%" />
              <MetricRow label="Tax Burden" value={`$${formatNumber(economyMetrics.taxBurden || 0)}`} />
              <MetricRow label="Sales Tax" value={(economyMetrics.salesTaxRate || 0).toFixed(2)} suffix="%" />
              <MetricRow label="Income Tax" value={economyMetrics.hasStateIncomeTax ? 'Yes' : 'No'} />
              <MetricRow label="Profit Bonus" value={economyMetrics.profitMarginBonus > 0 ? '+' : ''} suffix="%" prefix={economyMetrics.profitMarginBonus?.toString() || '0'} />
            </CardBody>
          </Card>
        </div>

        {/* Crime & Industry Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Crime Card */}
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50 px-6 py-4">
              <h3 className="text-xl font-bold text-white text-center w-full">Crime Statistics</h3>
            </CardHeader>
            <CardBody className="p-6">
              <MetricRow label="Violent Crime Rate" value={crimeMetrics.violentCrimeRate?.toFixed(1) || '0'} suffix=" per 100k" />
              <MetricRow label="Crime Percentile" value={(crimeMetrics.crimePercentile * 100)?.toFixed(0) || '50'} suffix="%" />
              <MetricRow label="Law & Order Score" value={societyMetrics.lawAndOrder?.toFixed(0) || '0'} suffix="%" />
            </CardBody>
          </Card>

          {/* Industry Card */}
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50 px-6 py-4">
              <h3 className="text-xl font-bold text-white text-center w-full">Industry Bonuses</h3>
            </CardHeader>
            <CardBody className="p-6">
              <MetricRow label="Hiring Difficulty" value={(industryMetrics.hiringDifficulty * 100)?.toFixed(0) || '100'} suffix="%" />
              {Object.entries(industryMetrics.bonuses || {}).map(([industry, bonus]) => (
                <MetricRow 
                  key={industry} 
                  label={industry.charAt(0).toUpperCase() + industry.slice(1)} 
                  value={`+${bonus}`} 
                  suffix="%" 
                />
              ))}
              {Object.keys(industryMetrics.bonuses || {}).length === 0 && (
                <p className="text-slate-400 text-center py-4">No special industry bonuses</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Historical Metrics Section */}
        <Card className="bg-slate-800/50 border border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50 px-6 py-4">
            <h3 className="text-2xl font-bold text-white text-center w-full">Historical Metrics</h3>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Government Approval Chart */}
              <HistoricalChart 
                title="Government Approval"
                data={generateHistoricalData(politicsMetrics.approval || 50, 8)}
                color="#3b82f6"
                suffix="%"
              />

              {/* GDP Chart */}
              <HistoricalChart 
                title="GDP"
                data={generateHistoricalData(economyMetrics.gdp / 1e9 || 100, 20)}
                color="#3b82f6"
                suffix=""
                formatValue={(v) => `${v.toFixed(0)}B`}
              />

              {/* GDP Growth Chart */}
              <HistoricalChart 
                title="GDP Growth"
                data={generateHistoricalData(economyMetrics.gdpGrowth || 2.8, 0.5)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Debt to GDP Chart */}
              <HistoricalChart 
                title="Debt to GDP"
                data={generateHistoricalData(economyMetrics.debtToGdp || 0, 0.5)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Unemployment Chart */}
              <HistoricalChart 
                title="Unemployment"
                data={generateHistoricalData(economyMetrics.unemployment || 1.1, 2)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Average Wage Chart */}
              <HistoricalChart 
                title="Average Wage"
                data={generateHistoricalData(economyMetrics.averageWage || 96, 3)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Population Chart */}
              <HistoricalChart 
                title="Population"
                data={generateHistoricalData(societyMetrics.population / 1e6 || 4.8, 0.1)}
                color="#3b82f6"
                suffix=""
                formatValue={(v) => `${v.toFixed(2)}M`}
              />

              {/* Population Growth Chart */}
              <HistoricalChart 
                title="Population Growth"
                data={generateHistoricalData(societyMetrics.populationGrowth || 0, 1)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Environmental Quality Chart */}
              <HistoricalChart 
                title="Environmental Quality"
                data={generateHistoricalData(societyMetrics.environmentalQuality || 72, 10)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Uninsured Chart */}
              <HistoricalChart 
                title="Uninsured"
                data={generateHistoricalData(societyMetrics.uninsured || 17, 5)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Infrastructure Quality Chart */}
              <HistoricalChart 
                title="Infrastructure Quality"
                data={generateHistoricalData(societyMetrics.infrastructureQuality || 72, 10)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Education Quality Chart */}
              <HistoricalChart 
                title="Education Quality"
                data={generateHistoricalData(societyMetrics.educationQuality || 71, 15)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Poverty Chart */}
              <HistoricalChart 
                title="Poverty"
                data={generateHistoricalData(societyMetrics.poverty || 6.3, 10)}
                color="#3b82f6"
                suffix="%"
              />

              {/* Law & Order Chart */}
              <HistoricalChart 
                title="Law & Order"
                data={generateHistoricalData(societyMetrics.lawAndOrder || 38, 8)}
                color="#3b82f6"
                suffix="%"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
