import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, Paperclip, User } from 'lucide-react';
import { Ticket, Priority } from '@/utils/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (ticketId: string) => void;
  onClick?: (ticket: Ticket) => void;
}

const priorityStyles: Record<Priority, string> = {
  High: 'bg-priority-high text-white',
  Medium: 'bg-priority-medium text-foreground',
  Low: 'bg-priority-low text-white',
};

const statusStyles: Record<string, string> = {
  'To Do': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-primary/10 text-primary',
  'Review': 'bg-warning/20 text-warning',
  'Done': 'bg-success/20 text-success',
};

export const TicketCard = ({
  ticket,
  isDragging,
  isSelected,
  onSelect,
  onClick,
}: TicketCardProps) => {
  const dueDate = new Date(ticket.dueDate);
  const isOverdue = dueDate < new Date() && ticket.status !== 'Done';
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'group relative cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:border-primary/40',
        isDragging && 'opacity-50 scale-105 shadow-xl rotate-1 cursor-grabbing',
        isSelected && 'ring-1 ring-primary border-primary bg-primary/5'
      )}
      onClick={() => onClick?.(ticket)}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div
          className={cn(
            "absolute -left-2 -top-2 transition-opacity z-10",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(ticket.id);
          }}
        >
          <Checkbox
            checked={isSelected}
            className="h-5 w-5 bg-card border-muted-foreground/40 shadow-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      )}

      {/* Header - ID and Priority */}
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {ticket.id}
        </span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium border',
            ticket.priority === 'High' && 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
            ticket.priority === 'Medium' && 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
            ticket.priority === 'Low' && 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
          )}
        >
          {ticket.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="mb-2 text-sm font-semibold leading-relaxed text-foreground line-clamp-2 group-hover:text-primary transition-colors">
        {ticket.title}
      </h4>

      {/* Tags */}
      {ticket.labels.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {ticket.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="rounded bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground border border-transparent"
            >
              {label}
            </span>
          ))}
          {ticket.labels.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{ticket.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {/* Assignee */}
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5 border border-background">
            <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
              {ticket.assignee.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
            {ticket.assignee.name.split(' ')[0]}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2.5">
          {(ticket.attachments > 0 || ticket.comments > 0) && (
            <div className="flex items-center gap-2 text-muted-foreground/70">
              {ticket.attachments > 0 && (
                <span className="flex items-center gap-0.5 text-[10px]">
                  <Paperclip className="h-3 w-3" />
                  {ticket.attachments}
                </span>
              )}
              {ticket.comments > 0 && (
                <span className="flex items-center gap-0.5 text-[10px]">
                  <MessageSquare className="h-3 w-3" />
                  {ticket.comments}
                </span>
              )}
            </div>
          )}

          <span
            className={cn(
              'flex items-center gap-1 text-[10px] font-medium transition-colors',
              isOverdue ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Draggable version
export const DraggableTicketCard = (props: TicketCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard {...props} isDragging={isDragging} />
    </div>
  );
};
