"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";

interface Facility {
  id: string;
  type: string;
  state: string;
  city: string;
  capacity: number;
  quality: number;
  status: string;
}

export default function FacilitiesList() {
  const [items, setItems] = useState<Facility[]>([]);
  useEffect(() => {
    fetch(`/api/crime/facilities`).then((r) => r.json()).then((res) => setItems(res.data ?? [])).catch(() => setItems([]));
  }, []);
  return (
    <Table aria-label="Facilities">
      <TableHeader>
        <TableColumn>Type</TableColumn>
        <TableColumn>Location</TableColumn>
        <TableColumn>Capacity</TableColumn>
        <TableColumn>Quality</TableColumn>
        <TableColumn>Status</TableColumn>
      </TableHeader>
      <TableBody emptyContent="No facilities">
        {items.map((f) => (
          <TableRow key={f.id}>
            <TableCell>{f.type}</TableCell>
            <TableCell>{f.city}, {f.state}</TableCell>
            <TableCell>{f.capacity}</TableCell>
            <TableCell>{f.quality}%</TableCell>
            <TableCell>{f.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
