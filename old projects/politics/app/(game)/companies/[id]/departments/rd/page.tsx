/**
 * @file app/(game)/companies/[id]/departments/rd/page.tsx
 * @description R&D department dashboard with projects
 * @created 2025-11-13
 */

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ProjectCard from '@/components/departments/ProjectCard';

interface Project {
  _id: string;
  name: string;
  projectType: string;
  status: string;
  phase: string;
  priority: string;
  budget: number;
  spent: number;
  progress: number;
  innovationScore: number;
  technologyLevel: number;
  breakthroughPotential: number;
  breakthroughAchieved: boolean;
  patentsPending: number;
  patentsGranted: number;
  monthsRemaining: number;
}

export default function RDDepartmentPage({ params }: { params: { id: string } }) {
  const { id: companyId } = params;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [innovationScore, setInnovationScore] = useState(0);
  const [technologyLevel, setTechnologyLevel] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [patentsOwned, setPatentsOwned] = useState(0);

  useEffect(() => {
    fetchRDData();
  }, [companyId]);

  const fetchRDData = async () => {
    try {
      const [projectsRes, deptRes] = await Promise.all([
        fetch(`/api/departments/rd/projects?companyId=${companyId}`),
        fetch(`/api/departments?companyId=${companyId}&type=rd`),
      ]);

      if (!projectsRes.ok || !deptRes.ok) throw new Error('Failed to fetch R&D data');

      const projectsData = await projectsRes.json();
      const deptData = await deptRes.json();

      setProjects(projectsData.projects || []);
      setActiveProjects(projectsData.activeProjects || 0);

      const rdDept = deptData.departments?.[0];
      if (rdDept) {
        setInnovationScore(rdDept.innovationScore || 0);
        setTechnologyLevel(rdDept.technologyLevel || 0);
        setPatentsOwned(rdDept.patentsOwned || 0);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch R&D data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading R&D department...</div>
      </div>
    );
  }

  const breakthroughs = projects.filter(p => p.breakthroughAchieved).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔬 R&D Department</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Innovate and develop breakthrough technologies
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Innovation Score</p>
          <p className="text-3xl font-bold">{innovationScore}/100</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Technology Level</p>
          <p className="text-3xl font-bold">{technologyLevel}/10</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Projects</p>
          <p className="text-3xl font-bold">{activeProjects}</p>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            {breakthroughs} breakthroughs
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Patents Owned</p>
          <p className="text-3xl font-bold">{patentsOwned}</p>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            +{projects.reduce((sum, p) => sum + p.patentsPending, 0)} pending
          </p>
        </div>
      </div>

      {/* Research Pipeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Research Pipeline</h2>
        <div className="flex gap-4">
          {['Concept', 'Research', 'Development', 'Testing', 'Commercialization'].map((phase) => {
            const count = projects.filter(p => p.phase === phase).length;
            return (
              <div key={phase} className="flex-1 text-center">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{phase}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Research Projects</h2>
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded transition-colors"
            onClick={() => toast.info('Start project feature coming soon')}
          >
            + Start Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No research projects yet</p>
            <p className="text-sm">Start your first R&D project to innovate</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} onUpdate={fetchRDData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
