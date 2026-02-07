/**
 * RoleBadge — Shows the current role in the navbar with a switch-role option.
 */
import { useNavigate } from 'react-router-dom';
import { useRole, type RoleKey } from '@/context/RoleContext';
import {
  Code2,
  Users,
  ShieldCheck,
  DollarSign,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const roleIcons: Record<RoleKey, React.ReactNode> = {
  engineer: <Code2 className="h-3.5 w-3.5" />,
  hr: <Users className="h-3.5 w-3.5" />,
  chairperson: <ShieldCheck className="h-3.5 w-3.5" />,
  finance: <DollarSign className="h-3.5 w-3.5" />,
};

const roleGradients: Record<RoleKey, string> = {
  engineer: 'from-blue-500 to-blue-700',
  hr: 'from-green-500 to-green-700',
  chairperson: 'from-purple-500 to-purple-700',
  finance: 'from-amber-500 to-amber-700',
};

const RoleBadge = () => {
  const { currentRole, currentUser, roleConfig, clearRole } = useRole();
  const navigate = useNavigate();

  if (!currentRole || !roleConfig) return null;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-gradient-to-r',
          roleGradients[currentRole],
        )}
      >
        {roleIcons[currentRole]}
        {roleConfig.label}
      </div>
      {currentUser && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {currentUser.name}
        </span>
      )}
      <button
        onClick={() => {
          clearRole();
          navigate('/select-role');
        }}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
        title="Switch Role"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default RoleBadge;
