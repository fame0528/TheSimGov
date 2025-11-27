'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResearchProjectManager, ResearchProject } from '@/lib/components/ai/ResearchProjectManager';

// NOTE: Phase 2 Research Page
// Mounts ResearchProjectManager with sample projects and action handlers.
// Real implementation would fetch from /api/ai/research/projects endpoint.

export default function AIResearchPage() {
  const router = useRouter();

  // Sample research projects for demonstration
  const [projects, setProjects] = useState<ResearchProject[]>([
    {
      id: 'rp-1',
      name: 'Transformer Architecture Efficiency',
      type: 'Efficiency',
      complexity: 'High',
      status: 'InProgress',
      progress: 45,
      budgetAllocated: 500000,
      budgetSpent: 210000,
      breakthroughs: 2,
      createdAt: new Date('2025-10-15'),
    },
    {
      id: 'rp-2',
      name: 'Vision Model Performance Boost',
      type: 'Performance',
      complexity: 'Medium',
      status: 'InProgress',
      progress: 70,
      budgetAllocated: 300000,
      budgetSpent: 180000,
      breakthroughs: 1,
      createdAt: new Date('2025-11-01'),
    },
    {
      id: 'rp-3',
      name: 'Multimodal AI Capabilities',
      type: 'NewCapability',
      complexity: 'High',
      status: 'Completed',
      progress: 100,
      budgetAllocated: 750000,
      budgetSpent: 680000,
      breakthroughs: 4,
      createdAt: new Date('2025-08-20'),
      completedAt: new Date('2025-11-10'),
    },
  ]);

  const handleCreateProject = async (project: Partial<ResearchProject>) => {
    // Placeholder: Real implementation would POST to /api/ai/research/projects
    const newProject: ResearchProject = {
      id: `rp-${Date.now()}`,
      name: project.name || '',
      type: project.type || 'Performance',
      complexity: project.complexity || 'Medium',
      status: 'InProgress',
      progress: 0,
      budgetAllocated: project.budgetAllocated || 100000,
      budgetSpent: 0,
      breakthroughs: 0,
      createdAt: new Date(),
    };
    setProjects([...projects, newProject]);
  };

  const handleAdvanceProgress = async (projectId: string) => {
    // Placeholder: Real implementation would POST to /api/ai/research/projects/[id]/progress
    setProjects(projects.map(p => 
      p.id === projectId 
        ? { ...p, progress: Math.min(p.progress + 10, 100), budgetSpent: p.budgetSpent + (p.budgetAllocated * 0.1) }
        : p
    ));
  };

  const handleCancelProject = async (projectId: string) => {
    // Placeholder: Real implementation would DELETE /api/ai/research/projects/[id]
    setProjects(projects.map(p => 
      p.id === projectId 
        ? { ...p, status: 'Cancelled' as const }
        : p
    ));
  };

  return (
    <div className="p-6">
      <ResearchProjectManager
        companyId="demo-company"
        projects={projects}
        onCreateProject={handleCreateProject}
        onAdvanceProgress={handleAdvanceProgress}
        onCancelProject={handleCancelProject}
      />
    </div>
  );
}
