import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Ticket } from '@/utils/mockData';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  tickets: Ticket[];
  onClose: () => void;
}

interface DiffResult {
  type: 'same' | 'different';
  values: string[];
}

const fields: { key: keyof Ticket | 'assigneeName'; label: string }[] = [
  { key: 'id', label: 'Ticket ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'assigneeName', label: 'Assignee' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'labels', label: 'Labels' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'comments', label: 'Comments' },
];

export const ComparisonTable = ({ tickets, onClose }: ComparisonTableProps) => {
  const comparison = useMemo(() => {
    return fields.map((field) => {
      const values = tickets.map((ticket) => {
        if (field.key === 'assigneeName') {
          return ticket.assignee.name;
        }
        if (field.key === 'labels') {
          return (ticket[field.key] as string[]).join(', ');
        }
        return String(ticket[field.key as keyof Ticket]);
      });

      const allSame = values.every((v) => v === values[0]);

      return {
        field: field.label,
        type: allSame ? 'same' : 'different',
        values,
      } as { field: string } & DiffResult;
    });
  }, [tickets]);

  const exportToCSV = () => {
    const headers = ['Field', ...tickets.map((t) => t.id)];
    const rows = comparison.map((c) => [c.field, ...c.values]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ticket-comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl bg-card shadow-atlassian-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-semibold">Compare Tickets</h2>
            <p className="text-sm text-muted-foreground">
              Comparing {tickets.length} tickets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Ticket Headers */}
        <div className="grid border-b border-border bg-muted/50" style={{ gridTemplateColumns: `200px repeat(${tickets.length}, 1fr)` }}>
          <div className="p-3 font-medium text-muted-foreground">Field</div>
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center gap-2 border-l border-border p-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={ticket.assignee.avatar} />
                <AvatarFallback>{ticket.assignee.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{ticket.id}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {ticket.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Rows */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {comparison.map((row, idx) => (
            <div
              key={row.field}
              className={cn(
                'grid border-b border-border',
                idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'
              )}
              style={{ gridTemplateColumns: `200px repeat(${tickets.length}, 1fr)` }}
            >
              <div className="p-3 font-medium text-foreground">{row.field}</div>
              {row.values.map((value, vIdx) => {
                const isDifferent = row.type === 'different';
                const prevValue = vIdx > 0 ? row.values[vIdx - 1] : value;
                const hasChanged = isDifferent && value !== prevValue;

                return (
                  <div
                    key={vIdx}
                    className={cn(
                      'border-l border-border p-3 text-sm',
                      isDifferent && 'diff-changed',
                      !isDifferent && 'diff-added'
                    )}
                  >
                    <span className={cn(hasChanged && 'font-medium')}>
                      {value || <span className="text-muted-foreground italic">Empty</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
