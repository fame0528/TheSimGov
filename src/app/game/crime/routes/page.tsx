"use client";
import DisclaimerGate from "@/components/crime/DisclaimerGate";
import RoutesList from "@/components/crime/RoutesList";

export default function CrimeRoutesPage() {
  return (
    <DisclaimerGate>
      <RoutesList />
    </DisclaimerGate>
  );
}
