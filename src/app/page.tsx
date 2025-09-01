'use client';

import FideCalculator from '@/components/FideCalculator';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-1 md:p-5">
        {/* Calculator for Standard rating type */}
        <FideCalculator type="standard" />
      </div>
    </div>
  );
}
