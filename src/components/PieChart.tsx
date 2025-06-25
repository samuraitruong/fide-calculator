import React from 'react';

interface PieChartProps {
  wins: number;
  draws: number;
  losses: number;
  size?: number;
}

export default function PieChart({ wins, draws, losses, size = 120 }: PieChartProps) {
  const total = wins + draws + losses;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-gray-400 text-sm">No data</div>
      </div>
    );
  }

  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;

  // Calculate angles
  const winAngle = (wins / total) * 2 * Math.PI;
  const drawAngle = (draws / total) * 2 * Math.PI;
  const lossAngle = (losses / total) * 2 * Math.PI;

  // Generate SVG path for each segment
  const createArc = (startAngle: number, endAngle: number) => {
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  let currentAngle = -Math.PI / 2; // Start from top

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mb-3">
        {/* Wins segment */}
        {wins > 0 && (
          <path
            d={createArc(currentAngle, currentAngle + winAngle)}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="2"
          />
        )}
        {wins > 0 && (currentAngle += winAngle)}

        {/* Draws segment */}
        {draws > 0 && (
          <path
            d={createArc(currentAngle, currentAngle + drawAngle)}
            fill="#6b7280"
            stroke="#ffffff"
            strokeWidth="2"
          />
        )}
        {draws > 0 && (currentAngle += drawAngle)}

        {/* Losses segment */}
        {losses > 0 && (
          <path
            d={createArc(currentAngle, currentAngle + lossAngle)}
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="2"
          />
        )}
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs">
        {wins > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Wins: {wins}</span>
          </div>
        )}
        {draws > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-gray-700">Draws: {draws}</span>
          </div>
        )}
        {losses > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Losses: {losses}</span>
          </div>
        )}
      </div>
    </div>
  );
} 