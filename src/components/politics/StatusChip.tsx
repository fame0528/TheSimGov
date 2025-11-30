"use client";
import React from "react";

type Props = {
  label: string;
  color?: "default" | "success" | "warning" | "danger" | "primary";
};

export function StatusChip({ label, color = "default" }: Props) {
  const palette: Record<string, string> = {
    default: "bg-gray-200 text-gray-800",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    primary: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${palette[color]}`}>
      {label}
    </span>
  );
}
