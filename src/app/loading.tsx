export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="p-8 rounded-2xl bg-white shadow-xl border border-gray-100">
        <div className="text-center">
          {/* Enhanced spinner with gradient */}
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-blue-600 border-l-blue-600 animate-spin"></div>
          </div>

          {/* Loading text with bouncing dots */}
          <div className="flex justify-center items-center space-x-2">
            <span className="text-gray-700 text-lg font-medium">Loading</span>
            <div className="flex space-x-1">
              <span className="block w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="block w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="block w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>

          {/* Optional subtitle */}
          <p className="text-gray-500 text-sm mt-3">
            Please wait while we fetch your data
        </p>
      </div>
    </div>
    </div>
  );
}