import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  Mail,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useTeams } from '@/context/TeamsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { SkeletonProjectCard } from '@/components/SkeletonLoaders';
import { cn } from '@/lib/utils';

const TeamOverview = () => {
  const { state } = useTeams();
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const selectedTeam = selectedTeamId
    ? state.teams.find((t) => t.id === selectedTeamId)
    : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Teams</h1>
        <p className="text-muted-foreground">
          Manage your teams and their projects
        </p>
      </motion.div>

      {/* Teams Grid */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {state.teams.map((team) => {
          const totalTickets = team.projects.flatMap((p) => p.tickets).length;
          const completedTickets = team.projects
            .flatMap((p) => p.tickets)
            .filter((t) => t.status === 'Done').length;
          const inProgressTickets = team.projects
            .flatMap((p) => p.tickets)
            .filter((t) => t.status === 'In Progress').length;
          const progress = totalTickets
            ? Math.round((completedTickets / totalTickets) * 100)
            : 0;
          const isSelected = selectedTeamId === team.id;

          return (
            <motion.button
              key={team.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTeamId(isSelected ? null : team.id)}
              className={cn(
                'w-full rounded-xl border bg-card p-6 text-left transition-all card-hover',
                isSelected && 'ring-2 ring-primary border-primary'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {team.projects.length} projects · {team.members.length} members
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {team.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-lg font-semibold">{totalTickets}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-center">
                  <p className="text-lg font-semibold text-primary">{inProgressTickets}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="rounded-lg bg-success/10 p-2 text-center">
                  <p className="text-lg font-semibold text-success">{completedTickets}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
              </div>

              {/* Members */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {team.members.slice(0, 5).map((member) => (
                    <Avatar
                      key={member.id}
                      className="h-8 w-8 border-2 border-card"
                    >
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {team.members.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{progress}%</span>
                  <Progress value={progress} className="h-1.5 w-16 mt-1" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Selected Team Details */}
      {selectedTeam && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6"
        >
          {/* Team Members */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {selectedTeam.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Projects */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedTeam.projects.map((project) => {
                const doneCount = project.tickets.filter(
                  (t) => t.status === 'Done'
                ).length;
                const progress = project.tickets.length
                  ? Math.round((doneCount / project.tickets.length) * 100)
                  : 0;

                return (
                  <Link
                    key={project.id}
                    to={`/project/${selectedTeam.id}/${project.id}`}
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
                            Created {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium mb-3',
                        project.status === 'Ongoing'
                          ? 'bg-primary/10 text-primary'
                          : project.status === 'Completed'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {project.status === 'Ongoing' && <Clock className="h-3 w-3" />}
                      {project.status === 'Completed' && <CheckCircle2 className="h-3 w-3" />}
                      {project.status}
                    </span>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {doneCount}/{project.tickets.length} tickets
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TeamOverview;
