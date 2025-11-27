"use client";
/**
 * @file components/contracts/AnalyticsChart.tsx
 * @created 2025-11-13
 * @overview Lightweight SVG chart component (bar/line) without external deps – used on analytics page.
 */



export type ChartVariant = 'bar' | 'line';

interface DataPoint { label: string; value: number; }
interface AnalyticsChartProps {
  title: string;
  data: DataPoint[];
  variant?: ChartVariant;
  height?: number;
  max?: number; // optional max override
}

export default function AnalyticsChart({ title, data, variant = 'bar', height = 140, max }: AnalyticsChartProps) {
  const computedMax = max ?? Math.max(...data.map(d => d.value), 1);
  const width = Math.max(320, data.length * 55);

  return (
    <figure className="rounded-lg border bg-white p-3 shadow-sm" aria-label={`Chart: ${title}`}>      
      <figcaption className="font-medium text-sm mb-2">{title}</figcaption>
      <div className="overflow-x-auto">
        <svg width={width} height={height} role="img" aria-label={title}>
          {/* Background grid lines */}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = (i / 4) * height;
            return <line key={i} x1={0} y1={y} x2={width} y2={y} stroke="#eee" strokeWidth={1} />;
          })}
          {variant === 'bar' && data.map((d, i) => {
            const barWidth = 40;
            const gap = 15;
            const x = i * (barWidth + gap) + gap;
            const barHeight = (d.value / computedMax) * (height - 20);
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={height - barHeight - 16}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill="#2563eb"
                  aria-label={`${d.label} ${d.value}`}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#374151"
                >{d.label}</text>
              </g>
            );
          })}
          {variant === 'line' && (() => {
            const points = data.map((d, i) => {
              const x = i * (width / (data.length - 1));
              const y = height - 20 - (d.value / computedMax) * (height - 30);
              return `${x},${y}`;
            }).join(' ');
            return (
              <g>
                <polyline
                  points={points}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {data.map((d, i) => {
                  const x = i * (width / (data.length - 1));
                  const y = height - 20 - (d.value / computedMax) * (height - 30);
                  return (
                    <g key={d.label}>
                      <circle cx={x} cy={y} r={4} fill="#10b981" />
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#065f46"
                      >{d.value}</text>
                      <text
                        x={x}
                        y={height - 4}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#374151"
                      >{d.label}</text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      </div>
    </figure>
  );
}

/**
 * Implementation Notes:
 * - Pure SVG approach avoids dependency bloat (no chart library required).
 * - Responsive horizontally via overflow container; vertical sizing fixed by height prop.
 * - Basic grid lines improve readability; accessible labeling via figure/figcaption.
 * - Extendable: add tooltip layer, animations, different color palettes.
 */
