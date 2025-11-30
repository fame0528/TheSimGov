"use client";

import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { DataTable, Column } from "@/components/shared/DataTable";
import Filters, { FiltersState } from "@/components/shared/Filters";
import { StatusChip } from "@/components/politics/StatusChip";
import { useToast } from "@/lib/hooks/ui/useToast";
import usePagination from "@/lib/hooks/ui/usePagination";
import useSort from "@/lib/hooks/ui/useSort";
// import { usePolitics } from "@/lib/hooks/usePolitics";

// Minimal Election type; will align to full politics types later
interface Election {
  _id: string;
  officeType: string;
  district?: string | null;
  electionDate: string; // ISO
  electionType: "Primary" | "General" | "Runoff" | "Special" | string;
  status: "Upcoming" | "InProgress" | "Completed" | string;
  turnout?: number;
}

export default function ElectionsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState<FiltersState>({});

  // Data fetching via hooks (assumes endpoints wired)
  // Temporary placeholder until hooks are fully wired
  const elections: Election[] = [];
  const isLoading = false;
  const error: any = null;
  const refresh = () => {};

  const columns: Column<Election>[] = useMemo(
    () => [
      { key: "officeType", label: "Office", sortable: true },
      {
        key: "district",
        label: "District",
        render: (e) => e.district ?? "—",
      },
      {
        key: "electionDate",
        label: "Date",
        sortable: true,
        render: (e) => new Date(e.electionDate).toLocaleDateString(),
      },
      { key: "electionType", label: "Type", sortable: true },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (e) => (
          <StatusChip label={e.status} color={statusColor(e.status)} />
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (e) => (
          <div className="flex gap-2">
            <Button size="sm" variant="flat" onPress={() => onView(e._id)}>View</Button>
          </div>
        ),
      },
    ],
    []
  );

  const onView = (id: string) => {
    // Navigate to detail page
    window.location.href = `/politics/elections/${id}`;
  };

  // Optional client-side sort/paginate handled inside DataTable via hooks

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Election Dashboard</h1>
            <p className="text-default-500">Browse active and upcoming elections</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="flat" onPress={() => refresh()}>Refresh</Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-4">
          <Filters
            value={filters}
            onChange={setFilters}
            officeTypes={["Governor", "StateSenate", "StateHouse", "Mayor"]}
            statuses={["Upcoming", "InProgress", "Completed"]}
          />

          <DataTable<Election>
            columns={columns}
            data={elections ?? []}
            isLoading={isLoading}
            emptyMessage={error ? `Error: ${error.message}` : "No elections found"}
            pageSize={10}
            getRowId={(e) => e._id}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function statusColor(status: string): "default" | "success" | "warning" | "danger" | "primary" {
  switch (status) {
    case "Completed":
      return "success";
    case "InProgress":
      return "primary";
    case "Upcoming":
      return "warning";
    default:
      return "default";
  }
}
