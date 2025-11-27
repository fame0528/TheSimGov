/**
 * @fileoverview Voting Interface Component
 * @module components/politics/VotingInterface
 * 
 * OVERVIEW:
 * Cast vote on bill with lobby payment preview.
 * Shows payment breakdown by chamber and state.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { FiThumbsUp, FiThumbsDown, FiMinus, FiAlertCircle } from 'react-icons/fi';
import { PaymentPreview, StatusBadge } from '@/lib/components/politics/shared';
import type { VoteValue, Chamber } from '@/lib/db/models/Bill';
import type { LobbyPaymentPreview } from '@/types/politics/bills';

export interface VotingInterfaceProps {
  /** Bill ID */
  billId: string;
  /** User's chamber (if elected) */
  userChamber?: Chamber;
  /** User's state (if elected) */
  userState?: string;
  /** Callback when vote cast */
  onVoteSuccess?: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * VotingInterface - Cast vote with lobby payment preview
 * 
 * Features:
 * - Aye/Nay/Abstain buttons
 * - Real-time payment preview
 * - Chamber and state selection (if applicable)
 * - Confirmation modal
 * - Instant lobby payment processing
 * 
 * @example
 * ```tsx
 * <VotingInterface
 *   billId="bill-123"
 *   userChamber="senate"
 *   userState="CA"
 *   onVoteSuccess={() => router.refresh()}
 * />
 * ```
 */
export function VotingInterface({
  billId,
  userChamber,
  userState,
  onVoteSuccess,
  className = '',
}: VotingInterfaceProps) {
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [selectedChamber, setSelectedChamber] = useState<Chamber>(userChamber || 'senate');
  const [selectedState, setSelectedState] = useState<string>(userState || '');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch lobby positions for payment preview
  const queryParams = new URLSearchParams();
  if (selectedChamber) queryParams.set('chamber', selectedChamber);
  if (selectedState) queryParams.set('state', selectedState);
  
  const { data: lobbyData, isLoading: isLoadingLobbies } = useSWR(
    selectedVote ? `/api/politics/bills/${billId}/lobby?${queryParams.toString()}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch lobby positions');
      return res.json();
    }
  );
  
  const paymentPreview: LobbyPaymentPreview | undefined = lobbyData?.data?.paymentPreview;
  
  const handleVoteClick = (vote: VoteValue) => {
    setSelectedVote(vote);
    setError(null);
    setIsConfirmOpen(true);
  };
  
  const handleConfirmVote = async () => {
    if (!selectedVote) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/politics/bills/${billId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote: selectedVote,
          chamber: selectedChamber,
          state: selectedState || undefined,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cast vote');
      }
      
      const data = await res.json();
      setIsConfirmOpen(false);
      onVoteSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Cast Your Vote</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Vote Options */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              color="success"
              variant="flat"
              size="lg"
              fullWidth
              startContent={<FiThumbsUp />}
              onPress={() => handleVoteClick('Aye')}
            >
              Aye
            </Button>
            
            <Button
              color="danger"
              variant="flat"
              size="lg"
              fullWidth
              startContent={<FiThumbsDown />}
              onPress={() => handleVoteClick('Nay')}
            >
              Nay
            </Button>
            
            <Button
              color="default"
              variant="flat"
              size="lg"
              fullWidth
              startContent={<FiMinus />}
              onPress={() => handleVoteClick('Abstain')}
            >
              Abstain
            </Button>
          </div>
          
          {/* Chamber/State Selection (if not provided) */}
          {!userChamber && (
            <Select
              label="Chamber"
              selectedKeys={[selectedChamber]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as Chamber;
                setSelectedChamber(value);
              }}
            >
              <SelectItem key="senate">Senate</SelectItem>
              <SelectItem key="house">House of Representatives</SelectItem>
            </Select>
          )}
          
          {!userState && selectedChamber === 'house' && (
            <Select
              label="State"
              placeholder="Select your state"
              selectedKeys={selectedState ? [selectedState] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setSelectedState(value);
              }}
            >
              {/* US States */}
              <SelectItem key="AL">Alabama</SelectItem>
              <SelectItem key="AK">Alaska</SelectItem>
              <SelectItem key="AZ">Arizona</SelectItem>
              <SelectItem key="AR">Arkansas</SelectItem>
              <SelectItem key="CA">California</SelectItem>
              <SelectItem key="CO">Colorado</SelectItem>
              <SelectItem key="CT">Connecticut</SelectItem>
              <SelectItem key="DE">Delaware</SelectItem>
              <SelectItem key="FL">Florida</SelectItem>
              <SelectItem key="GA">Georgia</SelectItem>
              <SelectItem key="HI">Hawaii</SelectItem>
              <SelectItem key="ID">Idaho</SelectItem>
              <SelectItem key="IL">Illinois</SelectItem>
              <SelectItem key="IN">Indiana</SelectItem>
              <SelectItem key="IA">Iowa</SelectItem>
              <SelectItem key="KS">Kansas</SelectItem>
              <SelectItem key="KY">Kentucky</SelectItem>
              <SelectItem key="LA">Louisiana</SelectItem>
              <SelectItem key="ME">Maine</SelectItem>
              <SelectItem key="MD">Maryland</SelectItem>
              <SelectItem key="MA">Massachusetts</SelectItem>
              <SelectItem key="MI">Michigan</SelectItem>
              <SelectItem key="MN">Minnesota</SelectItem>
              <SelectItem key="MS">Mississippi</SelectItem>
              <SelectItem key="MO">Missouri</SelectItem>
              <SelectItem key="MT">Montana</SelectItem>
              <SelectItem key="NE">Nebraska</SelectItem>
              <SelectItem key="NV">Nevada</SelectItem>
              <SelectItem key="NH">New Hampshire</SelectItem>
              <SelectItem key="NJ">New Jersey</SelectItem>
              <SelectItem key="NM">New Mexico</SelectItem>
              <SelectItem key="NY">New York</SelectItem>
              <SelectItem key="NC">North Carolina</SelectItem>
              <SelectItem key="ND">North Dakota</SelectItem>
              <SelectItem key="OH">Ohio</SelectItem>
              <SelectItem key="OK">Oklahoma</SelectItem>
              <SelectItem key="OR">Oregon</SelectItem>
              <SelectItem key="PA">Pennsylvania</SelectItem>
              <SelectItem key="RI">Rhode Island</SelectItem>
              <SelectItem key="SC">South Carolina</SelectItem>
              <SelectItem key="SD">South Dakota</SelectItem>
              <SelectItem key="TN">Tennessee</SelectItem>
              <SelectItem key="TX">Texas</SelectItem>
              <SelectItem key="UT">Utah</SelectItem>
              <SelectItem key="VT">Vermont</SelectItem>
              <SelectItem key="VA">Virginia</SelectItem>
              <SelectItem key="WA">Washington</SelectItem>
              <SelectItem key="WV">West Virginia</SelectItem>
              <SelectItem key="WI">Wisconsin</SelectItem>
              <SelectItem key="WY">Wyoming</SelectItem>
            </Select>
          )}
          
          {/* Info Chips */}
          <div className="flex gap-2 flex-wrap">
            <Chip variant="flat" size="sm">
              Chamber: <StatusBadge type="chamber" value={selectedChamber} size="sm" />
            </Chip>
            {selectedState && selectedChamber === 'house' && (
              <Chip variant="flat" size="sm">
                State: {selectedState}
              </Chip>
            )}
          </div>
        </CardBody>
      </Card>
      
      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">Confirm Your Vote</h3>
          </ModalHeader>
          <ModalBody>
            {error && (
              <Card className="bg-danger-50 border border-danger-200">
                <CardBody className="p-4 flex items-start gap-3">
                  <FiAlertCircle className="text-danger text-xl flex-shrink-0 mt-1" />
                  <p className="text-danger text-sm">{error}</p>
                </CardBody>
              </Card>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">You are voting:</span>
                <Chip
                  color={
                    selectedVote === 'Aye' ? 'success' :
                    selectedVote === 'Nay' ? 'danger' : 'default'
                  }
                  variant="flat"
                  size="lg"
                  startContent={
                    selectedVote === 'Aye' ? <FiThumbsUp /> :
                    selectedVote === 'Nay' ? <FiThumbsDown /> : <FiMinus />
                  }
                >
                  {selectedVote || ''}
                </Chip>
              </div>
              
              {isLoadingLobbies && (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              )}
              
              {!isLoadingLobbies && paymentPreview && selectedVote !== 'Abstain' && (
                <div>
                  <h4 className="font-semibold mb-2">Lobby Payment Preview:</h4>
                  <PaymentPreview
                    voteOption={selectedVote === 'Aye' ? 'Aye' : 'Nay'}
                    totalPayment={
                      selectedVote === 'Aye' 
                        ? paymentPreview.ayePayment.totalPayment 
                        : paymentPreview.nayPayment.totalPayment
                    }
                    payments={
                      selectedVote === 'Aye'
                        ? paymentPreview.ayePayment.payments
                        : paymentPreview.nayPayment.payments
                    }
                    showBreakdown
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                Your vote will be recorded immediately and lobby payments will be processed instantly.
                You cannot change your vote after submission.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsConfirmOpen(false)}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleConfirmVote}
              isLoading={isSubmitting}
            >
              Confirm Vote
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Payment Preview**: Real-time lobby payment calculation before vote
 * 2. **Confirmation Modal**: Prevents accidental votes
 * 3. **Instant Processing**: Lobby payments processed on vote submission
 * 4. **Chamber/State**: Supports both Senate (no state) and House (with state)
 * 5. **Error Handling**: Clear error messages on submission failure
 * 
 * PREVENTS:
 * - Accidental votes (confirmation modal)
 * - Payment confusion (clear preview before vote)
 * - Invalid state data (Senate doesn't need state)
 */
