'use client';

import FideCalculator from '@/components/FideCalculator';
import RatingTypeNav from '@/components/RatingTypeNav';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-1 md:p-5">
        {/* Navigation */}
        <div className="mb-6">
          <RatingTypeNav />
        </div>
        
        {/* Calculator for Standard rating type */}
        <FideCalculator type="standard" />
      </div>
    </div>
  );
}
