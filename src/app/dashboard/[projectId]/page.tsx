import TicketBoard from '../components/TicketBoard';

type Params = { params: { projectId: string } };

export default function ProjectPage({ params }: Params) {
	return (
		<main className="p-6 space-y-4">
			<h1 className="text-2xl font-semibold">Tickets</h1>
			<TicketBoard projectId={params.projectId} />
		</main>
	);
}


