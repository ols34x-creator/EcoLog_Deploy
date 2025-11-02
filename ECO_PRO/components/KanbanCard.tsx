
import React from 'react';
import { Demand } from '../types';

interface KanbanCardProps {
  demand: Demand;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onCardClick: (demand: Demand) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ demand, handleDragStart, handleDragEnd, onCardClick }) => {
  return (
    <div
      className="bg-bg-card p-4 rounded-lg mb-2.5 border-l-4 border-gray-400 cursor-pointer transition-all duration-200 ease-in-out shadow-md hover:shadow-xl hover:-translate-y-0.5"
      draggable
      onDragStart={(e) => handleDragStart(e, demand.id)}
      onDragEnd={handleDragEnd}
      onClick={() => onCardClick(demand)}
      data-id={demand.id}
    >
      <h4 className="text-lg font-bold mb-1 text-light">{demand.client}</h4>
      <p className="text-sm mb-2.5 text-gray-text break-words">{demand.service}</p>
      <div className="text-xs text-gray-text flex justify-between items-center">
        <span><i className="fas fa-calendar-alt mr-1"></i> {demand.date}</span>
        <span className="font-bold bg-black/20 px-1.5 py-0.5 rounded">{demand.id}</span>
      </div>
    </div>
  );
};

export default KanbanCard;