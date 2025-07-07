'use client';

import { notFound, useParams } from 'next/navigation';
import FideCalculator from '@/components/FideCalculator';
import RatingTypeNav from '@/components/RatingTypeNav';
import { RatingType } from '@/util/types';

export default function RatingTypePage() {
  const { type } = useParams<{ type: string }>();
  
  // Validate the rating type
  const validTypes: RatingType[] = ['standard', 'blitz', 'rapid'];
  if (!type || !validTypes.includes(type as RatingType)) {
    notFound();
  }

  const ratingType = type as RatingType;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-1 md:p-5">
        {/* Navigation */}
        <div className="mb-6">
          <RatingTypeNav />
        </div>
        
        {/* Calculator */}
        <FideCalculator type={ratingType} />
      </div>
    </div>
  );
} 