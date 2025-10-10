"use client";
import { useState, useEffect } from 'react';
import { ChevronDown, Trash2, HelpCircle, FolderOpen, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

interface SidebarProps {
  selectedProject: string | null;
  onProjectSelect: (projectId: string) => void;
  refreshTrigger?: number; // Add this to trigger refresh when projects change
}

export default function Sidebar({ selectedProject, onProjectSelect, refreshTrigger }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showTeam, setShowTeam] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Load projects from API
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(() => setProjects([]));
  }, [refreshTrigger]);

  const handleDelete = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Show confirmation toast
    const userConfirmed = await new Promise((resolve) => {
      toast.custom((t) => (
        <div className="bg-white rounded-lg shadow-2xl p-4 w-96 border border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to delete <strong>&quot;{project.name}&quot;</strong>? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ), {
        duration: 10000,
        position: 'top-center',
      });
    });

    if (!userConfirmed) return;

    setDeletingId(project.id);
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      const updatedProjects = await fetch('/api/projects').then(res => res.json());
      setProjects(updatedProjects);
      
      toast.success('Project deleted successfully');
      
      if (selectedProject === project.id) {
        onProjectSelect('');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-50 to-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between group">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-base">C</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Cognito</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Projects Section */}
        <div className="mt-2">
          <button 
            onClick={() => setShowTeam(!showTeam)}
            className="flex items-center justify-between w-full text-gray-700 hover:bg-white rounded-lg p-2.5 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" />
              <span className="font-semibold text-sm">Projects</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-all ${showTeam ? 'rotate-180' : ''}`} />
          </button>
          
          {showTeam && (
            <div className="mt-2 space-y-1">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FolderOpen className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm text-center">No projects yet</p>
                  <p className="text-gray-400 text-xs text-center mt-1">
                    Create your first project to get started
                  </p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`group relative rounded-lg transition-all ${
                      selectedProject === project.id
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 shadow-sm'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div
                      onClick={() => onProjectSelect(project.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        selectedProject === project.id
                          ? 'text-purple-700'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedProject === project.id
                                ? 'bg-purple-500'
                                : 'bg-gray-300'
                            }`}
                          />
                          <span className="truncate">{project.name}</span>
                        </div>
                        <button
                          onClick={(e) => handleDelete(project, e)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(project, e as unknown as React.MouseEvent);
                            }
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all ${
                            deletingId === project.id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer'
                          }`}
                          title="Delete project"
                          aria-label={`Delete project ${project.name}`}
                        >
                          {deletingId === project.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {selectedProject === project.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-r-full" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
      {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button className="flex items-center space-x-3 text-gray-600 hover:text-purple-600 w-full p-2.5 rounded-lg hover:bg-purple-50 transition-all group">
            <div className="p-1 rounded-md bg-gray-100 group-hover:bg-purple-100 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Support</span>
          </button>
        </div>
        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translate(-50%, -12px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
          .animate-slideDown {
            animation: slideDown 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>
      </div>
  );
}