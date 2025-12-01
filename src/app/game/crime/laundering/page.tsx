"use client";
import DisclaimerGate from "@/components/crime/DisclaimerGate";
import { useLaundering } from "@/lib/hooks/useCrime";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input } from "@heroui/react";
import { useState } from "react";

export default function CrimeLaunderingPage() {
  const [method, setMethod] = useState("");
  const { data } = useLaundering(method ? { method } : undefined);
  return (
    <DisclaimerGate>
      <div className="grid gap-3">
        <Input label="Method" value={method} onValueChange={setMethod} size="sm" />
        <Table aria-label="Laundering Channels">
          <TableHeader>
            <TableColumn>Method</TableColumn>
            <TableColumn>Throughput</TableColumn>
            <TableColumn>Fee %</TableColumn>
            <TableColumn>Latency (days)</TableColumn>
            <TableColumn>Detection Risk</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No channels">
            {(data ?? []).map((c: any) => (
              <TableRow key={c.id}>
                <TableCell>{c.method}</TableCell>
                <TableCell>{c.throughputCap}</TableCell>
                <TableCell>{c.feePercent}</TableCell>
                <TableCell>{c.latencyDays}</TableCell>
                <TableCell>{c.detectionRisk}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DisclaimerGate>
  );
}
