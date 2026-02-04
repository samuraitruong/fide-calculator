import React, { useState, useRef } from 'react';
import { MonthlyData } from '@/util/types';
import { FaTimes, FaFilePdf, FaRegFilePdf } from 'react-icons/fa';
import PieChart from './PieChart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { generateNativePdf } from '@/util/pdfGenerator';

interface MonthlyViewProps {
  monthlyData: MonthlyData | null;
  onClose: () => void;
}

export default function MonthlyView({ 
  monthlyData, 
  onClose 
}: MonthlyViewProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!monthlyData) return null;

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    await new Promise((resolve) => setTimeout(resolve, 50)); // Let React update
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current, {
      backgroundColor: '#f3f4f6',
      scale: 2,
      useCORS: true
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight, undefined, 'FAST');
    pdf.save(`FIDE-${monthlyData.month.replace(/\s/g, '-')}.pdf`);
    setIsExportingPDF(false);
  };

  // Native jsPDF PDF export
  const handleNativePDF = () => {
    if (monthlyData) {
      // Convert MonthlyData to the format expected by generateNativePdf
      const backupData = {
        id: monthlyData.monthKey,
        month: monthlyData.month,
        data: monthlyData.results,
        gameCount: monthlyData.gameCount,
        totalChange: monthlyData.totalChange,
        createdAt: new Date().toISOString(),
        type: (monthlyData.results[0]?.ratingType || 'standard') as 'standard' | 'blitz' | 'rapid',
      };
      generateNativePdf(backupData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-none w-full max-w-full sm:rounded-xl sm:max-w-4xl shadow-xl max-h-[90vh] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Close"
        >
          <FaTimes />
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-gray-200 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">
            Your performance of {monthlyData.month}
          </h2>
          <div className="flex flex-row flex-wrap gap-2">
            <button
              onClick={handleDownloadPDF}
              className="hidden sm:inline-flex p-2 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
              title="Download PDF (screenshot)"
            >
              <FaFilePdf className="text-2xl" />
            </button>
            <button
              onClick={handleNativePDF}
              className="p-2 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
              title="Download Native PDF"
            >
              <FaRegFilePdf className="text-2xl" />
            </button>
          </div>
        </div>
        <div
          ref={contentRef}
          className={`pdf-export-root p-4 sm:p-6 ${isExportingPDF ? 'pdf-bg-light pdf-export-mode' : 'bg-white'} ${isExportingPDF ? '' : 'overflow-y-auto max-h-[calc(90vh-140px)]'}`}
        >
          {isExportingPDF && (
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Your performance of {monthlyData.month}
            </h2>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="pdf-bg-light p-4 rounded-lg shadow">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Games Played:</span>
                      <span className="font-medium text-gray-900">{monthlyData.gameCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Month:</span>
                      <span className="font-medium text-gray-900">{monthlyData.month}</span>
                    </div>
                  </div>
                </div>
                <div className="pdf-bg-light p-4 rounded-lg shadow flex items-center justify-center">
                  <PieChart
                    wins={monthlyData.results.filter(r => r.result === 'win').length}
                    draws={monthlyData.results.filter(r => r.result === 'draw').length}
                    losses={monthlyData.results.filter(r => r.result === 'loss').length}
                    size={100}
                  />
                </div>
                <div
                  className={`pdf-bg-light p-4 rounded-lg shadow flex items-center justify-center transition-colors duration-300 ${
                    !isExportingPDF
                      ? monthlyData.totalChange >= 0
                        ? 'bg-green-50'
                        : 'bg-red-50'
                      : ''
                  }`}
                >
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                      monthlyData.totalChange >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {monthlyData.totalChange >= 0 ? '+' : ''}{monthlyData.totalChange}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Your games</h3>
            <div className="block sm:hidden space-y-3">
              {monthlyData.results.map((game, index) => (
                <div key={game.id || index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-700">{game.date}</span>
                    <span className={`font-bold ${game.ratingChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>{game.ratingChange >= 0 ? '+' : ''}{game.ratingChange}</span>
                  </div>
                  <div className="text-gray-900 font-semibold truncate">{game.opponentName}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-base font-bold text-gray-800">{game.opponentRating}</span>
                    <span className={`font-bold text-xs px-2 py-1 rounded ${game.result === 'win' ? 'bg-green-100 text-green-800' : game.result === 'draw' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>{game.result.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 text-gray-800 font-medium">Date</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Opponent</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Opponent Rating</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Your Rating</th>
                    <th className="text-left p-2 text-gray-800 font-medium">K</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Result</th>
                    <th className="text-left p-2 text-gray-800 font-medium">RC</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.results.map((game, index) => (
                    <tr key={game.id || index} className="border-b border-gray-200">
                      <td className="p-2 text-gray-900">{game.date}</td>
                      <td className="p-2 text-gray-900">{game.opponentName}</td>
                      <td className="p-2 text-gray-900">{game.opponentRating}</td>
                      <td className="p-2 text-gray-900">{game.playerRating}</td>
                      <td className="p-2 text-gray-900">{game.kFactor}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          game.result === 'win' ? 'bg-green-100 text-green-800' :
                          game.result === 'draw' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {game.result.toUpperCase()}
                        </span>
                      </td>
                      <td className={`p-2 font-medium ${game.ratingChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {game.ratingChange >= 0 ? '+' : ''}{game.ratingChange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
