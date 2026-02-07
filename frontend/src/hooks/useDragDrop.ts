import { useState, useCallback } from 'react';
import { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { TicketStatus } from '@/utils/mockData';

interface UseDragDropOptions {
  onTicketMove: (ticketId: string, newStatus: TicketStatus) => void;
}

export const useDragDrop = ({ onTicketMove }: UseDragDropOptions) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const overId = over.id as string;
        
        // Check if dropping over a column
        const statusColumns: TicketStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
        if (statusColumns.includes(overId as TicketStatus)) {
          onTicketMove(active.id as string, overId as TicketStatus);
        }
      }

      setActiveId(null);
      setOverId(null);
    },
    [onTicketMove]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, []);

  return {
    activeId,
    overId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
};
