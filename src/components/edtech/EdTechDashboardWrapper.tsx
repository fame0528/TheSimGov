/**
 * @fileoverview EdTech Company Dashboard Wrapper
 * @module components/edtech/EdTechDashboardWrapper
 *
 * OVERVIEW:
 * Wrapper component that detects EdTech companies and renders the
 * comprehensive EdTech dashboard with course management and enrollment tracking.
 *
 * PATTERN:
 * Follows the established dashboard wrapper pattern used by AI, Energy,
 * Software, and E-Commerce industries for consistent UI/UX across domains.
 *
 * @created 2025-11-28
 * @author ECHO v1.3.1 with GUARDIAN Protocol
 */

'use client';

import { DashboardLayout } from '@/lib/components/layouts';
import { LoadingSpinner, ErrorMessage, Card } from '@/lib/components/shared';
import { CourseManagement, EnrollmentTracking } from '@/components/edtech';
import { Button, Tabs, Tab } from '@heroui/react';
import { useRouter } from 'next/navigation';

interface EdTechDashboardWrapperProps {
  company: {
    id: string;
    name: string;
    level: number;
  };
  companyId: string;
}

export function EdTechDashboardWrapper({
  company,
  companyId,
}: EdTechDashboardWrapperProps) {
  const router = useRouter();

  return (
    <DashboardLayout
      title={company.name}
      subtitle={`🎓 EdTech Company • Level ${company.level}`}
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <Card>
          <Tabs
            aria-label="EdTech Management"
            color="primary"
            variant="bordered"
            classNames={{
              tabList: 'gap-4 w-full p-0 border-b border-divider',
              cursor: 'w-full bg-primary',
              tab: 'max-w-full px-4 h-12',
              tabContent: 'group-data-[selected=true]:text-primary',
            }}
          >
            <Tab key="courses" title="📚 Courses">
              <div className="py-6">
                <CourseManagement companyId={companyId} />
              </div>
            </Tab>

            <Tab key="enrollments" title="👥 Enrollments">
              <div className="py-6">
                <EnrollmentTracking companyId={companyId} />
              </div>
            </Tab>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}
