"use client";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-20 h-20 border-8 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">
          🍳
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">{message}</p>
    </div>
  );
}
