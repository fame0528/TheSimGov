"use client";
import DisclaimerGate from "@/components/crime/DisclaimerGate";
import FacilitiesList from "@/components/crime/FacilitiesList";

export default function CrimeFacilitiesPage() {
  return (
    <DisclaimerGate>
      <FacilitiesList />
    </DisclaimerGate>
  );
}
