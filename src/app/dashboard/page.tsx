"use client";
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import SuperUserToggle from './components/SuperUserToggle';
import LogoutButton from './components/LogoutButton';
import NotificationBell from './components/NotificationBell';
import Loading from '@/app/loading';

export default function DashboardPage() {
  const [, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0].id);
        }
      })
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }, [selectedProject]); // Add selectedProject to dependency array

  async function createProject() {
    if (!newProjectName.trim() || creatingProject) return;
    
    try {
      setCreatingProject(true);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName })
      });
      
      if (res.ok) {
        const project = await res.json();
        setProjects(prev => [project, ...prev]);
        setSelectedProject(project.id);
        setNewProjectName('');
        setShowNewProjectForm(false);
        setRefreshTrigger(prev => prev + 1); // Trigger sidebar refresh
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreatingProject(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        selectedProject={selectedProject} 
        onProjectSelect={setSelectedProject}
        refreshTrigger={refreshTrigger}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-full">
            <div className="flex-shrink-0">
              <SuperUserToggle />
            </div>
            
            <div className="flex items-center space-x-3 ml-auto">
            {!showNewProjectForm && (
                <button
                  onClick={() => setShowNewProjectForm(true)}
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap hover:scale-105"
                >
                  <svg 
                    className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 4v16m8-8H4" 
                    />
                  </svg>
                  New Project
                </button>
              )}
              <div className="flex-shrink-0">
                <NotificationBell projectId={selectedProject ?? undefined} />
              </div>
              <div className="flex-shrink-0">
                <LogoutButton />
              </div>
            </div>
          </div>
          
          {/* New Project Form Card */}
          {showNewProjectForm && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={() => {
                setShowNewProjectForm(false);
                setNewProjectName('');
              }}
            >
              <div 
                className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        New Project
                      </h2>
                      <p className="text-sm text-gray-500">Create a new project workspace</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowNewProjectForm(false);
                      setNewProjectName('');
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Form */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter project name..."
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-gray-800 placeholder:text-gray-400"
                        onKeyPress={(e) => e.key === 'Enter' && createProject()}
                        autoFocus
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowNewProjectForm(false);
                        setNewProjectName('');
                      }}
                      className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium border-2 border-transparent hover:border-gray-300"
                    >
                      Cancel
                    </button>
                      <button
                        onClick={createProject}
                        disabled={!newProjectName.trim() || creatingProject}
                        className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2 group"
                      >
                        {creatingProject ? (
                          <>
                            <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                            Creating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Create Project
                          </>
                        )}
                      </button>
                  </div>
                </div>

                {/* Keyboard Hint */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200 font-mono">Enter</kbd>
                  <span>to create</span>
                  <span className="mx-1">•</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200 font-mono">Esc</kbd>
                  <span>to cancel</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        {projectsLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loading /></div>
        ) : selectedProject ? (
          <KanbanBoard projectId={selectedProject} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-500 mb-4">Create a new project to get started</p>
              <button
                onClick={() => setShowNewProjectForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


