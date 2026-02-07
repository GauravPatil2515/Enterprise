import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Shield,
  ChevronDown,
  ChevronRight,
  Plus,
  Menu,
  X,
  UserCog,
  GitGraph,
  Activity,
  MessageCircle,
} from 'lucide-react';
import { useTeams } from '@/context/TeamsContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { state, dispatch } = useTeams();
  const [expandedTeams, setExpandedTeams] = useState<string[]>([state.teams[0]?.id || '']);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleTeamSelect = (teamId: string) => {
    dispatch({ type: 'SELECT_TEAM', payload: teamId });
    if (!expandedTeams.includes(teamId)) {
      setExpandedTeams(prev => [...prev, teamId]);
    }
  };

  const handleProjectSelect = (teamId: string, projectId: string) => {
    dispatch({ type: 'SELECT_TEAM', payload: teamId });
    dispatch({ type: 'SELECT_PROJECT', payload: projectId });
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: UserCog, label: 'Role Dashboard', path: '/role-dashboard' },
    { icon: Users, label: 'Teams', path: '/teams' },
    { icon: FolderKanban, label: 'All Projects', path: '/projects' },
    { icon: GitGraph, label: 'Graph View', path: '/graph' },
    { icon: MessageCircle, label: 'AI Chat', path: '/chat' },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <FolderKanban className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">Jira Clone</span>
        <button 
          onClick={onClose}
          className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Teams Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Teams & Projects
            </span>
            <button className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {state.teams.map((team) => {
              const isExpanded = expandedTeams.includes(team.id);
              const isSelected = state.selectedTeamId === team.id;

              return (
                <div key={team.id}>
                  <button
                    onClick={() => {
                      toggleTeam(team.id);
                      handleTeamSelect(team.id);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="truncate">{team.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {team.projects.length}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 overflow-hidden"
                      >
                        {team.projects.map((project) => {
                          const isProjectActive =
                            state.selectedProjectId === project.id;

                          return (
                            <div key={project.id} className="flex items-center gap-1">
                              <Link
                                to={`/project/${team.id}/${project.id}`}
                                onClick={() => {
                                  handleProjectSelect(team.id, project.id);
                                  onClose();
                                }}
                                className={cn(
                                  'flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                  isProjectActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                                )}
                              >
                                <span>{project.icon}</span>
                                <span className="truncate">{project.name}</span>
                              </Link>
                              <Link
                                to={`/project/${team.id}/${project.id}/risk`}
                                onClick={onClose}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                                title="Risk Analysis"
                              >
                                <Shield className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          Decision Intelligence Platform
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarTrigger = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
  >
    <Menu className="h-5 w-5" />
  </button>
);
