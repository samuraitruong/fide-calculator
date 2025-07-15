import Confirm from '@/components/Confirm';
import ImportExport from '@/components/ImportExport';
import { Result } from '@/util/types';
import { roundNumber } from '@/util/util';
import { useState, useEffect, useRef } from 'react';
import EditDateButton from './EditDateButton';
import { FaArrowUp, FaArrowDown, FaMinus, FaTrashAlt } from 'react-icons/fa';

// Add react-dnd imports
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { DropTargetMonitor } from 'react-dnd';
import BackupList from '@/components/BackupList';
import { BackupData } from '@/hooks/useBackup';
import PlayerInfoModal from './PlayerInfoModal';
import { usePlayerInfo } from '@/hooks/usePlayerInfo';

interface DragItem {
  index: number;
  type: string;
}

interface ListRatingChangeProps {
  results: Result[];
  onRemove: (index: number) => void;
  onSelect?: (result: Result, index: number) => void;
  onUpdateDate?: (index: number, date: string) => void;
  onReorder?: (newResults: Result[]) => void;
  backups?: BackupData[];
  onViewBackup?: (backup: BackupData) => void;
  onCreateBackup?: () => void;
  onReset?: () => void;
}

// Draggable row component
const DraggableRow = ({
  result,
  index,
  moveRow,
  onSelect,
  onUpdateDate,
  handleRemoveClick,
  hoveredIndex,
  setHoveredIndex,
  onOpponentNameClick
}: {
  result: Result;
  index: number;
  moveRow: (from: number, to: number) => void;
  onSelect?: (result: Result, index: number) => void;
  onUpdateDate?: (index: number, date: string) => void;
  handleRemoveClick: (index: number) => void;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  onOpponentNameClick: (name: string) => void;
}) => {
  const ref = useRef<HTMLTableRowElement>(null);
  const [, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: 'row',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hover(item: DragItem, _: DropTargetMonitor<DragItem, void>) {
      if (item.index === index) return;
      moveRow(item.index, index);
      item.index = index;
      setHoveredIndex(index);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'row',
    item: { index, type: 'row' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => setHoveredIndex(null),
  });
  drag(drop(ref));
  return (
    <tr
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
      className={`hover:bg-gray-50 cursor-pointer ${hoveredIndex === index ? 'ring-2 ring-blue-400' : ''}`}
      onClick={() => onSelect && onSelect(result, index)}
    >
      <td className="border border-gray-200 p-3 text-sm text-gray-700 cursor-move print:hidden" style={{ width: 24 }}>
        <span title="Drag to reorder" className="cursor-move">☰</span>
      </td>
      {/* Date cell */}
      <td className="border border-gray-200 p-3 text-sm text-gray-700 flex items-center gap-2 group">
        <span>{result.date}</span>
        {onUpdateDate && (
          <span style={{ zIndex: 10, position: 'relative' }}>
            <EditDateButton
              date={result.date}
              onChange={(date: string) => onUpdateDate(index, date)}
            />
          </span>
        )}
      </td>
      <td className="border border-gray-200 p-3 text-sm text-gray-700">{result.playerRating}</td>
      <td className="border border-gray-200 p-3 text-sm text-blue-700 underline cursor-pointer hover:text-blue-900" onClick={() => onOpponentNameClick(result.opponentName)}>{result.opponentName}</td>
      <td className="border border-gray-200 p-3 text-sm text-gray-700">{result.opponentRating}</td>
      <td className="border border-gray-200 p-3 text-sm text-gray-700">{result.kFactor}</td>
      <td className="border border-gray-200 p-3 text-sm text-gray-700 capitalize">{result.result}</td>
      <td className="border border-gray-200 p-3 text-sm text-gray-700">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            {result.ratingChange > 0 && <FaArrowUp className="text-green-600" />}
            {result.ratingChange < 0 && <FaArrowDown className="text-red-600" />}
            {result.ratingChange === 0 && <FaMinus className="text-gray-400" />}
            <span className={result.ratingChange > 0 ? 'text-green-600' : result.ratingChange < 0 ? 'text-red-600' : 'text-gray-600'}>
              {Math.abs(result.ratingChange)}
            </span>
          </span>
          <button
            onClick={e => { e.stopPropagation(); handleRemoveClick(index); }}
            className="text-red-600 hover:text-red-800 ml-4 print:hidden"
            title="Delete entry"
          >
            <FaTrashAlt />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function ListRatingChange({ results, onRemove, onSelect, onUpdateDate, onReorder, backups, onViewBackup, onCreateBackup, onReset }: ListRatingChangeProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [tableData, setTableData] = useState(results);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const totalChange = roundNumber(results.reduce((acc, curr) => acc + curr.ratingChange, 0));
  const [playerInfoModalOpen, setPlayerInfoModalOpen] = useState(false);
  const [modalPlayerName, setModalPlayerName] = useState<string>('');
  const {
    playerInfo,
    loading: playerInfoLoading,
    error: playerInfoError,
  } = usePlayerInfo(modalPlayerName, 'standard');

  // Keep tableData in sync with results
  useEffect(() => { setTableData(results); }, [results]);

  // Update usePlayerInfo when modalPlayerName changes by triggering refetch
  useEffect(() => {
    if (modalPlayerName && playerInfoModalOpen) {
      // Trigger refetch when modal opens with a new name
      const windowWithRefetch = window as Window & { playerInfoRefetch?: () => void };
      if (typeof windowWithRefetch.playerInfoRefetch === 'function') {
        windowWithRefetch.playerInfoRefetch();
      }
    }
  }, [modalPlayerName, playerInfoModalOpen]);

  const handleRemoveClick = (index: number) => {
    setPendingRemove(index);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (pendingRemove !== null) {
      onRemove(pendingRemove);
    }
    setConfirmOpen(false);
    setPendingRemove(null);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    setPendingRemove(null);
  };

  const moveRow = (from: number, to: number) => {
    const updated = [...tableData];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setTableData(updated);
    if (onReorder) onReorder(updated);
  };

  const handleOpponentNameClick = (name: string) => {
    setModalPlayerName(name);
    setPlayerInfoModalOpen(true);
  };

  // Handle import callback
  const handleImport = (imported: Result[]) => {
    const merged = [...results, ...imported];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('importedResults', { detail: merged }));
    }
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="w-full mt-5 md:mt-8 bg-white rounded-xl shadow-lg p-3 md:p-8 print:p-0 print:shadow-none print:border-0 print:rounded-none">
          <Confirm
            open={confirmOpen}
            title="Remove Rating Change"
            message="Are you sure you want to remove this rating change?"
            confirmText="Remove"
            cancelText="Cancel"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Rating changes</h2>
            <div className="flex items-center gap-2 print:hidden">
              <span className="text-3xl font-bold flex items-center gap-2">
                {totalChange > 0 && <FaArrowUp className="text-green-600" />}
                {totalChange < 0 && <FaArrowDown className="text-red-600" />}
                {totalChange === 0 && <FaMinus className="text-gray-400" />}
                <span className={totalChange > 0 ? 'text-green-600' : totalChange < 0 ? 'text-red-600' : 'text-gray-600'}>
                  {Math.abs(totalChange)}
                </span>
              </span>
            </div>
          </div>
          {/* Desktop/Tablet View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th style={{ width: 24 }} className='print:hidden'></th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Player Rating</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Opponent</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Opponent Rating</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">K-Factor</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Result</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Rating Change</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((result, index) => (
                  <DraggableRow
                    key={result.id || index}
                    result={result}
                    index={index}
                    moveRow={moveRow}
                    onSelect={onSelect}
                    onUpdateDate={onUpdateDate}
                    handleRemoveClick={handleRemoveClick}
                    hoveredIndex={hoveredIndex}
                    setHoveredIndex={setHoveredIndex}
                    onOpponentNameClick={handleOpponentNameClick}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded-lg space-y-2 text-black cursor-pointer"
                onClick={() => onSelect && onSelect(result, index)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-2 group">
                    {result.date}
                    {onUpdateDate && (
                      <span style={{ zIndex: 10, position: 'relative' }}>
                        <EditDateButton
                          date={result.date}
                          onChange={(date: string) => onUpdateDate(index, date)}
                        />
                      </span>
                    )}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleRemoveClick(index); }}
                    className="text-red-600 hover:text-red-800"
                    title="Delete entry"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-700 underline cursor-pointer hover:text-blue-900" onClick={e => { e.stopPropagation(); handleOpponentNameClick(result.opponentName); }}>YOU vs. {result.opponentName}</span>
                  <span className="text-sm capitalize">{result.result}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {result.playerRating} vs {result.opponentRating}
                  </span>
                  <span className={`text-lg font-medium ${result.ratingChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.ratingChange > 0 ? '+' : ''}{result.ratingChange}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <ImportExport 
            results={results} 
            onImport={handleImport}
            onCreateBackup={onCreateBackup}
            onReset={onReset}
          />
          
          {/* Backup List */}
          {backups && onViewBackup && (
            <div className="mt-6">
              <BackupList
                backups={backups}
                onView={onViewBackup}
              />
            </div>
          )}
        </div>
      </DndProvider>
      <PlayerInfoModal
        open={playerInfoModalOpen}
        onClose={() => setPlayerInfoModalOpen(false)}
        playerName={modalPlayerName}
        setPlayerName={() => {}} // setPlayerName is removed
        playerInfo={playerInfo}
        loading={playerInfoLoading}
        error={playerInfoError}
        onSave={() => setPlayerInfoModalOpen(false)}
        forceRefetchOnOpen={true}
        showSaveButton={false}
      />
    </>
  );
}



