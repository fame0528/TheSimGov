"use client";

import { Stat, StatHelpText, StatNumber } from "@chakra-ui/react";
import SectionCard from '@/components/ui/SectionCard';

interface KPIStatProps {
  label: string;
  value: string | number;
  helpText?: string;
  iconClass?: string; // Font Awesome class
  color?: string; // token like 'gold.500'
}

export default function KPIStat({ label, value, helpText, iconClass, color = "picton_blue.500" }: KPIStatProps) {
  return (
    <SectionCard title={label} iconClass={iconClass}>
      <Stat>
        <StatNumber color={color}>{value}</StatNumber>
        {helpText ? <StatHelpText color="subtext">{helpText}</StatHelpText> : null}
      </Stat>
    </SectionCard>
  );
}
