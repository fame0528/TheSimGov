"use client";
import { Progress } from "@heroui/react";

export default function RiskMeter({ value }: { value: number }) {
  const color = value >= 90 ? "danger" : value >= 70 ? "danger" : value >= 40 ? "warning" : "success";
  return (
    <div className="w-full">
      <div className="text-xs mb-1">Risk: {value}</div>
      <Progress aria-label="Risk" value={value} color={color as any} />
    </div>
  );
}
