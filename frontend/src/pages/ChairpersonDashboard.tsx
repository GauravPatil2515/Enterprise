/**
 * ChairpersonDashboard — Risk overview, AI agent opinions, and decision authority.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Eye,
} from 'lucide-react';
import { api, type DashboardData, type AnalysisResult } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const riskColors: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/20',
  LOW: 'text-green-400 bg-green-500/20',
};

const ChairpersonDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboardData('chairperson')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const projects = data?.projects || [];
  const blockedProjects = projects.filter((p: any) => p.blocked_count > 0);
  const activeProjects = projects.filter((p: any) => p.status === 'Ongoing');

  const handleAnalyze = async (projectId: string) => {
    setAnalyzingId(projectId);
    try {
      const result = await api.analyzeProject(projectId);
      setAnalyses((prev) => ({ ...prev, [projectId]: result }));
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 p-2.5 text-white shadow">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Chairperson Dashboard</h1>
          <p className="text-sm text-muted-foreground">Risk overview • Agent opinions • Decision authority</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading organization data...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Projects', value: projects.length, icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-400' },
              { label: 'Active', value: activeProjects.length, icon: <Activity className="h-4 w-4" />, color: 'text-green-400' },
              { label: 'With Blockers', value: blockedProjects.length, icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-400' },
              { label: 'On Hold', value: projects.filter((p: any) => p.status === 'On Hold').length, icon: <Eye className="h-4 w-4" />, color: 'text-amber-400' },
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

          {/* Projects with Risk */}
          <div>
            <h2 className="text-lg font-semibold mb-3">All Projects — Risk Status</h2>
            <div className="space-y-3">
              {projects.map((proj: any) => {
                const analysis = analyses[proj.id];
                const isAnalyzing = analyzingId === proj.id;

                return (
                  <div key={proj.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{proj.name}</h3>
                          <span className="text-xs text-muted-foreground">({proj.team})</span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded font-medium',
                              proj.status === 'Ongoing'
                                ? 'bg-blue-500/20 text-blue-400'
                                : proj.status === 'Completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-amber-500/20 text-amber-400',
                            )}
                          >
                            {proj.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{proj.active_tickets} active tickets</span>
                          {proj.blocked_count > 0 && (
                            <span className="text-red-400 font-medium">🔴 {proj.blocked_count} blocked</span>
                          )}
                          <Progress value={proj.progress} className="h-1 w-24" />
                          <span>{proj.progress}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {analysis && (
                          <span
                            className={cn(
                              'text-xs font-bold px-2 py-1 rounded',
                              riskColors[analysis.risk_level] || '',
                            )}
                          >
                            {analysis.risk_level} ({Math.round(analysis.risk_score * 100)}%)
                          </span>
                        )}
                        <button
                          onClick={() => handleAnalyze(proj.id)}
                          disabled={isAnalyzing}
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {isAnalyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : '🤖 Analyze Risk'}
                        </button>
                      </div>
                    </div>

                    {/* Analysis Details */}
                    {analysis && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t space-y-3"
                      >
                        <p className="text-sm">{analysis.primary_reason}</p>

                        {/* Agent Opinions */}
                        {analysis.agent_opinions.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Agent Opinions</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {analysis.agent_opinions.map((op) => (
                                <div key={op.agent} className="rounded-lg border p-2.5 text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold">{op.agent}</span>
                                    <span className="text-muted-foreground">{Math.round(op.confidence * 100)}%</span>
                                  </div>
                                  <p className="text-muted-foreground">{op.claim}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Decision Matrix */}
                        {analysis.decision_comparison.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Decision Matrix</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {analysis.decision_comparison.map((dc) => (
                                <div
                                  key={dc.action}
                                  className={cn(
                                    'rounded-lg border p-2.5 text-xs',
                                    dc.recommended && 'border-green-500/50 bg-green-500/5',
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold">{dc.action}</span>
                                    {dc.recommended && (
                                      <span className="text-green-400 text-[10px] font-bold">✓ RECOMMENDED</span>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground">{dc.reason}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span>Risk ↓ {Math.round(dc.risk_reduction * 100)}%</span>
                                    <span>Cost: {dc.cost}</span>
                                    <span>{dc.feasible ? '✅ Feasible' : '❌ Not Feasible'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Link to full analysis */}
                        <Link
                          to={`/project/t1/${proj.id}/risk`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View full analysis <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ChairpersonDashboard;
