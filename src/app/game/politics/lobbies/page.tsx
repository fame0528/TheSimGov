/**
 * @fileoverview Lobbies Page
 * @module app/game/politics/lobbies/page
 * 
 * OVERVIEW:
 * Browse, join, and manage lobbies (interest groups).
 * Uses LobbiesGrid component which handles its own data fetching.
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
import LobbiesGrid from '@/components/politics/lobbies/LobbiesGrid';
import {
  LobbyFocus,
  LobbyScope,
  LOBBY_FOCUS_LABELS,
  LOBBY_SCOPE_LABELS,
} from '@/lib/types/lobby';

export default function LobbiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state for creating a lobby
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    focus: LobbyFocus.BUSINESS,
    scope: LobbyScope.NATIONAL,
    inviteOnly: false,
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

  const handleCreateLobby = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/politics/lobbies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        onClose();
        // Trigger refresh by updating key
        setRefreshKey((k) => k + 1);
        setFormData({
          name: '',
          description: '',
          focus: LobbyFocus.BUSINESS,
          scope: LobbyScope.NATIONAL,
          inviteOnly: false,
        });
      }
    } catch (err) {
      console.error('Failed to create lobby:', err);
    } finally {
      setIsCreating(false);
    }
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
            <h1 className="text-3xl font-bold">Lobbies</h1>
            <p className="text-default-700">Join or create interest groups to influence policy</p>
          </div>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={onOpen}
        >
          Create Lobby
        </Button>
      </div>

      {/* Grid - handles its own data fetching */}
      <LobbiesGrid
        key={refreshKey}
        showMyLobbiesFilter={true}
        onCreateClick={onOpen}
      />

      {/* Create Lobby Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Create a New Lobby</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Lobby Name"
              placeholder="Enter a unique name for your lobby"
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              isRequired
            />
            <Textarea
              label="Description"
              placeholder="Describe your lobby's mission and goals"
              value={formData.description}
              onValueChange={(value) => setFormData({ ...formData, description: value })}
              isRequired
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Focus Area"
                selectedKeys={[formData.focus]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as LobbyFocus;
                  setFormData({ ...formData, focus: value });
                }}
              >
                {Object.entries(LOBBY_FOCUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
              <Select
                label="Scope"
                selectedKeys={[formData.scope]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as LobbyScope;
                  setFormData({ ...formData, scope: value });
                }}
              >
                {Object.entries(LOBBY_SCOPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreateLobby}
              isLoading={isCreating}
              isDisabled={!formData.name || !formData.description}
            >
              Create Lobby
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
