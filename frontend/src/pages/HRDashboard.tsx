/**
 * HRDashboard — Team workload & member overview for HR managers.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { api, type DashboardData } from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const HRDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardData('hr')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const members = data?.members || [];
  const maxTickets = Math.max(...members.map((m: any) => m.active_tickets || 0), 1);
  const overloaded = members.filter((m: any) => m.active_tickets >= 3);
  const idle = members.filter((m: any) => m.active_tickets === 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 p-2.5 text-white shadow">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">HR Dashboard</h1>
          <p className="text-sm text-muted-foreground">Team workload distribution & member overview</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading team data...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Members', value: members.length, icon: <Users className="h-4 w-4" />, color: 'text-blue-400' },
              { label: 'Active Workers', value: members.length - idle.length, icon: <UserCheck className="h-4 w-4" />, color: 'text-green-400' },
              { label: 'Overloaded (3+)', value: overloaded.length, icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-400' },
              { label: 'Idle', value: idle.length, icon: <Briefcase className="h-4 w-4" />, color: 'text-amber-400' },
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

          {/* Workload Distribution */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Workload Distribution</h2>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              {members.map((member: any) => {
                const loadPct = Math.round((member.active_tickets / maxTickets) * 100);
                const isOverloaded = member.active_tickets >= 3;
                return (
                  <div key={member.id} className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium">{member.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{member.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{member.team}</span>
                          <span
                            className={cn(
                              'text-xs font-semibold px-1.5 py-0.5 rounded',
                              isOverloaded ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400',
                            )}
                          >
                            {member.active_tickets} tickets
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={loadPct}
                        className={cn('h-1.5', isOverloaded && '[&>div]:bg-red-500')}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Members List */}
          <div>
            <h2 className="text-lg font-semibold mb-3">All Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {members.map((member: any) => (
                <div key={member.id} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    <p className="text-xs text-muted-foreground">{member.team}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default HRDashboard;
