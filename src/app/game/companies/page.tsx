/**
 * @fileoverview Companies List Page
 * @module app/game/companies/page
 * 
 * OVERVIEW:
 * Lists all player's companies with quick actions.
 * Entry point for company management.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Card, CardBody } from '@heroui/card';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCompanies } from '@/lib/hooks/useCompany';

export default function CompaniesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Fetch companies for the logged-in user
  const { data: companies, isLoading, error, refetch } = useCompanies();
  // Calculate user's total cash across all companies, guard against null
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const totalCash = safeCompanies.reduce((sum, c) => sum + (c.cash || 0), 0);

  if (!session) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto p-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
            <CardBody className="gap-4 p-8 items-center">
              <h1 className="text-3xl font-bold text-white">Please sign in to view companies</h1>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
                onPress={() => router.push('/api/auth/signin')}
              >
                Sign In
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Your Companies
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Manage your business empire</p>
              {/* User's total cash display */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-green-400 font-bold text-lg">Total Funds:</span>
                <span className="text-green-300 font-mono text-lg">${totalCash.toLocaleString()}</span>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-xl shadow-blue-500/30 transition-all duration-300"
              onPress={() => router.push('/game/companies/create')}
            >
              Create Company
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-8">
      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Loading companies...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-12">Error loading companies. <Button onPress={refetch}>Retry</Button></div>
      ) : safeCompanies.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10" shadow="lg">
          <CardBody className="gap-6 p-12 items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">No Companies Yet</h2>
              <p className="text-slate-400 max-w-md">
                Start building your empire by creating your first company
              </p>
            </div>
            <Button
              size="lg"
              className="h-14 px-8 font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-xl shadow-blue-500/30 transition-all duration-300"
              onPress={() => router.push('/game/companies/create')}
            >
              Create Your First Company
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeCompanies.map((company: any) => (
            <Card
              key={company._id || company.id}
              isPressable
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
              shadow="lg"
              onPress={() => router.push(`/game/companies/${company._id || company.id}`)}
            >
              <CardBody className="gap-4 p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">{company.name}</h2>
                  <Chip size="lg" className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">L{company.level}</Chip>
                </div>
                <p className="text-slate-400 font-medium">{company.industry}</p>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Employees</span>
                    <span className="text-lg font-bold text-white">{company.employees?.length || 0}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500">Cash</span>
                    <span className="text-lg font-bold text-green-400">${company.cash?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
