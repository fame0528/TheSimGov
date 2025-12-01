"use client";
import DisclaimerGate from "@/components/crime/DisclaimerGate";
import MarketplaceTable from "@/components/crime/MarketplaceTable";

export default function CrimeMarketplacePage() {
  return (
    <DisclaimerGate>
      <MarketplaceTable />
    </DisclaimerGate>
  );
}
