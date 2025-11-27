/**
 * @file components/departments/ProjectCard.tsx
 * @description R&D project display card
 * @created 2025-11-13
 */

'use client';

interface ProjectCardProps {
  project: {
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
  };
  onUpdate: () => void;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Research':
      case 'Development':
      case 'Testing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Concept':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'OnHold':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
      case 'High':
        return 'text-red-500';
      case 'Medium':
        return 'text-yellow-500';
      case 'Low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ProductInnovation': return '💡';
      case 'ProcessImprovement': return '⚙️';
      case 'TechnologyResearch': return '🔬';
      case 'PatentDevelopment': return '📜';
      case 'MarketResearch': return '📊';
      case 'Sustainability': return '🌱';
      case 'AI/ML': return '🤖';
      default: return '🔬';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>{getTypeIcon(project.projectType)}</span>
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">{project.projectType}</span>
            <span className={`text-xs font-semibold ${getPriorityColor(project.priority)}`}>
              • {project.priority}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Breakthrough Badge */}
      {project.breakthroughAchieved && (
        <div className="mb-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded border border-yellow-300 dark:border-yellow-700">
          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">
            🎉 Breakthrough Achieved!
          </p>
        </div>
      )}

      {/* Budget & Innovation */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Budget</p>
          <p className="font-semibold">${project.budget.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            Spent: ${project.spent.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Innovation Score</p>
          <p className="text-lg font-bold text-orange-500">
            {project.innovationScore}/100
          </p>
        </div>
      </div>

      {/* Technical Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Tech Level</p>
          <p className="text-sm font-semibold">{project.technologyLevel}/10</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Breakthrough Potential</p>
          <p className="text-sm font-semibold">{project.breakthroughPotential.toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Patents Granted</p>
          <p className="text-sm font-semibold">{project.patentsGranted}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Patents Pending</p>
          <p className="text-sm font-semibold">{project.patentsPending}</p>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Phase: {project.phase}</span>
          <span className="text-xs font-semibold">{project.progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      {project.monthsRemaining > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Estimated Completion</p>
          <p className="text-sm font-semibold">
            {project.monthsRemaining} month{project.monthsRemaining !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}
    </div>
  );
}
