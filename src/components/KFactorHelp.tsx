import React from 'react';

const KFactorHelp: React.FC = () => (
  <div>
    {/* Hidden legacy notes for future use or reference */}
    <div className='hidden'><b>Rating</b> - Rating of a player.</div>
    <div className='hidden'><b>Rc</b> - Opponent rating.</div>
    <div className='hidden'><b>W</b> - Score.</div>
    <div><b>K val</b> - K is the development coefficient.</div>
    <ul className="list-disc pl-5 mt-2 space-y-1">
      <li>K = 40 for a player new to the rating list until he has completed events with at least 30 games</li>
      <li>K = 33 for Rapid ratings.</li>
      <li>K = 20 as long as a player&apos;s rating remains under 2400 (Standard/Blitz).</li>
      <li>K = 10 once a player&apos;s published rating has reached 2400 and remains at that level subsequently.</li>
      <li>K = 40 for players under 18 with rating under 2300.</li>
    </ul>
  </div>
);

export default KFactorHelp;
