/**
 * @file app/(game)/test-notifications/page.tsx
 * @description Test page for notification system verification
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Developer tool page to test all notification types and ensure react-toastify
 * integration is working correctly. Displays interactive buttons for each
 * notification variant.
 */
'use client';

import { 
  notifySuccess, 
  notifyError, 
  notifyWarning, 
  notifyInfo,
  contractNotifications,
  notifyPromise,
} from '@/lib/notifications/toast';

export default function TestNotificationsPage() {
  const testAsyncOperation = () => {
    const mockPromise = new Promise((resolve) => {
      setTimeout(() => resolve('Success!'), 2000);
    });

    notifyPromise(
      mockPromise,
      {
        pending: 'Processing...',
        success: 'Operation completed!',
        error: 'Operation failed'
      }
    );
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Notification System Test</h1>
      <p className="text-sm text-gray-600 mb-6">
        Click buttons below to test different notification types.
      </p>

      {/* Basic Notifications */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Basic Notifications</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => notifySuccess('This is a success message!')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
          >
            Success
          </button>
          <button
            onClick={() => notifyError('This is an error message!')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
          >
            Error
          </button>
          <button
            onClick={() => notifyWarning('This is a warning message!')}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500"
          >
            Warning
          </button>
          <button
            onClick={() => notifyInfo('This is an info message!')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Info
          </button>
        </div>
      </section>

      {/* Contract-Specific Notifications */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Contract Notifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => contractNotifications.bidSubmitted('Highway Construction Project', 2, 7, 68.5)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
          >
            Bid Submitted
          </button>
          <button
            onClick={() => contractNotifications.bidFailed('Highway Construction Project', 'Insufficient funds')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 text-sm"
          >
            Bid Failed
          </button>
          <button
            onClick={() => contractNotifications.milestoneCompleted('Foundation Complete', 'Building Project', 92)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm"
          >
            Milestone Completed
          </button>
          <button
            onClick={() => contractNotifications.contractCompleted('Highway Construction Project', 4500000, 15)}
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 text-sm"
          >
            Contract Completed (+Rep)
          </button>
          <button
            onClick={() => contractNotifications.contractCompleted('Failed Project', 2000000, -10)}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 text-sm"
          >
            Contract Completed (-Rep)
          </button>
          <button
            onClick={() => contractNotifications.progressUpdated('Highway Construction', 67.5)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
          >
            Progress Updated
          </button>
          <button
            onClick={() => contractNotifications.deadlineWarning('Urgent Project', 3)}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 text-sm"
          >
            Deadline Warning
          </button>
          <button
            onClick={() => contractNotifications.qualityAlert('Building Project', 92, 'Excellent')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm"
          >
            Quality Excellent
          </button>
          <button
            onClick={() => contractNotifications.qualityAlert('Troubled Project', 55, 'Poor')}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500 text-sm"
          >
            Quality Poor
          </button>
          <button
            onClick={() => contractNotifications.autoProgressionComplete('Highway Project', 2.5, new Date(Date.now() + 30*24*60*60*1000).toISOString())}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
          >
            Auto-Progression
          </button>
          <button
            onClick={() => contractNotifications.bidWon('Highway Construction', 3750000)}
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 text-sm"
          >
            Bid Won 🎉
          </button>
          <button
            onClick={() => contractNotifications.bidLost('Office Building Project')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
          >
            Bid Lost
          </button>
          <button
            onClick={() => contractNotifications.penaltyApplied('Late Project', 50000, 'Missed deadline by 5 days')}
            className="px-4 py-2 bg-orange-700 text-white rounded hover:bg-orange-600 text-sm"
          >
            Penalty Applied
          </button>
          <button
            onClick={() => contractNotifications.bonusEarned('Early Project', 25000, 'Completed 3 days early')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm"
          >
            Bonus Earned
          </button>
        </div>
      </section>

      {/* Promise-Based Notification */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Async Operations</h2>
        <button
          onClick={testAsyncOperation}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500"
        >
          Test Promise Notification (2s delay)
        </button>
        <p className="text-xs text-gray-600">
          Shows pending → success transition
        </p>
      </section>

      {/* Configuration Info */}
      <section className="border rounded-lg p-6 space-y-2 bg-gray-50">
        <h2 className="text-xl font-semibold">Configuration</h2>
        <ul className="text-sm space-y-1 text-gray-700">
          <li><strong>Position:</strong> top-right</li>
          <li><strong>Auto-close:</strong> 5 seconds (7-10s for important notifications)</li>
          <li><strong>Theme:</strong> dark</li>
          <li><strong>Dismissible:</strong> Click or drag</li>
          <li><strong>Pause on hover:</strong> Enabled</li>
        </ul>
      </section>
    </div>
  );
}
