/**
 * @fileoverview Credit Score Monitor Component
 * @module components/banking/CreditScoreMonitor
 *
 * OVERVIEW:
 * Component for monitoring credit score with improvement suggestions
 * and historical tracking.
 *
 * @created 2025-11-23
 * @author ECHO v1.3.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';
import { Badge } from '@heroui/badge';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Alert } from '@heroui/alert';
import type { CreditScoreResponse } from '@/lib/types/models';

interface CreditScoreMonitorProps {
  companyId: string;
  onRefreshScore?: () => Promise<void>;
}

interface CreditHistory {
  date: Date;
  score: number;
  change: number;
  factors: string[];
}

interface ImprovementTip {
  category: string;
  tip: string;
  impact: 'High' | 'Medium' | 'Low';
  timeframe: string;
}

export default function CreditScoreMonitor({
  companyId,
  onRefreshScore,
}: CreditScoreMonitorProps) {
  // State
  const [creditData, setCreditData] = useState<CreditScoreResponse | null>(null);
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load credit score data
  useEffect(() => {
    const loadCreditData = async () => {
      try {
        const response = await fetch(`/api/banking/credit-score?companyId=${companyId}`);
        if (response.ok) {
          const data: CreditScoreResponse = await response.json();
          setCreditData(data);
        } else {
          setError('Failed to load credit score');
        }
      } catch (err) {
        setError('Failed to load credit score');
        console.error('Credit score load error:', err);
      }
    };

    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/banking/credit-score/history?companyId=${companyId}`);
        if (response.ok) {
          const historyData = await response.json();
          setHistory(historyData);
        }
      } catch (err) {
        console.error('Credit history load error:', err);
      }
    };

    if (companyId) {
      loadCreditData();
      loadHistory();
    }
  }, [companyId]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      if (onRefreshScore) {
        await onRefreshScore();
      }

      // Reload data
      const response = await fetch(`/api/banking/credit-score?companyId=${companyId}`);
      if (response.ok) {
        const data: CreditScoreResponse = await response.json();
        setCreditData(data);
      }
    } catch (err) {
      setError('Failed to refresh credit score');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get credit score rating
  const getCreditRating = (score: number): { rating: string; color: string } => {
    if (score >= 800) return { rating: 'Excellent', color: 'success' };
    if (score >= 740) return { rating: 'Very Good', color: 'primary' };
    if (score >= 670) return { rating: 'Good', color: 'warning' };
    if (score >= 580) return { rating: 'Fair', color: 'secondary' };
    return { rating: 'Poor', color: 'danger' };
  };

  // Get improvement tips
  const getImprovementTips = (score: number): ImprovementTip[] => {
    const tips: ImprovementTip[] = [];

    if (score < 670) {
      tips.push({
        category: 'Payment History',
        tip: 'Make all loan payments on time for the next 6 months',
        impact: 'High',
        timeframe: '6 months',
      });
    }

    if (score < 740) {
      tips.push({
        category: 'Credit Utilization',
        tip: 'Keep credit utilization below 30% of available credit',
        impact: 'High',
        timeframe: '3 months',
      });
    }

    tips.push({
      category: 'Payment History',
      tip: 'Set up auto-pay for all loans to ensure timely payments',
      impact: 'Medium',
      timeframe: 'Ongoing',
    });

    tips.push({
      category: 'Loan Management',
      tip: 'Pay down high-interest loans faster to reduce overall debt load',
      impact: 'Medium',
      timeframe: '6-12 months',
    });

    tips.push({
      category: 'Credit Mix',
      tip: 'Maintain a mix of different loan types (business, equipment, etc.)',
      impact: 'Low',
      timeframe: 'Ongoing',
    });

    return tips;
  };

  // Calculate score progress percentage
  const getScoreProgress = (score: number): number => {
    return ((score - 300) / (850 - 300)) * 100;
  };

  if (!creditData) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            {error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="text-gray-500">Loading credit score...</div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  const rating = getCreditRating(creditData.score);
  const improvementTips = getImprovementTips(creditData.score);

  return (
    <div className="space-y-6">
      {/* Credit Score Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Credit Score</h2>
              <p className="text-gray-600">Monitor your creditworthiness</p>
            </div>
            <Button
              variant="bordered"
              onPress={handleRefresh}
              isLoading={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Score'}
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold mb-2">{creditData.score}</div>
            <Chip color={rating.color as 'success' | 'primary' | 'warning' | 'secondary' | 'danger'} variant="flat" size="lg">
              {rating.rating}
            </Chip>
            <div className="text-sm text-gray-600 mt-2">
              Range: 300 - 850
            </div>
          </div>

          <Progress
            value={getScoreProgress(creditData.score)}
            color="primary"
            className="mb-4"
            size="lg"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">Excellent</div>
              <div className="text-sm text-gray-600">800+</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">Very Good</div>
              <div className="text-sm text-gray-600">740-799</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">Good</div>
              <div className="text-sm text-gray-600">670-739</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-600">Fair</div>
              <div className="text-sm text-gray-600">580-669</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Credit Factors */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Credit Factors</h3>
          <p className="text-gray-600">What affects your credit score</p>
        </CardHeader>

        <CardBody>
          <div className="space-y-4">
            {creditData.factors.map((factor, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{factor.factor}</div>
                  <div className="text-sm text-gray-600">{factor.description}</div>
                </div>
                <Badge
                  color={factor.impact === 'Positive' ? 'success' : factor.impact === 'Negative' ? 'danger' : 'default'}
                  variant="flat"
                >
                  {factor.impact}
                </Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Improvement Tips */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Improvement Tips</h3>
          <p className="text-gray-600">Ways to improve your credit score</p>
        </CardHeader>

        <CardBody>
          <div className="space-y-3">
            {improvementTips.map((tip, index) => (
              <Alert key={index} color="primary" variant="flat">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{tip.category}</div>
                    <div className="text-sm mt-1">{tip.tip}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className={`font-medium ${
                      tip.impact === 'High' ? 'text-green-600' :
                      tip.impact === 'Medium' ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {tip.impact} Impact
                    </div>
                    <div className="text-gray-600">{tip.timeframe}</div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Credit History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Credit History</h3>
            <p className="text-gray-600">Track your credit score over time</p>
          </CardHeader>

          <CardBody>
            <Table aria-label="Credit history">
              <TableHeader>
                <TableColumn>DATE</TableColumn>
                <TableColumn>SCORE</TableColumn>
                <TableColumn>CHANGE</TableColumn>
                <TableColumn>FACTORS</TableColumn>
              </TableHeader>
              <TableBody>
                {history.slice(0, 10).map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.score}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={entry.change > 0 ? 'success' : entry.change < 0 ? 'danger' : 'default'}
                        variant="flat"
                      >
                        {entry.change > 0 ? '+' : ''}{entry.change}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {entry.factors.join(', ')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Credit Score Ranges Reference */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Credit Score Ranges</h3>
        </CardHeader>

        <CardBody>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border-l-4 border-green-500 bg-green-50">
              <div>
                <div className="font-medium text-green-800">Excellent (800-850)</div>
                <div className="text-sm text-green-600">Lowest interest rates, best loan terms</div>
              </div>
              <div className="text-green-800 font-bold">800+</div>
            </div>

            <div className="flex justify-between items-center p-3 border-l-4 border-blue-500 bg-blue-50">
              <div>
                <div className="font-medium text-blue-800">Very Good (740-799)</div>
                <div className="text-sm text-blue-600">Good rates and terms</div>
              </div>
              <div className="text-blue-800 font-bold">740-799</div>
            </div>

            <div className="flex justify-between items-center p-3 border-l-4 border-yellow-500 bg-yellow-50">
              <div>
                <div className="font-medium text-yellow-800">Good (670-739)</div>
                <div className="text-sm text-yellow-600">Average rates and terms</div>
              </div>
              <div className="text-yellow-800 font-bold">670-739</div>
            </div>

            <div className="flex justify-between items-center p-3 border-l-4 border-gray-500 bg-gray-50">
              <div>
                <div className="font-medium text-gray-800">Fair (580-669)</div>
                <div className="text-sm text-gray-600">Higher rates, limited options</div>
              </div>
              <div className="text-gray-800 font-bold">580-669</div>
            </div>

            <div className="flex justify-between items-center p-3 border-l-4 border-red-500 bg-red-50">
              <div>
                <div className="font-medium text-red-800">Poor (300-579)</div>
                <div className="text-sm text-red-600">Highest rates, limited access</div>
              </div>
              <div className="text-red-800 font-bold">300-579</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}