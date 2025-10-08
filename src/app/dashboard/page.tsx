"use client";
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import SuperUserToggle from './components/SuperUserToggle';
import LogoutButton from './components/LogoutButton';
import NotificationBell from './components/NotificationBell';

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0].id);
        }
      })
      .catch(() => setProjects([]));
  }, []);

  async function createProject() {
    if (!newProjectName.trim()) return;
    
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
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                >
                  + New Project
                </button>
              )}
              <div className="flex-shrink-0">
                <NotificationBell />
              </div>
              <div className="flex-shrink-0">
                <LogoutButton />
              </div>
            </div>
          </div>
          
          {/* New Project Form */}
          {showNewProjectForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 p-2 border rounded"
                  onKeyPress={(e) => e.key === 'Enter' && createProject()}
                />
                <button
                  onClick={createProject}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewProjectForm(false);
                    setNewProjectName('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        {selectedProject ? (
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


