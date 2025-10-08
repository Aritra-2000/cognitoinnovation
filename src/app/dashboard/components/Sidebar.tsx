"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    // Load projects from API
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(() => setProjects([]));
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  return (
    <div className="w-56 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-900">Cognito</span>
            <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        {/* Team */}
        <div className="mt-4">
          <button 
            onClick={() => setShowTeam(!showTeam)}
            className="flex items-center justify-between w-full text-gray-700 hover:bg-gray-100 rounded-lg p-2"
          >
            <span className="font-medium">Projects</span>
            <svg className={`w-4 h-4 transition-transform ${showTeam ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTeam && (
            <div className="ml-4 mt-2 space-y-1">
              {projects.length === 0 ? (
                <div className="text-gray-500 text-sm p-2">No projects yet</div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="group flex items-center justify-between">
                    <button 
                      onClick={() => onProjectSelect(project.id)}
                      className={`flex-1 text-left p-2 rounded-lg text-sm ${
                        selectedProject === project.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {project.name}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        
                        // Show confirmation toast
                        const userConfirmed = await new Promise<boolean>((resolve) => {
                          toast.custom((t) => (
                            <div className="bg-white rounded-lg shadow-lg p-4 w-80">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
                                  <p className="text-sm text-gray-500">
                                    Are you sure you want to delete "{project.name}"? This action cannot be undone.
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end space-x-3">
                                <button
                                  onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(false);
                                  }}
                                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/projects/${project.id}`, {
                                        method: 'DELETE',
                                      });
                                      
                                      if (!response.ok) {
                                        throw new Error('Failed to delete project');
                                      }
                                      
                                      // Refresh the projects list
                                      const updatedProjects = await fetch('/api/projects').then(res => res.json());
                                      setProjects(updatedProjects);
                                      toast.success('Project deleted successfully');
                                      
                                      // If the deleted project was selected, clear the selection
                                      if (selectedProject === project.id) {
                                        onProjectSelect('');
                                      }
                                      
                                      toast.dismiss(t.id);
                                      resolve(true);
                                    } catch (error) {
                                      console.error('Error deleting project:', error);
                                      toast.error('Failed to delete project');
                                      toast.dismiss(t.id);
                                      resolve(false);
                                    }
                                  }}
                                  className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ), {
                            duration: 10000, // 10 seconds
                            position: 'top-center',
                          });
                        });

                        if (!userConfirmed) return;
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                      title="Delete project"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/support" className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
          </svg>
          <span className="text-sm">Support</span>
        </Link>
      </div>
    </div>
  );
}
