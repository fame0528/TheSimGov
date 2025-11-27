/**
 * @file page.tsx
 * @description Multiplayer dashboard page integrating chat, elections, and market trading
 * @created 2025-11-24
 */

import { Suspense } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { ChatPanel, ElectionsPanel, MarketPanel } from '@/components/multiplayer';
import { useSession } from '@/lib/hooks/useAuth';

function MultiplayerDashboard() {
  const { data: user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <h2 className="text-xl font-semibold">Access Denied</h2>
          </CardHeader>
          <CardBody>
            <p>Please log in to access the multiplayer features.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Multiplayer Hub</h1>
          <p className="text-gray-600 mt-2">
            Connect with other players through real-time chat, participate in elections, and trade in the market.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel - Left Column */}
          <div className="lg:col-span-1">
            <ChatPanel
              roomId="general"
              height="600px"
              className="h-full"
            />
          </div>

          {/* Elections Panel - Middle Column */}
          <div className="lg:col-span-1">
            <ElectionsPanel
              height="600px"
              className="h-full"
            />
          </div>

          {/* Market Panel - Right Column */}
          <div className="lg:col-span-1">
            <MarketPanel
              marketType="stocks"
              height="600px"
              className="h-full"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Real-time Features</h3>
            </CardHeader>
            <CardBody>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Live chat with other players</li>
                <li>• Real-time election voting</li>
                <li>• Live market trading</li>
                <li>• Instant notifications</li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Multiplayer Benefits</h3>
            </CardHeader>
            <CardBody>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Compete in elections</li>
                <li>• Trade company stocks</li>
                <li>• Form alliances</li>
                <li>• Influence the economy</li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Getting Started</h3>
            </CardHeader>
            <CardBody>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Join the general chat</li>
                <li>• Vote in active elections</li>
                <li>• Place buy/sell orders</li>
                <li>• Monitor market activity</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function MultiplayerPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    }>
      <MultiplayerDashboard />
    </Suspense>
  );
}