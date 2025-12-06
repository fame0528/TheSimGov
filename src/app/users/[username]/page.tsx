/**
 * @fileoverview Public User Profile Page
 * @route /users/[username]
 * Displays a player's public profile and owned companies.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardBody, Avatar, Button, Divider } from '@heroui/react';
import { Mail, ArrowLeft } from 'lucide-react';
import { ComposeMessage } from '@/components/messages';
import type { CreateMessageRequest } from '@/lib/types/messages';

interface PublicCompany {
  id: string;
  name: string;
  industry: string;
  level: number;
  reputation?: number;
  logoUrl?: string;
}

interface PublicProfile {
  username: string;
  firstName: string;
  lastName: string;
  state: string;
  gender: 'Male' | 'Female';
  ethnicity?: string;
  imageUrl: string;
  createdAt: string;
  companies: PublicCompany[];
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const username = params?.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = session?.user?.name === username;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load profile');
        } else {
          setProfile(data.profile);
        }
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (username) load();
  }, [username]);

  // Send message handler
  const handleSendMessage = async (request: CreateMessageRequest) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-300">Loading profile…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="max-w-md bg-slate-900/60 border border-white/10">
          <CardBody>
            <div className="text-red-400">{error || 'Profile not found'}</div>
            <Button
              size="sm"
              variant="light"
              className="mt-4 text-slate-400"
              onPress={() => router.back()}
            >
              ← Go Back
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar src={profile.imageUrl} size="lg" className="w-16 h-16" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                  @{profile.username} • {profile.gender}
                  {profile.ethnicity ? ` • ${profile.ethnicity}` : ''} • {profile.state}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isOwnProfile && session?.user && (
                <Button
                  color="primary"
                  startContent={<Mail className="w-4 h-4" />}
                  onPress={() => setShowCompose(true)}
                >
                  Send Message
                </Button>
              )}
              <Button
                size="sm"
                variant="light"
                onPress={() => router.back()}
                className="text-slate-400 hover:text-white"
                startContent={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card className="bg-slate-900/50 border border-white/5">
            <CardBody className="space-y-4">
              <h2 className="text-white text-lg font-medium">Profile Info</h2>
              <Divider className="bg-white/10" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Username</span>
                  <span className="text-white">@{profile.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white">{profile.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Since</span>
                  <span className="text-white">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Companies</span>
                  <span className="text-white">{profile.companies.length}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Companies */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border border-white/5">
              <CardBody className="space-y-4">
                <h2 className="text-white text-lg font-medium">Companies</h2>
                <Divider className="bg-white/10" />
                {profile.companies.length === 0 ? (
                  <p className="text-slate-400 py-4">No companies yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.companies.map((c) => (
                      <Card key={c.id} className="bg-slate-800/50 border border-white/5">
                        <CardBody className="flex items-center gap-3">
                          {c.logoUrl ? (
                            <Avatar src={c.logoUrl} size="sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                              🏢
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">{c.name}</div>
                            <div className="text-slate-400 text-xs">
                              {c.industry} • Level {c.level}
                              {typeof c.reputation === 'number' ? ` • Rep ${c.reputation}` : ''}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-blue-600/20 text-blue-400 border border-blue-600/30"
                            onPress={() => router.push(`/game/companies/${c.id}`)}
                          >
                            View
                          </Button>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Compose Message Modal */}
      <ComposeMessage
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSendMessage}
        initialRecipient={profile.username}
      />
    </div>
  );
}
