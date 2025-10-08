export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading content...</p>
      </div>
    </div>
  );
}
