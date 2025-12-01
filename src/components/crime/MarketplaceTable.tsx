"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Button } from "@heroui/react";

interface Listing {
  id: string;
  substance: string;
  quantity: number;
  purity: number;
  pricePerUnit: number;
  state: string;
}

export default function MarketplaceTable() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [substance, setSubstance] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (substance) params.set("substance", substance);
    if (state) params.set("state", state);
    fetch(`/api/crime/marketplace?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => setListings(res.data ?? []))
      .catch(() => setListings([]));
  }, [substance, state]);

  return (
    <div className="grid gap-3">
      <div className="flex gap-3">
        <Input label="Substance" value={substance} onValueChange={setSubstance} size="sm" />
        <Input label="State" value={state} onValueChange={setState} size="sm" />
        <Button size="sm" onPress={() => { setSubstance(""); setState(""); }}>Clear</Button>
      </div>
      <Table aria-label="Marketplace Listings">
        <TableHeader>
          <TableColumn>Substance</TableColumn>
          <TableColumn>Quantity</TableColumn>
          <TableColumn>Purity</TableColumn>
          <TableColumn>Price/Unit</TableColumn>
          <TableColumn>State</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No listings">
          {listings.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.substance}</TableCell>
              <TableCell>{l.quantity}</TableCell>
              <TableCell>{l.purity}%</TableCell>
              <TableCell>${l.pricePerUnit.toLocaleString()}</TableCell>
              <TableCell>{l.state}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
