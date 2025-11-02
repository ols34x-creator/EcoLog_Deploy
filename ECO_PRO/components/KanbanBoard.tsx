
import React, { useState } from 'react';
import { Demand, DemandStatus } from '../types';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  demands: Demand[];
  setDemands: React.Dispatch<React.SetStateAction<Demand[]>>;
  onCardClick: (demand: Demand) => void;
  onAddDemand: (status: DemandStatus) => void;
  columnTitles: Record<DemandStatus, string>;
  onUpdateColumnTitle: (status: DemandStatus, newTitle: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ demands, setDemands, onCardClick, onAddDemand, columnTitles, onUpdateColumnTitle }) => {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggingCardId(id);
    e.currentTarget.classList.add('opacity-50', 'rotate-3');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'rotate-3');
    setDraggingCardId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: DemandStatus) => {
    e.preventDefault();
    if (!draggingCardId) return;

    setDemands(prevDemands => {
      const card = prevDemands.find(d => d.id === draggingCardId);
      if (card && card.status !== newStatus) {
        return prevDemands.map(d => (d.id === draggingCardId ? { ...d, status: newStatus } : d));
      }
      return prevDemands;
    });
  };

  const columns = Object.keys(columnTitles) as DemandStatus[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-5 flex-grow overflow-x-auto h-full">
      {columns.map(status => (
        <KanbanColumn
          key={status}
          title={columnTitles[status]}
          status={status}
          demands={demands.filter(d => d.status === status)}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
          onCardClick={onCardClick}
          onAddDemand={onAddDemand}
          onUpdateColumnTitle={onUpdateColumnTitle}
        />
      ))}
    </div>
  );
};

export default KanbanBoard;
