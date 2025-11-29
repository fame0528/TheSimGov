/**
 * @fileoverview Organization Chart Component
 * @module lib/components/employee/OrgChart
 * 
 * OVERVIEW:
 * Displays company organizational structure as a hierarchical tree.
 * Shows employee roles, reporting relationships, and team composition.
 * Interactive nodes with click-through to employee details.
 * 
 * @created 2025-11-28
 * @author ECHO v1.3.1
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, Chip, Button, Tooltip } from '@heroui/react';
import { Employee } from '@/lib/types';

/**
 * Org chart node representing a position/employee
 */
export interface OrgChartNode {
  id: string;
  employee?: Employee;
  role: string;
  department?: string;
  isVacant?: boolean;
  children?: OrgChartNode[];
}

export interface OrgChartProps {
  /** Root nodes of the org chart (usually CEO/executives) */
  nodes: OrgChartNode[];
  /** Optional: All employees for auto-grouping */
  employees?: Employee[];
  /** Click handler for employee nodes */
  onEmployeeClick?: (employee: Employee) => void;
  /** Click handler for vacant positions */
  onVacantClick?: (node: OrgChartNode) => void;
  /** Show compact view */
  compact?: boolean;
  /** Allow expanding/collapsing */
  collapsible?: boolean;
}

/**
 * Role hierarchy for automatic org chart generation
 */
const ROLE_HIERARCHY: Record<string, number> = {
  'CEO': 1,
  'Chief Executive Officer': 1,
  'CTO': 2,
  'CFO': 2,
  'COO': 2,
  'CMO': 2,
  'Chief Technology Officer': 2,
  'Chief Financial Officer': 2,
  'Chief Operating Officer': 2,
  'Chief Marketing Officer': 2,
  'VP': 3,
  'Vice President': 3,
  'Director': 4,
  'Senior Manager': 5,
  'Manager': 6,
  'Team Lead': 7,
  'Senior': 8,
  'Engineer': 9,
  'Analyst': 9,
  'Developer': 9,
  'Designer': 9,
  'Specialist': 9,
  'Associate': 10,
  'Junior': 10,
  'Intern': 11,
};

/**
 * Get role level for sorting
 */
function getRoleLevel(role: string): number {
  for (const [key, level] of Object.entries(ROLE_HIERARCHY)) {
    if (role.toLowerCase().includes(key.toLowerCase())) {
      return level;
    }
  }
  return 8; // Default to mid-level
}

/**
 * Generate org chart from flat employee list
 */
function generateOrgChart(employees: Employee[]): OrgChartNode[] {
  if (!employees.length) return [];

  // Sort by role hierarchy
  const sorted = [...employees].sort((a, b) => getRoleLevel(a.role) - getRoleLevel(b.role));
  
  // Group by role level
  const levels: Map<number, Employee[]> = new Map();
  for (const emp of sorted) {
    const level = getRoleLevel(emp.role);
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(emp);
  }

  // Build tree structure
  const levelKeys = Array.from(levels.keys()).sort((a, b) => a - b);
  
  if (levelKeys.length === 0) return [];

  // Top level nodes
  const topLevel = levels.get(levelKeys[0]) || [];
  const rootNodes: OrgChartNode[] = topLevel.map(emp => ({
    id: emp.id,
    employee: emp,
    role: emp.role,
    children: [],
  }));

  // Distribute remaining employees as children
  let currentParents = rootNodes;
  for (let i = 1; i < levelKeys.length; i++) {
    const currentLevel = levels.get(levelKeys[i]) || [];
    const childNodes: OrgChartNode[] = currentLevel.map(emp => ({
      id: emp.id,
      employee: emp,
      role: emp.role,
      children: [],
    }));

    // Distribute children evenly among parents
    for (let j = 0; j < childNodes.length; j++) {
      const parentIndex = j % currentParents.length;
      if (!currentParents[parentIndex].children) {
        currentParents[parentIndex].children = [];
      }
      currentParents[parentIndex].children!.push(childNodes[j]);
    }

    // Next level's children become current parents
    currentParents = childNodes;
  }

  return rootNodes;
}

/**
 * Single org chart node component
 */
function OrgChartNodeCard({
  node,
  onEmployeeClick,
  onVacantClick,
  compact,
  level = 0,
  expanded,
  onToggle,
}: {
  node: OrgChartNode;
  onEmployeeClick?: (employee: Employee) => void;
  onVacantClick?: (node: OrgChartNode) => void;
  compact?: boolean;
  level?: number;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const hasChildren = node.children && node.children.length > 0;

  const getStatusColor = (status?: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'training': return 'warning';
      case 'onLeave': return 'warning';
      case 'terminated': return 'danger';
      default: return 'default';
    }
  };

  const getMoraleColor = (morale?: number): string => {
    if (!morale) return 'text-gray-400';
    if (morale >= 85) return 'text-green-600';
    if (morale >= 70) return 'text-blue-600';
    if (morale >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={`
          relative bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 
          ${node.isVacant 
            ? 'border-dashed border-gray-300 dark:border-gray-600' 
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 cursor-pointer'
          }
          ${compact ? 'p-2 min-w-[120px]' : 'p-4 min-w-[180px]'}
          transition-all
        `}
        onClick={() => {
          if (node.isVacant && onVacantClick) {
            onVacantClick(node);
          } else if (node.employee && onEmployeeClick) {
            onEmployeeClick(node.employee);
          }
        }}
      >
        {/* Toggle button for collapsible */}
        {hasChildren && onToggle && (
          <button
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-600 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {expanded ? '−' : '+'}
          </button>
        )}

        {node.isVacant ? (
          /* Vacant Position */
          <div className="text-center">
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-500 dark:text-gray-400`}>
              {node.role}
            </div>
            <Chip size="sm" color="default" variant="flat" className="mt-1">
              VACANT
            </Chip>
          </div>
        ) : node.employee ? (
          /* Employee Node */
          <div className="text-center">
            <div className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-gray-100 truncate`}>
              {node.employee.name}
            </div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 truncate`}>
              {node.employee.role}
            </div>
            
            {!compact && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center justify-center gap-2">
                  <Chip size="sm" color={getStatusColor(node.employee.status)}>
                    {node.employee.status.toUpperCase()}
                  </Chip>
                </div>
                <Tooltip content={`Morale: ${node.employee.morale}/100`}>
                  <div className={`text-xs ${getMoraleColor(node.employee.morale)}`}>
                    ⚡ {node.employee.morale}%
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
        ) : (
          /* Role placeholder */
          <div className="text-center">
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-600 dark:text-gray-400`}>
              {node.role}
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-8 relative">
          {/* Vertical connector line */}
          <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-gray-300 dark:bg-gray-600 -translate-x-1/2 -translate-y-full" />
          
          {/* Horizontal connector line */}
          {node.children!.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600 -translate-y-4" 
                 style={{ 
                   width: `calc(100% - ${compact ? '60px' : '90px'})`,
                   left: compact ? '30px' : '45px'
                 }} 
            />
          )}
          
          <div className="flex gap-4 justify-center">
            {node.children!.map((child) => (
              <div key={child.id} className="relative">
                {/* Vertical line to child */}
                <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-gray-300 dark:bg-gray-600 -translate-x-1/2 -translate-y-4" />
                <OrgChartNodeCard
                  node={child}
                  onEmployeeClick={onEmployeeClick}
                  onVacantClick={onVacantClick}
                  compact={compact}
                  level={level + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Organization Chart Component
 * 
 * FEATURES:
 * - Hierarchical tree visualization
 * - Auto-generate from employee list
 * - Custom node structure support
 * - Compact and full view modes
 * - Collapsible branches
 * - Click-through to employee details
 * - Vacant position indicators
 * - Morale and status badges
 * 
 * USAGE:
 * ```tsx
 * // Auto-generate from employees
 * <OrgChart 
 *   employees={companyEmployees}
 *   onEmployeeClick={(emp) => router.push(`/employees/${emp.id}`)}
 * />
 * 
 * // Custom structure
 * <OrgChart
 *   nodes={customOrgStructure}
 *   onEmployeeClick={handleClick}
 * />
 * ```
 */
export function OrgChart({
  nodes,
  employees,
  onEmployeeClick,
  onVacantClick,
  compact = false,
  collapsible = true,
}: OrgChartProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);

  // Generate org chart from employees if no nodes provided
  const chartNodes = useMemo(() => {
    if (nodes && nodes.length > 0) return nodes;
    if (employees && employees.length > 0) return generateOrgChart(employees);
    return [];
  }, [nodes, employees]);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Toggle all
  const toggleAll = () => {
    setAllExpanded(!allExpanded);
  };

  if (chartNodes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No employees to display in organization chart.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Hire employees to see your company structure.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      {collapsible && (
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="bordered"
            onPress={toggleAll}
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      )}

      {/* Chart */}
      <div className="overflow-x-auto pb-4">
        <div className="flex justify-center gap-8 min-w-max p-4">
          {chartNodes.map((node) => (
            <OrgChartNodeCard
              key={node.id}
              node={node}
              onEmployeeClick={onEmployeeClick}
              onVacantClick={onVacantClick}
              compact={compact}
              expanded={allExpanded || expandedNodes.has(node.id)}
              onToggle={collapsible ? () => toggleNode(node.id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Training/Leave</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-dashed border-gray-400" />
          <span>Vacant</span>
        </div>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Auto-Generation**: Can build org chart from flat employee list
 * 2. **Role Hierarchy**: Automatic sorting by role seniority
 * 3. **Interactive**: Click nodes to view employee details
 * 4. **Responsive**: Horizontal scroll for large orgs
 * 5. **Collapsible**: Expand/collapse branches
 * 6. **HeroUI Components**: Card, Chip, Button, Tooltip
 * 7. **Dark Mode**: Full dark mode support
 * 
 * USAGE PATTERNS:
 * - Company overview page: Full org chart
 * - Department view: Filtered by department
 * - Hiring: Show vacant positions
 * 
 * @updated 2025-11-28
 */
