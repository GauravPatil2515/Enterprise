/**
 * EngineerDashboard — Kanban-centric view for engineers.
 * Shows their projects, tickets, and progress.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Code2,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useTeams } from '@/context/TeamsContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  'To Do': 'bg-slate-500',
  'In Progress': 'bg-blue-500',
  Review: 'bg-amber-500',
  Done: 'bg-green-500',
};

const priorityColors: Record<string, string> = {
  High: 'text-red-400',
  Medium: 'text-amber-400',
  Low: 'text-green-400',
};

const EngineerDashboard = () => {
  const { state, getAllProjects, getAllTickets } = useTeams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const projects = getAllProjects();
  const tickets = getAllTickets();
  const activeTickets = tickets.filter((t) => t.status !== 'Done');
  const myInProgress = tickets.filter((t) => t.status === 'In Progress');

  // Group tickets by status for mini-kanban
  const statusGroups = ['To Do', 'In Progress', 'Review', 'Done'] as const;
  const grouped = statusGroups.map((s) => ({
    status: s,
    tickets: tickets.filter((t) => t.status === s),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 text-white shadow">
          <Code2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Engineer Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your projects and tickets at a glance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tickets', value: activeTickets.length, icon: <FolderKanban className="h-4 w-4" />, color: 'text-blue-400' },
          { label: 'In Progress', value: myInProgress.length, icon: <Clock className="h-4 w-4" />, color: 'text-amber-400' },
          { label: 'Completed', value: tickets.length - activeTickets.length, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-400' },
          { label: 'High Priority', value: activeTickets.filter((t) => t.priority === 'High').length, icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4">
            <div className={cn('flex items-center gap-2 text-sm mb-1', stat.color)}>
              {stat.icon}
              {stat.label}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Mini Kanban */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Ticket Board</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {grouped.map((col) => (
            <div key={col.status} className="rounded-xl border bg-card/50 p-3 min-h-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn('h-2 w-2 rounded-full', statusColors[col.status])} />
                <span className="text-sm font-medium">{col.status}</span>
                <span className="text-xs text-muted-foreground ml-auto">{col.tickets.length}</span>
              </div>
              <div className="space-y-2">
                {col.tickets.slice(0, 5).map((tk) => (
                  <div key={tk.id} className="rounded-lg border bg-card p-2.5 text-sm">
                    <p className="font-medium truncate">{tk.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{tk.id}</span>
                      <span className={cn('text-xs font-medium', priorityColors[tk.priority])}>{tk.priority}</span>
                    </div>
                  </div>
                ))}
                {col.tickets.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">+{col.tickets.length - 5} more</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const team = state.teams.find((t) => t.projects.some((p) => p.id === proj.id));
            return (
              <Link
                key={proj.id}
                to={`/project/${team?.id || 't1'}/${proj.id}`}
                className="rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{proj.name}</h3>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{proj.description}</p>
                <Progress value={proj.progress} className="h-1.5 mb-1" />
                <p className="text-xs text-muted-foreground">{proj.progress}% complete</p>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default EngineerDashboard;
