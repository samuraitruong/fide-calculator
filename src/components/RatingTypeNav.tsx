'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RatingType } from '@/util/types';
import { FaChess, FaBolt, FaClock } from 'react-icons/fa';

interface RatingTypeNavProps {
  className?: string;
}

export default function RatingTypeNav({ className = '' }: RatingTypeNavProps) {
  const pathname = usePathname();
  
  const ratingTypes: { type: RatingType; name: string; icon: React.ReactNode; description: string }[] = [
    {
      type: 'standard',
      name: 'Standard',
      icon: <FaChess className="text-2xl md:text-3xl" />,
      description: 'Classical time control'
    },
    {
      type: 'rapid',
      name: 'Rapid',
      icon: <FaClock className="text-2xl md:text-3xl" />,
      description: '15+10 time control'
    },
    {
      type: 'blitz',
      name: 'Blitz',
      icon: <FaBolt className="text-2xl md:text-3xl" />,
      description: '3+2 time control'
    }
  ];

  const getCurrentType = (): RatingType => {
    if (pathname.includes('/blitz')) return 'blitz';
    if (pathname.includes('/rapid')) return 'rapid';
    return 'standard';
  };

  const currentType = getCurrentType();

  return (
    <div className={`bg-white md:rounded-xl shadow-lg p-2 md:p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-800 mb-2 md:mb-4 text-center hidden md:block">Rating Types</h2>
      <div className="flex justify-evenly md:grid md:grid-cols-3 gap-0 md:gap-3">
        {ratingTypes.map(({ type, name, icon, description }) => {
          const isActive = currentType === type;
          const href = type === 'standard' ? '/' : `/${type}`;
          
          return (
            <Link
              key={type}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center p-2 md:p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
              }`}
              title={name}
            >
              <div className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</div>
              {/* Hide text on mobile, show on md+ */}
              <div className="hidden md:block text-center">
                <h3 className={`font-semibold ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>{name}</h3>
                <p className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 