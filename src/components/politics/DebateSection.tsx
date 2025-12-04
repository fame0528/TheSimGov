/**
 * @fileoverview Debate Section Component
 * @module components/politics/DebateSection
 * 
 * OVERVIEW:
 * Display and submit debate statements on bills.
 * Enforces 3-statement limit and 5-minute edit window.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Pagination } from '@heroui/pagination';
import { Spinner } from '@heroui/spinner';
import { Chip } from '@heroui/chip';
import { FiMessageSquare, FiEdit2, FiAlertCircle } from 'react-icons/fi';
import { StatusBadge } from '@/lib/components/politics/shared';
import { formatDate } from '@/lib/utils/date';
import { formatPersuasionScore, getPersuasionColor } from '@/lib/utils/politics/billFormatting';
import type { DebatePosition } from '@/lib/db/models/DebateStatement';
import type { DebateStatementDisplay } from '@/types/politics/bills';

export interface DebateSectionProps {
  /** Bill ID */
  billId: string;
  /** User's own statements count */
  userStatementCount?: number;
  /** Callback when statement submitted */
  onStatementSuccess?: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * DebateSection - Display and submit debate statements
 * 
 * Features:
 * - Statement list with pagination
 * - Position badges (FOR/AGAINST/NEUTRAL)
 * - Persuasion scores
 * - Submit form (3-statement limit)
 * - 5-minute edit window for own statements
 * 
 * @example
 * ```tsx
 * <DebateSection
 *   billId="bill-123"
 *   userStatementCount={2}
 *   onStatementSuccess={() => router.refresh()}
 * />
 * ```
 */
export function DebateSection({
  billId,
  userStatementCount = 0,
  onStatementSuccess,
  className = '',
}: DebateSectionProps) {
  const [page, setPage] = useState(1);
  const [positionFilter, setPositionFilter] = useState<DebatePosition | ''>('');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'persuasionScore'>('submittedAt');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [newPosition, setNewPosition] = useState<DebatePosition>('FOR');
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '20');
  queryParams.set('sortBy', sortBy);
  queryParams.set('order', 'desc');
  if (positionFilter) queryParams.set('position', positionFilter);
  
  // Fetch debate statements
  const { data, error: fetchError, isLoading, mutate } = useSWR(
    `/api/politics/bills/${billId}/debate?${queryParams.toString()}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch debate statements');
      return res.json();
    },
    { refreshInterval: 30000 }
  );
  
  const statements: DebateStatementDisplay[] = data?.data?.statements || [];
  const pagination = data?.data?.pagination;
  const summary = data?.data?.summary;
  
  const canSubmit = userStatementCount < 3;
  
  const handleSubmit = async () => {
    if (newText.length < 50) {
      setError('Statement must be at least 50 characters');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/politics/bills/${billId}/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: newPosition,
          text: newText,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit statement');
      }
      
      setNewText('');
      setIsSubmitOpen(false);
      mutate(); // Refresh statements list
      onStatementSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <FiMessageSquare className="text-primary text-xl" />
            <h3 className="text-lg font-semibold">Debate Statements</h3>
          </div>
          
          {canSubmit ? (
            <Button
              color="primary"
              size="sm"
              onPress={() => setIsSubmitOpen(!isSubmitOpen)}
              startContent={<FiEdit2 />}
            >
              Submit Statement ({userStatementCount}/3)
            </Button>
          ) : (
            <Chip color="warning" variant="flat">
              Limit Reached (3/3)
            </Chip>
          )}
        </CardHeader>
        
        {/* Submit Form */}
        {isSubmitOpen && (
          <CardBody className="pt-0 space-y-3">
            {error && (
              <Card className="bg-danger-50 border border-danger-200">
                <CardBody className="p-3 flex items-start gap-2">
                  <FiAlertCircle className="text-danger flex-shrink-0 mt-1" />
                  <p className="text-danger text-sm">{error}</p>
                </CardBody>
              </Card>
            )}
            
            <Select
              label="Position"
              selectedKeys={[newPosition]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as DebatePosition;
                setNewPosition(value);
              }}
            >
              <SelectItem key="FOR">For</SelectItem>
              <SelectItem key="AGAINST">Against</SelectItem>
              <SelectItem key="NEUTRAL">Neutral</SelectItem>
            </Select>
            
            <Textarea
              label="Statement"
              placeholder="Enter your debate statement (minimum 50 characters)..."
              value={newText}
              onValueChange={setNewText}
              minRows={4}
              description={`${newText.length}/50 minimum characters`}
            />
            
            <div className="flex gap-2">
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={newText.length < 50}
              >
                Submit Statement
              </Button>
              <Button
                variant="flat"
                onPress={() => {
                  setIsSubmitOpen(false);
                  setError(null);
                }}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </CardBody>
        )}
      </Card>
      
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-none border">
            <CardBody className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{summary.forCount}</p>
              <p className="text-sm text-gray-600">For</p>
            </CardBody>
          </Card>
          <Card className="shadow-none border">
            <CardBody className="p-4 text-center">
              <p className="text-2xl font-bold text-danger">{summary.againstCount}</p>
              <p className="text-sm text-gray-600">Against</p>
            </CardBody>
          </Card>
          <Card className="shadow-none border">
            <CardBody className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{summary.neutralCount}</p>
              <p className="text-sm text-gray-600">Neutral</p>
            </CardBody>
          </Card>
        </div>
      )}
      
      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Filter by Position"
              placeholder="All Positions"
              selectedKeys={positionFilter ? [positionFilter] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as DebatePosition | '';
                setPositionFilter(value);
                setPage(1);
              }}
            >
              <SelectItem key="FOR">For</SelectItem>
              <SelectItem key="AGAINST">Against</SelectItem>
              <SelectItem key="NEUTRAL">Neutral</SelectItem>
            </Select>
            
            <Select
              label="Sort By"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as 'submittedAt' | 'persuasionScore';
                setSortBy(value);
              }}
            >
              <SelectItem key="submittedAt">Most Recent</SelectItem>
              <SelectItem key="persuasionScore">Most Persuasive</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>
      
      {/* Statements List */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}
      
      {fetchError && (
        <Card className="bg-danger-50 border border-danger-200">
          <CardBody>
            <p className="text-danger text-center">Failed to load debate statements</p>
          </CardBody>
        </Card>
      )}
      
      {!isLoading && !fetchError && statements.length === 0 && (
        <Card className="bg-gray-50">
          <CardBody>
            <p className="text-gray-500 text-center">No debate statements yet. Be the first!</p>
          </CardBody>
        </Card>
      )}
      
      {!isLoading && !fetchError && statements.length > 0 && (
        <div className="space-y-3">
          {statements.map((statement) => (
            <Card key={statement._id} className="shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge type="position" value={statement.position} size="sm" showIcon />
                    <span className="font-semibold">{statement.author.username}</span>
                    {statement.canEdit && (
                      <Chip color="warning" size="sm" variant="flat">
                        Editable
                      </Chip>
                    )}
                  </div>
                  
                  <Chip
                    color={getPersuasionColor(statement.persuasionScore)}
                    size="sm"
                    variant="flat"
                  >
                    {formatPersuasionScore(statement.persuasionScore)} persuasion
                  </Chip>
                </div>
                
                <p className="text-gray-700 mb-2">{statement.text}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(new Date(statement.createdAt))}</span>
                  {statement.editedAt && (
                    <span className="italic">Edited {formatDate(new Date(statement.editedAt))}</span>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={pagination.totalPages}
            page={page}
            onChange={setPage}
            showControls
          />
        </div>
      )}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **3-Statement Limit**: Enforced in UI, shows X/3 counter
 * 2. **5-Minute Edit**: Backend enforces, UI shows "Editable" chip
 * 3. **Persuasion Scores**: Color-coded (green=positive, red=negative)
 * 4. **Real-Time Updates**: SWR refreshes every 30s
 * 5. **Filtering/Sorting**: Position filter + date/persuasion sort
 * 
 * PREVENTS:
 * - Statement spam (3-statement limit)
 * - Stale debates (auto-refresh)
 * - Poor UX (clear position badges, persuasion indicators)
 */
