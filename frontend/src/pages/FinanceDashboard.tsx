/**
 * FinanceDashboard — Cost analysis, intervention budgets, resource utilization.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  FolderKanban,
  TrendingDown,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { api, type DashboardData } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const costColors: Record<string, string> = {
  Low: 'text-green-400 bg-green-500/20',
  Medium: 'text-amber-400 bg-amber-500/20',
  High: 'text-red-400 bg-red-500/20',
};

const FinanceDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardData('finance')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const teams = data?.teams || [];
  const costs = data?.intervention_costs || {};
  const totalMembers = teams.reduce((acc: number, t: any) => acc + (t.member_count || 0), 0);
  const totalProjects = teams.reduce((acc: number, t: any) => acc + (t.project_count || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-2.5 text-white shadow">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Finance Dashboard</h1>
          <p className="text-sm text-muted-foreground">Cost analysis • Intervention budgets • Resource utilization</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading financial data...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Teams', value: teams.length, icon: <Users className="h-4 w-4" />, color: 'text-blue-400' },
              { label: 'Total Members', value: totalMembers, icon: <Users className="h-4 w-4" />, color: 'text-green-400' },
              { label: 'Active Projects', value: totalProjects, icon: <FolderKanban className="h-4 w-4" />, color: 'text-purple-400' },
              { label: 'Interventions', value: Object.keys(costs).length, icon: <TrendingDown className="h-4 w-4" />, color: 'text-amber-400' },
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

          {/* Team Resources */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Team Resource Allocation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teams.map((team: any) => (
                <div key={team.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{team.name}</h3>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: team.color || '#666' }}
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Members</span>
                      <span className="font-medium">{team.member_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Projects</span>
                      <span className="font-medium">{team.project_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-medium">
                        {team.member_count > 0
                          ? Math.round((team.project_count / team.member_count) * 100)
                          : 0}%
                      </span>
                    </div>
                    <Progress
                      value={
                        team.member_count > 0
                          ? Math.min(100, Math.round((team.project_count / team.member_count) * 100))
                          : 0
                      }
                      className="h-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intervention Cost Matrix */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Intervention Cost Matrix</h2>
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Intervention</th>
                    <th className="text-center p-3 font-medium">Risk Reduction</th>
                    <th className="text-center p-3 font-medium">Cost Penalty</th>
                    <th className="text-center p-3 font-medium">Net Benefit</th>
                    <th className="text-center p-3 font-medium">Ramp-Up</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(costs).map(([action, impact]: [string, any]) => {
                    const net = (impact.risk_reduction || 0) - (impact.cost_penalty || 0);
                    const costLevel =
                      impact.cost_penalty < 0.15 ? 'Low' : impact.cost_penalty < 0.3 ? 'Medium' : 'High';

                    return (
                      <tr key={action} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{action.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-center">
                          <span className="text-green-400 flex items-center justify-center gap-1">
                            <ArrowDown className="h-3 w-3" />
                            {Math.round(impact.risk_reduction * 100)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', costColors[costLevel])}>
                            {Math.round(impact.cost_penalty * 100)}% — {costLevel}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={cn(
                              'flex items-center justify-center gap-1 font-semibold',
                              net > 0 ? 'text-green-400' : 'text-red-400',
                            )}
                          >
                            {net > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {net > 0 ? '+' : ''}{Math.round(net * 100)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {impact.ramp_up_required ? (
                            <span className="text-amber-400 text-xs">⚠ Required</span>
                          ) : (
                            <span className="text-green-400 text-xs">✓ None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default FinanceDashboard;
