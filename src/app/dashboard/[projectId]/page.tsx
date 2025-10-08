"use client";
import { useRouter } from 'next/navigation';
import TicketBoard from '../components/TicketBoard';
import { toast } from 'react-hot-toast';

type Params = { params: { projectId: string } };

export default function ProjectPage({ params }: Params) {
  const router = useRouter();

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${params.projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast.success('Project deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Project Board</h1>
        <button
          onClick={handleDeleteProject}
          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          title="Delete Project"
        >
          Delete Project
        </button>
      </div>
      <TicketBoard projectId={params.projectId} />
    </main>
  );
}


