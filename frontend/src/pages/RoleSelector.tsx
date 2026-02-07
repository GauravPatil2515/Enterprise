/**
 * RoleSelector — Landing page where the user picks their role.
 * Shows 4 role cards: Engineer, HR, Chairperson, Finance.
 */
import { useNavigate } from 'react-router-dom';
import { useRole, type RoleKey } from '@/context/RoleContext';
import {
  Code2,
  Users,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';

const ROLE_CARDS: { key: RoleKey; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'engineer',
    label: 'Engineer',
    description: 'View your tickets, Kanban board, and project progress.',
    icon: <Code2 className="h-8 w-8" />,
    color: 'from-blue-500 to-blue-700',
  },
  {
    key: 'hr',
    label: 'HR Manager',
    description: 'Monitor team workload, member allocation, and well-being.',
    icon: <Users className="h-8 w-8" />,
    color: 'from-green-500 to-green-700',
  },
  {
    key: 'chairperson',
    label: 'Chairperson',
    description: 'Risk dashboards, agent opinions, and decision authority.',
    icon: <ShieldCheck className="h-8 w-8" />,
    color: 'from-purple-500 to-purple-700',
  },
  {
    key: 'finance',
    label: 'Finance Manager',
    description: 'Cost analysis, intervention budgets, and resource utilization.',
    icon: <DollarSign className="h-8 w-8" />,
    color: 'from-amber-500 to-amber-700',
  },
];

const RoleSelector = () => {
  const { selectRole, systemUsers } = useRole();
  const navigate = useNavigate();

  const handleSelect = (role: RoleKey) => {
    const user = systemUsers.find((u) => u.role === role);
    selectRole(role, user || undefined);
    navigate('/role-dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Decision Intelligence Platform</h1>
        <p className="text-slate-400 text-lg">Select your role to see the dashboard tailored for you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
        {ROLE_CARDS.map((role) => (
          <button
            key={role.key}
            onClick={() => handleSelect(role.key)}
            className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 text-left transition-all duration-300 hover:scale-[1.04] hover:border-white/30 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <div
              className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${role.color} p-3 text-white mb-4 shadow-lg`}
            >
              {role.icon}
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{role.label}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{role.description}</p>
            <div className="mt-4 text-xs font-medium text-white/60 group-hover:text-white/90 transition-colors">
              Enter →
            </div>
          </button>
        ))}
      </div>

      <p className="mt-10 text-xs text-slate-600">
        Graph → Agents → LLM → Human
      </p>
    </div>
  );
};

export default RoleSelector;
