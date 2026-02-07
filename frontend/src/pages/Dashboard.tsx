import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useTeams } from '@/context/TeamsContext';
import { SkeletonProjectCard } from '@/components/SkeletonLoaders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { state, getAllProjects, getAllTickets } = useTeams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const allProjects = getAllProjects();
  const allTickets = getAllTickets();

  // Stats
  const stats = {
    totalProjects: allProjects.length,
    totalTickets: allTickets.length,
    openTickets: allTickets.filter((t) => t.status !== 'Done').length,
    completedTickets: allTickets.filter((t) => t.status === 'Done').length,
    highPriority: allTickets.filter((t) => t.priority === 'High' && t.status !== 'Done').length,
    inProgress: allTickets.filter((t) => t.status === 'In Progress').length,
  };

  const recentTickets = allTickets
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (state.loading || loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your projects.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={FolderKanban}
          label="Total Projects"
          value={stats.totalProjects}
          trend="+2 this month"
          color="primary"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={stats.inProgress}
          trend={`${stats.openTickets} open total`}
          color="warning"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completedTickets}
          trend={`${Math.round((stats.completedTickets / stats.totalTickets) * 100)}% completion rate`}
          color="success"
        />
        <StatCard
          icon={AlertCircle}
          label="High Priority"
          value={stats.highPriority}
          trend="Needs attention"
          color="destructive"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects Overview */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Projects</h2>
            <Link
              to="/projects"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {allProjects
              .filter((p) => p.status === 'Ongoing')
              .slice(0, 4)
              .map((project) => {
                const team = state.teams.find((t) =>
                  t.projects.some((p) => p.id === project.id)
                );
                const doneCount = project.tickets.filter(
                  (t) => t.status === 'Done'
                ).length;
                const progress = project.tickets.length
                  ? Math.round((doneCount / project.tickets.length) * 100)
                  : 0;

                return (
                  <Link
                    key={project.id}
                    to={`/project/${team?.id}/${project.id}`}
                    className="group rounded-xl border bg-card p-5 transition-all card-hover"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{project.icon}</span>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {team?.name}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          project.status === 'Ongoing'
                            ? 'bg-primary/10 text-primary'
                            : project.status === 'Completed'
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {project.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex -space-x-2">
                        {project.tickets
                          .map((t) => t.assignee)
                          .filter(
                            (v, i, a) => a.findIndex((t) => t.id === v.id) === i
                          )
                          .slice(0, 4)
                          .map((member) => (
                            <Avatar
                              key={member.id}
                              className="h-7 w-7 border-2 border-card"
                            >
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {project.tickets.length} tickets
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  </Link>
                );
              })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Tickets</h2>

          <div className="rounded-xl border bg-card divide-y divide-border">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={ticket.assignee.avatar} />
                  <AvatarFallback className="text-xs">
                    {ticket.assignee.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.id} · {ticket.status}
                  </p>
                </div>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    ticket.priority === 'High'
                      ? 'bg-priority-high'
                      : ticket.priority === 'Medium'
                      ? 'bg-priority-medium'
                      : 'bg-priority-low'
                  )}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Teams Overview */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Teams</h2>
          <Link
            to="/teams"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.teams.map((team) => {
            const totalTickets = team.projects.flatMap((p) => p.tickets).length;
            const completedTickets = team.projects
              .flatMap((p) => p.tickets)
              .filter((t) => t.status === 'Done').length;

            return (
              <Link
                key={team.id}
                to="/teams"
                className="group rounded-xl border bg-card p-5 transition-all card-hover"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-semibold"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {team.projects.length} projects
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {team.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 4).map((member) => (
                      <Avatar
                        key={member.id}
                        className="h-7 w-7 border-2 border-card"
                      >
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs">
                          {member.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {team.members.length > 4 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                        +{team.members.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {completedTickets}/{totalTickets} done
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  trend: string;
  color: 'primary' | 'success' | 'warning' | 'destructive';
}

const StatCard = ({ icon: Icon, label, value, trend, color }: StatCardProps) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="rounded-xl border bg-card p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            colorClasses[color]
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <TrendingUp className="h-4 w-4 text-success" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
    </div>
  );
};

export default Dashboard;
