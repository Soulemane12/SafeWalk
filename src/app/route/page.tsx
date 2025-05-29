'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the Map component with no SSR
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

export default function RoutePage() {
  return (
    <div className="relative w-full h-screen">
      <Link
        href="/home"
        className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg hover:bg-white transition-colors duration-200 flex items-center space-x-2 text-gray-700"
      >
        <span>Back to Home</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
      <Map />
    </div>
  );
} 