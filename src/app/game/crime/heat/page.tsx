"use client";
import DisclaimerGate from "@/components/crime/DisclaimerGate";
import { useHeat } from "@/lib/hooks/useCrime";
import RiskMeter from "@/components/crime/RiskMeter";
import { Input, Button } from "@heroui/react";
import { useState } from "react";

export default function CrimeHeatPage() {
  const [state, setState] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const { data, mutate } = useHeat(state && city ? { state, city } : undefined);

  return (
    <DisclaimerGate>
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Input label="State (e.g., CA)" value={state} onValueChange={setState} size="sm" />
          <Input label="City" value={city} onValueChange={setCity} size="sm" />
          <Button size="sm" onPress={() => mutate()}>Refresh</Button>
        </div>
        <RiskMeter value={typeof data === "number" ? data : 0} />
      </div>
    </DisclaimerGate>
  );
}
