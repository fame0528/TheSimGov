/**
 * @fileoverview Empire Web Visualization Component
 * @module components/empire/EmpireWeb
 * 
 * OVERVIEW:
 * Interactive visualization of player's owned companies as a network graph.
 * Shows synergy connections between industries with animated lines.
 * The visual centerpiece of the Empire system.
 * 
 * THE HOOK:
 * Seeing your empire as a connected web triggers ownership pride
 * and "just one more connection" acquisition behavior.
 * 
 * @created 2025-12-05
 * @author ECHO v1.4.0
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import {
  Building2,
  Cpu,
  Megaphone,
  Home,
  Zap,
  Factory,
  Stethoscope,
  Truck,
  Vote,
  ShoppingBag,
  Briefcase,
  Skull,
  Network,
  Plus,
  Info,
  TrendingUp,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { EmpireIndustry } from '@/lib/types/empire';

// ============================================================================
// Types
// ============================================================================

interface EmpireCompany {
  id: string;
  name: string;
  industry: EmpireIndustry;
  level: number;
  revenue: number;
  value: number;
  synergyContributions: string[];
}

interface SynergyConnection {
  from: EmpireIndustry;
  to: EmpireIndustry;
  synergyName: string;
  bonus: number;
}

// ============================================================================
// Industry Configuration
// ============================================================================

const INDUSTRY_CONFIG: Record<EmpireIndustry, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
  position: { x: number; y: number };
}> = {
  [EmpireIndustry.BANKING]: {
    icon: <Building2 className="w-6 h-6" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Banking',
    position: { x: 50, y: 20 },
  },
  [EmpireIndustry.TECH]: {
    icon: <Cpu className="w-6 h-6" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    label: 'Technology',
    position: { x: 80, y: 35 },
  },
  [EmpireIndustry.MEDIA]: {
    icon: <Megaphone className="w-6 h-6" />,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    label: 'Media',
    position: { x: 85, y: 65 },
  },
  [EmpireIndustry.REAL_ESTATE]: {
    icon: <Home className="w-6 h-6" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    label: 'Real Estate',
    position: { x: 20, y: 35 },
  },
  [EmpireIndustry.ENERGY]: {
    icon: <Zap className="w-6 h-6" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Energy',
    position: { x: 15, y: 65 },
  },
  [EmpireIndustry.MANUFACTURING]: {
    icon: <Factory className="w-6 h-6" />,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    label: 'Manufacturing',
    position: { x: 35, y: 80 },
  },
  [EmpireIndustry.HEALTHCARE]: {
    icon: <Stethoscope className="w-6 h-6" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    label: 'Healthcare',
    position: { x: 65, y: 80 },
  },
  [EmpireIndustry.LOGISTICS]: {
    icon: <Truck className="w-6 h-6" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    label: 'Logistics',
    position: { x: 50, y: 50 },
  },
  [EmpireIndustry.POLITICS]: {
    icon: <Vote className="w-6 h-6" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    label: 'Politics',
    position: { x: 70, y: 20 },
  },
  [EmpireIndustry.RETAIL]: {
    icon: <ShoppingBag className="w-6 h-6" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    label: 'Retail',
    position: { x: 30, y: 20 },
  },
  [EmpireIndustry.CONSULTING]: {
    icon: <Briefcase className="w-6 h-6" />,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    label: 'Consulting',
    position: { x: 50, y: 90 },
  },
  [EmpireIndustry.CRIME]: {
    icon: <Skull className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-900/30',
    label: 'Crime',
    position: { x: 10, y: 90 },
  },
};

// Mock data for development
const MOCK_COMPANIES: EmpireCompany[] = [
  {
    id: '1',
    name: 'First National Bank',
    industry: EmpireIndustry.BANKING,
    level: 3,
    revenue: 250000,
    value: 2500000,
    synergyContributions: ['Fintech Empire', 'Property Mogul'],
  },
  {
    id: '2',
    name: 'TechCorp AI',
    industry: EmpireIndustry.TECH,
    level: 4,
    revenue: 450000,
    value: 5500000,
    synergyContributions: ['Fintech Empire', 'Data Goldmine'],
  },
  {
    id: '3',
    name: 'Metro Properties',
    industry: EmpireIndustry.REAL_ESTATE,
    level: 2,
    revenue: 180000,
    value: 3200000,
    synergyContributions: ['Property Mogul'],
  },
  {
    id: '4',
    name: 'Solar Grid Inc',
    industry: EmpireIndustry.ENERGY,
    level: 2,
    revenue: 120000,
    value: 1800000,
    synergyContributions: ['Green Finance'],
  },
];

const MOCK_CONNECTIONS: SynergyConnection[] = [
  { from: EmpireIndustry.BANKING, to: EmpireIndustry.TECH, synergyName: 'Fintech Empire', bonus: 25 },
  { from: EmpireIndustry.BANKING, to: EmpireIndustry.REAL_ESTATE, synergyName: 'Property Mogul', bonus: 20 },
  { from: EmpireIndustry.BANKING, to: EmpireIndustry.ENERGY, synergyName: 'Green Finance', bonus: 15 },
];

// ============================================================================
// Industry Node Component
// ============================================================================

interface IndustryNodeProps {
  industry: EmpireIndustry;
  companies: EmpireCompany[];
  isOwned: boolean;
  isConnected: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}

function IndustryNode({ industry, companies, isOwned, isConnected, onClick, style }: IndustryNodeProps) {
  const config = INDUSTRY_CONFIG[industry];
  const companyCount = companies.filter(c => c.industry === industry).length;

  return (
    <Tooltip
      content={
        <div className="p-2">
          <p className="font-bold">{config.label}</p>
          {isOwned ? (
            <p className="text-sm text-gray-400">{companyCount} company(s) owned</p>
          ) : (
            <p className="text-sm text-gray-400">Not owned - Click to acquire</p>
          )}
        </div>
      }
    >
      <div
        onClick={onClick}
        style={style}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 z-10 ${
          isOwned ? 'opacity-100' : 'opacity-40 hover:opacity-70'
        }`}
      >
        <div
          className={`p-4 rounded-2xl border-2 ${
            isOwned
              ? `${config.bgColor} border-${config.color.split('-')[1]}-500/50 shadow-lg shadow-${config.color.split('-')[1]}-500/20`
              : 'bg-slate-800/50 border-slate-700 border-dashed'
          }`}
        >
          <div className={isOwned ? config.color : 'text-slate-500'}>
            {config.icon}
          </div>
        </div>
        <p className={`text-xs text-center mt-2 font-medium ${isOwned ? 'text-white' : 'text-slate-500'}`}>
          {config.label}
        </p>
        {isOwned && companyCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {companyCount}
          </div>
        )}
      </div>
    </Tooltip>
  );
}

// ============================================================================
// SVG Connection Line Component
// ============================================================================

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  animated?: boolean;
}

function ConnectionLine({ from, to, color, animated = true }: ConnectionLineProps) {
  return (
    <line
      x1={`${from.x}%`}
      y1={`${from.y}%`}
      x2={`${to.x}%`}
      y2={`${to.y}%`}
      stroke={color}
      strokeWidth="2"
      strokeDasharray={animated ? '5,5' : undefined}
      className={animated ? 'animate-dash' : ''}
      style={{
        filter: 'drop-shadow(0 0 4px currentColor)',
      }}
    />
  );
}

// ============================================================================
// Company Detail Modal Component
// ============================================================================

interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: EmpireCompany | null;
}

function CompanyDetailModal({ isOpen, onClose, company }: CompanyDetailModalProps) {
  if (!company) return null;

  const config = INDUSTRY_CONFIG[company.industry];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent className="bg-slate-800 border border-slate-700">
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.bgColor}`}>
              <span className={config.color}>{config.icon}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{company.name}</h3>
              <Chip size="sm" variant="flat" className={`${config.bgColor} ${config.color}`}>
                {config.label} • Level {company.level}
              </Chip>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <DollarSign className="w-4 h-4" />
                Monthly Revenue
              </div>
              <p className="text-2xl font-bold text-green-400">
                ${company.revenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                Company Value
              </div>
              <p className="text-2xl font-bold text-blue-400">
                ${company.value.toLocaleString()}
              </p>
            </div>
          </div>

          {company.synergyContributions.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
                <Sparkles className="w-4 h-4" />
                Contributing to Synergies
              </div>
              <div className="flex flex-wrap gap-2">
                {company.synergyContributions.map((synergy) => (
                  <Chip key={synergy} size="sm" variant="flat" color="secondary">
                    {synergy}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>Close</Button>
          <Button color="primary" startContent={<Building2 className="w-4 h-4" />}>
            Manage Company
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EmpireWeb(): React.ReactElement {
  // State
  const [companies] = useState<EmpireCompany[]>(MOCK_COMPANIES);
  const [connections] = useState<SynergyConnection[]>(MOCK_CONNECTIONS);
  const [selectedCompany, setSelectedCompany] = useState<EmpireCompany | null>(null);
  
  // Modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get owned industries
  const ownedIndustries = useMemo(() => {
    return new Set(companies.map(c => c.industry));
  }, [companies]);

  // Get connected industries (have synergy connections)
  const connectedIndustries = useMemo(() => {
    const connected = new Set<EmpireIndustry>();
    connections.forEach(conn => {
      connected.add(conn.from);
      connected.add(conn.to);
    });
    return connected;
  }, [connections]);

  // Handle node click
  const handleNodeClick = (industry: EmpireIndustry) => {
    const company = companies.find(c => c.industry === industry);
    if (company) {
      setSelectedCompany(company);
      onOpen();
    } else {
      // Navigate to acquisitions for this industry
      console.log('Navigate to acquire', industry);
    }
  };

  return (
    <Card className="bg-slate-800/50 border border-slate-700 h-[600px]">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Empire Network</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Chip size="sm" variant="flat" color="success">
              {ownedIndustries.size} Industries
            </Chip>
            <Chip size="sm" variant="flat" color="secondary">
              {connections.length} Synergies
            </Chip>
          </div>
        </div>
      </CardHeader>
      <CardBody className="relative p-0 overflow-hidden">
        {/* SVG Layer for Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <style>
              {`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -10;
                  }
                }
                .animate-dash {
                  animation: dash 0.5s linear infinite;
                }
              `}
            </style>
          </defs>
          {connections.map((conn, idx) => {
            const fromPos = INDUSTRY_CONFIG[conn.from].position;
            const toPos = INDUSTRY_CONFIG[conn.to].position;
            return (
              <ConnectionLine
                key={idx}
                from={fromPos}
                to={toPos}
                color="#8B5CF6"
                animated
              />
            );
          })}
        </svg>

        {/* Industry Nodes */}
        {Object.values(EmpireIndustry).map((industry) => {
          const config = INDUSTRY_CONFIG[industry];
          return (
            <IndustryNode
              key={industry}
              industry={industry}
              companies={companies}
              isOwned={ownedIndustries.has(industry)}
              isConnected={connectedIndustries.has(industry)}
              onClick={() => handleNodeClick(industry)}
              style={{
                left: `${config.position.x}%`,
                top: `${config.position.y}%`,
              }}
            />
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
          <p className="text-xs text-gray-400 mb-2">Legend</p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-gray-300">Synergy Link</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border border-slate-500 border-dashed" />
              <span className="text-gray-300">Available</span>
            </div>
          </div>
        </div>
      </CardBody>

      {/* Company Detail Modal */}
      <CompanyDetailModal
        isOpen={isOpen}
        onClose={onClose}
        company={selectedCompany}
      />
    </Card>
  );
}

export default EmpireWeb;
