"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";

interface RouteItem {
  id: string;
  origin: { state: string; city: string };
  destination: { state: string; city: string };
  method: string;
  capacity: number;
  riskScore: number;
  status: string;
}

export default function RoutesList() {
  const [items, setItems] = useState<RouteItem[]>([]);
  useEffect(() => {
    fetch(`/api/crime/routes`).then((r) => r.json()).then((res) => setItems(res.data ?? [])).catch(() => setItems([]));
  }, []);
  return (
    <Table aria-label="Routes">
      <TableHeader>
        <TableColumn>Origin</TableColumn>
        <TableColumn>Destination</TableColumn>
        <TableColumn>Method</TableColumn>
        <TableColumn>Capacity</TableColumn>
        <TableColumn>Risk</TableColumn>
        <TableColumn>Status</TableColumn>
      </TableHeader>
      <TableBody emptyContent="No routes">
        {items.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.origin.city}, {r.origin.state}</TableCell>
            <TableCell>{r.destination.city}, {r.destination.state}</TableCell>
            <TableCell>{r.method}</TableCell>
            <TableCell>{r.capacity}</TableCell>
            <TableCell>{r.riskScore}</TableCell>
            <TableCell>{r.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
