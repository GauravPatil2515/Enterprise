import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Ticket, TicketStatus } from '@/utils/mockData';
import { DraggableTicketCard } from './TicketCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: TicketStatus;
  tickets: Ticket[];
  selectedTickets?: string[];
  onTicketSelect?: (ticketId: string) => void;
  onTicketClick?: (ticket: Ticket) => void;
  onAddTicket?: (status: TicketStatus) => void;
}

const columnStyles: Record<TicketStatus, { bg: string; border: string; header: string; indicator: string }> = {
  'To Do': {
    bg: 'bg-kanban-todo',
    border: 'border-border/50',
    header: 'text-muted-foreground',
    indicator: 'bg-slate-400',
  },
  'In Progress': {
    bg: 'bg-kanban-progress',
    border: 'border-blue-200/50 dark:border-blue-900/30',
    header: 'text-primary',
    indicator: 'bg-primary',
  },
  'Review': {
    bg: 'bg-kanban-review',
    border: 'border-amber-200/50 dark:border-amber-900/30',
    header: 'text-amber-600 dark:text-amber-500',
    indicator: 'bg-amber-500',
  },
  'Done': {
    bg: 'bg-kanban-done',
    border: 'border-emerald-200/50 dark:border-emerald-900/30',
    header: 'text-emerald-600 dark:text-emerald-500',
    indicator: 'bg-emerald-500',
  },
};

export const KanbanColumn = ({
  status,
  tickets,
  selectedTickets = [],
  onTicketSelect,
  onTicketClick,
  onAddTicket,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const styles = columnStyles[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col rounded-xl border p-2 min-h-[500px] transition-colors duration-200',
        styles.bg,
        styles.border,
        isOver && 'ring-2 ring-primary/20 ring-offset-0 bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div className="mb-3 px-2 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", styles.indicator)} />
          <h3 className={cn('text-[13px] font-semibold uppercase tracking-wider', styles.header)}>
            {status}
          </h3>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-background/50 px-1.5 text-[10px] font-medium text-muted-foreground border border-border/50">
            {tickets.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => onAddTicket?.(status)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tickets */}
      <div
        ref={setNodeRef}
        className="flex-1 px-1 space-y-2.5 overflow-y-auto scrollbar-thin"
      >
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tickets.map((ticket) => (
            <DraggableTicketCard
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedTickets.includes(ticket.id)}
              onSelect={onTicketSelect}
              onClick={onTicketClick}
            />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-muted-foreground/10 text-xs text-muted-foreground/50 bg-background/20">
            No tickets
          </div>
        )}
      </div>
    </motion.div>
  );
};
