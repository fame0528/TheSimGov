"use client";

import React from "react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";

export type FiltersState = {
  officeType?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export interface FiltersProps {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  officeTypes?: string[];
  statuses?: string[];
  className?: string;
}

export function Filters({ value, onChange, officeTypes = [], statuses = [], className }: FiltersProps) {
  const set = (patch: Partial<FiltersState>) => onChange({ ...value, ...patch });

  return (
    <div className={"grid grid-cols-1 gap-3 md:grid-cols-5 " + (className ?? "")}> 
      <Input
        label="Search"
        placeholder="Search elections..."
        value={value.search ?? ""}
        onChange={(e) => set({ search: e.target.value })}
      />

      <Select
        label="Office Type"
        selectedKeys={value.officeType ? [value.officeType] : []}
        onSelectionChange={(keys) => {
          const key = Array.from(keys as Set<string>)[0];
          set({ officeType: key });
        }}
      >
        {officeTypes.map((t) => (
          <SelectItem key={t}>{t}</SelectItem>
        ))}
      </Select>

      <Select
        label="Status"
        selectedKeys={value.status ? [value.status] : []}
        onSelectionChange={(keys) => {
          const key = Array.from(keys as Set<string>)[0];
          set({ status: key });
        }}
      >
        {statuses.map((s) => (
          <SelectItem key={s}>{s}</SelectItem>
        ))}
      </Select>

      <Input
        type="date"
        label="From"
        value={value.dateFrom ?? ""}
        onChange={(e) => set({ dateFrom: e.target.value })}
      />

      <Input
        type="date"
        label="To"
        value={value.dateTo ?? ""}
        onChange={(e) => set({ dateTo: e.target.value })}
      />

      <div className="md:col-span-5 flex items-center justify-end gap-2">
        <Button variant="flat" onPress={() => set({ search: "", officeType: undefined, status: undefined, dateFrom: undefined, dateTo: undefined })}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export default Filters;
