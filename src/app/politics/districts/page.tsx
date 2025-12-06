"use client";

import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Tabs, Tab } from "@heroui/tabs";
import { useToast } from "@/lib/hooks/ui/useToast";
import { usePolitics } from "@/lib/hooks/usePolitics";

export default function DistrictMapPage() {
  const toast = useToast();
  const { districts, demographics, isLoading, error, refresh } = usePolitics().useDistricts();

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold">District Map & Demographic Analyzer</h1>
            <div className="flex items-center gap-2">
              <Button variant="flat" onPress={() => refresh()}>Refresh</Button>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Tabs aria-label="District tabs">
            <Tab key="map" title="Map">
              <div className="rounded-lg border border-default-200 p-4">
                <p className="text-default-700">Interactive district map will render here.</p>
              </div>
            </Tab>
            <Tab key="demographics" title="Demographics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-default-200 p-4 flex flex-col gap-3">
                  <h2 className="font-semibold">Filters</h2>
                  <Select label="Age Group">
                    <SelectItem key="18-29">18-29</SelectItem>
                    <SelectItem key="30-44">30-44</SelectItem>
                    <SelectItem key="45-64">45-64</SelectItem>
                    <SelectItem key="65+">65+</SelectItem>
                  </Select>
                  <Select label="Income">
                    <SelectItem key="Low">Low</SelectItem>
                    <SelectItem key="Middle">Middle</SelectItem>
                    <SelectItem key="High">High</SelectItem>
                  </Select>
                  <Input label="District" placeholder="12" />
                </div>
                <div className="rounded-lg border border-default-200 p-4">
                  <p className="text-default-700">Demographic charts will render here.</p>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
