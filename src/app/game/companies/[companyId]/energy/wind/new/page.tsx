// src/app/game/companies/[companyId]/energy/wind/new/page.tsx
// Created: 2025-12-06
// OVERVIEW: Page for creating a new Wind Energy Asset (AAA dashboard pattern)

import React from "react";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function NewWindAssetPage() {
  const router = useRouter();

  // Handler for form submission (placeholder, replace with actual logic)
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement asset creation logic
    router.back();
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <Card className="w-full max-w-xl bg-dark-900 shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-white">Create New Wind Asset</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">Asset Name</label>
              <input type="text" name="name" required className="mt-1 block w-full rounded-md bg-dark-800 text-white border border-dark-700 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Capacity (MW)</label>
              <input type="number" name="capacity" required min={1} className="mt-1 block w-full rounded-md bg-dark-800 text-white border border-dark-700 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Location</label>
              <input type="text" name="location" required className="mt-1 block w-full rounded-md bg-dark-800 text-white border border-dark-700 px-3 py-2" />
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" color="primary">
                Create Asset
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
