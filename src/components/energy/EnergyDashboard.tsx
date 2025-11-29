// OVERVIEW: Energy overview dashboard composition shell
// Date: 2025-11-28
import React from 'react';
import { OilGasOperations } from './OilGasOperations';
import { RenewableEnergyDashboard } from './RenewableEnergyDashboard';

type TabKey = 'oil-gas' | 'renewables';

export function EnergyDashboard() {
  const [tab, setTab] = React.useState<TabKey>('oil-gas');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded ${tab === 'oil-gas' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('oil-gas')}
        >
          Oil & Gas
        </button>
        <button
          className={`px-3 py-2 rounded ${tab === 'renewables' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('renewables')}
        >
          Renewables
        </button>
      </div>

      {tab === 'oil-gas' ? <OilGasOperations /> : <RenewableEnergyDashboard />}
    </div>
  );
}

export default EnergyDashboard;
