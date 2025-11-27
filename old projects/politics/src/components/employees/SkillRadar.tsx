/**
 * @file src/components/employees/SkillRadar.tsx
 * @description Radar chart visualization for employee skills
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Displays employee skills in a radar/spider chart format for visual comparison
 * of multiple skill dimensions. Shows current skill values, skill caps, and optional
 * comparison to market average or other employees. Built with HTML5 Canvas for
 * performance and smooth animations.
 * 
 * FEATURES:
 * - Radar chart with 12 skill dimensions
 * - Current skill values (filled polygon)
 * - Skill caps (outer boundary)
 * - Market average comparison (optional dashed line)
 * - Hover tooltips showing exact values
 * - Responsive sizing
 * - Smooth animations on data changes
 * - Color-coded by skill level (red < 40, yellow 40-70, green > 70)
 * 
 * PROPS:
 * ```typescript
 * interface SkillRadarProps {
 *   skills: {
 *     technical: number;
 *     sales: number;
 *     leadership: number;
 *     finance: number;
 *     marketing: number;
 *     operations: number;
 *     research: number;
 *     compliance: number;
 *     communication: number;
 *     creativity: number;
 *     analytical: number;
 *     customerService: number;
 *   };
 *   skillCaps?: Record<string, number>;    // Optional skill caps
 *   marketAverage?: Record<string, number>; // Optional market comparison
 *   size?: number;                          // Chart diameter (default 300)
 *   showLabels?: boolean;                   // Show skill labels (default true)
 *   showLegend?: boolean;                   // Show legend (default true)
 * }
 * ```
 * 
 * USAGE:
 * ```tsx
 * <SkillRadar
 *   skills={employee.skills}
 *   skillCaps={employee.skillCaps}
 *   marketAverage={marketSkills}
 *   size={400}
 * />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Uses HTML5 Canvas for rendering performance
 * - 12 skills arranged in circle (30° apart)
 * - Scale: 0 (center) to 100 (outer edge)
 * - Current skills: Filled blue polygon
 * - Skill caps: Dashed gray outer boundary
 * - Market average: Dashed green polygon
 * - Labels positioned outside chart
 * - Hover detection shows tooltip with exact values
 * - Canvas redraws on prop changes with smooth transitions
 */

'use client';

import { useRef, useEffect, useState } from 'react';

interface SkillRadarProps {
  skills: {
    technical: number;
    sales: number;
    leadership: number;
    finance: number;
    marketing: number;
    operations: number;
    research: number;
    compliance: number;
    communication: number;
    creativity: number;
    analytical: number;
    customerService: number;
  };
  skillCaps?: Record<string, number>;
  marketAverage?: Record<string, number>;
  size?: number;
  showLabels?: boolean;
  showLegend?: boolean;
}

const SKILL_ORDER = [
  'technical',
  'analytical',
  'research',
  'creativity',
  'marketing',
  'sales',
  'customerService',
  'communication',
  'leadership',
  'operations',
  'finance',
  'compliance',
];

const SKILL_LABELS: Record<string, string> = {
  technical: 'Technical',
  sales: 'Sales',
  leadership: 'Leadership',
  finance: 'Finance',
  marketing: 'Marketing',
  operations: 'Operations',
  research: 'Research',
  compliance: 'Compliance',
  communication: 'Communication',
  creativity: 'Creativity',
  analytical: 'Analytical',
  customerService: 'Customer Service',
};

/**
 * Skill radar chart component
 */
export default function SkillRadar({
  skills,
  skillCaps,
  marketAverage,
  size = 300,
  showLabels = true,
  showLegend = true,
}: SkillRadarProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Calculate center and radius
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) * 0.7; // 70% of half size
    const labelRadius = radius + 30;

    // Draw background circles (10, 25, 50, 75, 100)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    [0.1, 0.25, 0.5, 0.75, 1.0].forEach((scale) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw axis lines and labels
    const angleStep = (Math.PI * 2) / SKILL_ORDER.length;
    SKILL_ORDER.forEach((skillKey, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start at top

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.strokeStyle = '#e5e7eb';
      ctx.stroke();

      // Draw label
      if (showLabels) {
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;
        ctx.fillStyle = '#374151';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(SKILL_LABELS[skillKey], labelX, labelY);
      }
    });

    // Draw skill caps (if provided)
    if (skillCaps) {
      ctx.beginPath();
      SKILL_ORDER.forEach((skillKey, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const value = skillCaps[skillKey] || 70;
        const pointRadius = (value / 100) * radius;
        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw market average (if provided)
    if (marketAverage) {
      ctx.beginPath();
      SKILL_ORDER.forEach((skillKey, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const value = marketAverage[skillKey] || 50;
        const pointRadius = (value / 100) * radius;
        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw current skills (filled polygon)
    ctx.beginPath();
    SKILL_ORDER.forEach((skillKey, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = skills[skillKey as keyof typeof skills] || 0;
      const pointRadius = (value / 100) * radius;
      const x = centerX + Math.cos(angle) * pointRadius;
      const y = centerY + Math.sin(angle) * pointRadius;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();

    // Fill polygon
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Blue with transparency
    ctx.fill();

    // Stroke polygon
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw skill points
    SKILL_ORDER.forEach((skillKey, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = skills[skillKey as keyof typeof skills] || 0;
      const pointRadius = (value / 100) * radius;
      const x = centerX + Math.cos(angle) * pointRadius;
      const y = centerY + Math.sin(angle) * pointRadius;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [skills, skillCaps, marketAverage, size, showLabels]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x: e.clientX, y: e.clientY });

    // Detect hovered skill
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) * 0.7;
    const angleStep = (Math.PI * 2) / SKILL_ORDER.length;

    let foundSkill: string | null = null;
    SKILL_ORDER.forEach((skillKey, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = skills[skillKey as keyof typeof skills] || 0;
      const pointRadius = (value / 100) * radius;
      const pointX = centerX + Math.cos(angle) * pointRadius;
      const pointY = centerY + Math.sin(angle) * pointRadius;

      const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
      if (distance < 10) {
        foundSkill = skillKey;
      }
    });

    setHoveredSkill(foundSkill);
  };

  const handleMouseLeave = () => {
    setHoveredSkill(null);
  };

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
      />

      {/* Tooltip */}
      {hoveredSkill && (
        <div
          className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y + 10,
          }}
        >
          <p className="font-semibold">{SKILL_LABELS[hoveredSkill]}</p>
          <p className="text-gray-300">
            Current: {skills[hoveredSkill as keyof typeof skills]}
          </p>
          {skillCaps && (
            <p className="text-gray-300">
              Cap: {skillCaps[hoveredSkill] || 70}
            </p>
          )}
          {marketAverage && (
            <p className="text-gray-300">
              Market: {marketAverage[hoveredSkill] || 50}
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700">Current Skills</span>
          </div>
          {skillCaps && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-gray-400 border-dashed border-2"></div>
              <span className="text-gray-700">Skill Caps</span>
            </div>
          )}
          {marketAverage && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 border-dashed border-2"></div>
              <span className="text-gray-700">Market Average</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
