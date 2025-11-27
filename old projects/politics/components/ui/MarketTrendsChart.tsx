"use client";

import { Box } from "@chakra-ui/react";
import SectionCard from '@/components/ui/SectionCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const sampleData = [
  { date: "Jan", value: 100 },
  { date: "Feb", value: 120 },
  { date: "Mar", value: 115 },
  { date: "Apr", value: 150 },
  { date: "May", value: 140 },
  { date: "Jun", value: 180 },
];

export default function MarketTrendsChart({ data = sampleData }: { data?: { date: string; value: number }[] }) {
  return (
    <SectionCard id="market-trends-card" title="Market Trends" iconClass="fa-solid fa-chart-line">
      <Box h="240px" w="100%" minW="0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00AEF3" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#00AEF3" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#8B8F98" tickLine={false} axisLine={{ stroke: "#2A2A2A" }} />
            <YAxis stroke="#8B8F98" tickLine={false} axisLine={{ stroke: "#2A2A2A" }} />
            <Tooltip contentStyle={{ background: "#141414", border: "1px solid #30333A", borderRadius: 12 }} labelStyle={{ color: "#C6CBD2" }} itemStyle={{ color: "#FFFFFF" }} />
            <Line type="monotone" dataKey="value" stroke="#00AEF3" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </SectionCard>
  );
}
