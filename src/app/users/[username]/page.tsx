/**
 * @fileoverview Public User Profile Page
 * @route /users/[username]
 * Displays a player's public profile and owned companies.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardBody, Avatar, Button, Divider } from '@heroui/react';

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
  const username = params?.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-300">Loading profile…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md bg-slate-900/60 border border-white/10">
          <CardBody>
            <div className="text-red-400">{error || 'Profile not found'}</div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="bg-slate-900/60 border border-white/10">
          <CardBody className="flex items-center gap-4">
            <Avatar src={profile.imageUrl} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-slate-400 text-sm">
                @{profile.username} • {profile.gender}
                {profile.ethnicity ? ` • ${profile.ethnicity}` : ''} • {profile.state}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-slate-900/60 border border-white/10">
          <CardBody className="space-y-3">
            <h2 className="text-white text-lg font-medium">Companies</h2>
            <Divider className="bg-white/10" />
            {profile.companies.length === 0 ? (
              <p className="text-slate-400">No companies yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.companies.map((c) => (
                  <Card key={c.id} className="bg-slate-800/60 border border-white/10">
                    <CardBody className="flex items-center gap-3">
                      {c.logoUrl ? (
                        <Avatar src={c.logoUrl} size="sm" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-700" />
                      )}
                      <div className="flex-1">
                        <div className="text-white font-medium">{c.name}</div>
                        <div className="text-slate-400 text-xs">
                          {c.industry} • L{c.level}
                          {typeof c.reputation === 'number' ? ` • Rep ${c.reputation}` : ''}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                        onClick={() => router.push(`/game/companies/${c.id}`)}
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
  );
}
