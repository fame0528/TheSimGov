"use client";
import { useState } from "react";
import { Card, CardHeader, CardBody, Button, Checkbox } from "@heroui/react";

export default function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const [confirmed, setConfirmed] = useState(false);
  const [age, setAge] = useState(false);
  if (!confirmed || !age) {
    return (
      <Card>
        <CardHeader>
          <div className="font-semibold">Crime Domain Disclaimer & Age Confirmation</div>
        </CardHeader>
        <CardBody>
          <p className="text-sm mb-3">
            This is a fictional economic simulation. Reality-based substance names are used; chemistry/manufacturing details are abstracted. No real-world guidance is provided.
          </p>
          <div className="flex flex-col gap-2 mb-3">
            <Checkbox isSelected={age} onValueChange={setAge}>I am 18+ (or meet local age requirements)</Checkbox>
            <Checkbox isSelected={confirmed} onValueChange={setConfirmed}>I understand this is fiction and will not use it for real-world activity</Checkbox>
          </div>
          <Button isDisabled={!confirmed || !age} color="primary" onPress={() => { /* both flags already set via checkbox */ }}>Enter</Button>
        </CardBody>
      </Card>
    );
  }
  return <>{children}</>;
}
