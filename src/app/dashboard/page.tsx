import ProjectList from './components/ProjectList';
import SuperUserToggle from './components/SuperUserToggle';

export default async function DashboardPage() {
	return (
		<main className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Projects</h1>
				<SuperUserToggle />
			</div>
			<ProjectList />
		</main>
	);
}


