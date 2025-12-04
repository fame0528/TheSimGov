/**
 * @fileoverview Parties Page
 * @module app/game/politics/parties/page
 * 
 * OVERVIEW:
 * Browse, join, and manage political parties.
 * Uses PartiesGrid component which handles its own data fetching.
 * 
 * @created 2025-12-03
 * @author ECHO v1.4.0
 */

'use client';

import { useState } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  useDisclosure,
  Spinner,
} from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft } from 'lucide-react';
import { PartiesGrid } from '@/components/politics/parties';
import { PartyLevel, PartyStatus, PARTY_LEVEL_LABELS } from '@/lib/types/party';
import { PoliticalParty } from '@/types/politics';

/**
 * Political Party label mapping
 */
const POLITICAL_PARTY_LABELS: Record<PoliticalParty, string> = {
  [PoliticalParty.DEMOCRATIC]: 'Democratic',
  [PoliticalParty.REPUBLICAN]: 'Republican',
  [PoliticalParty.INDEPENDENT]: 'Independent',
  [PoliticalParty.LIBERTARIAN]: 'Libertarian',
  [PoliticalParty.GREEN]: 'Green',
  [PoliticalParty.OTHER]: 'Other',
};

export default function PartiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state for creating a party
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
    affiliation: PoliticalParty.INDEPENDENT,
    level: PartyLevel.STATE,
    primaryColor: '#3B82F6',
  });

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleCreateParty = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/politics/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        onClose();
        // Trigger refresh
        setRefreshKey((k) => k + 1);
        setFormData({
          name: '',
          abbreviation: '',
          description: '',
          affiliation: PoliticalParty.INDEPENDENT,
          level: PartyLevel.STATE,
          primaryColor: '#3B82F6',
        });
      }
    } catch (err) {
      console.error('Failed to create party:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePartyClick = (partyId: string) => {
    router.push(`/game/politics/parties/${partyId}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.push('/game/politics')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Political Parties</h1>
            <p className="text-default-500">Join or create parties to shape the political landscape</p>
          </div>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={onOpen}
        >
          Create Party
        </Button>
      </div>

      {/* Grid - handles its own data fetching */}
      <PartiesGrid
        key={refreshKey}
        showCreateButton={true}
        onCreateClick={onOpen}
        onPartyClick={handlePartyClick}
      />

      {/* Create Party Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create a New Political Party</ModalHeader>
          <ModalBody className="gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input
                  label="Party Name"
                  placeholder="e.g., Progressive Unity Party"
                  value={formData.name}
                  onValueChange={(value) => setFormData({ ...formData, name: value })}
                  isRequired
                />
              </div>
              <Input
                label="Abbreviation"
                placeholder="e.g., PUP"
                value={formData.abbreviation}
                onValueChange={(value) => setFormData({ ...formData, abbreviation: value.toUpperCase().slice(0, 5) })}
                isRequired
                maxLength={5}
              />
            </div>
            <Textarea
              label="Description"
              placeholder="Describe your party's platform and values"
              value={formData.description}
              onValueChange={(value) => setFormData({ ...formData, description: value })}
              isRequired
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Political Affiliation"
                selectedKeys={[formData.affiliation]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as PoliticalParty;
                  setFormData({ ...formData, affiliation: value });
                }}
              >
                {Object.entries(POLITICAL_PARTY_LABELS).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
              <Select
                label="Level"
                selectedKeys={[formData.level]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as PartyLevel;
                  setFormData({ ...formData, level: value });
                }}
              >
                {Object.entries(PARTY_LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm text-default-600 mb-2 block">Party Color</label>
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreateParty}
              isLoading={isCreating}
              isDisabled={!formData.name || !formData.abbreviation || !formData.description}
            >
              Create Party
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
