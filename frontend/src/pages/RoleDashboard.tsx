/**
 * RoleDashboard — Routes to the correct dashboard based on the user's selected role.
 * If no role selected, redirects to role selector.
 */
import { Navigate } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import EngineerDashboard from './EngineerDashboard';
import HRDashboard from './HRDashboard';
import ChairpersonDashboard from './ChairpersonDashboard';
import FinanceDashboard from './FinanceDashboard';

const RoleDashboard = () => {
  const { currentRole } = useRole();

  if (!currentRole) {
    return <Navigate to="/select-role" replace />;
  }

  switch (currentRole) {
    case 'engineer':
      return <EngineerDashboard />;
    case 'hr':
      return <HRDashboard />;
    case 'chairperson':
      return <ChairpersonDashboard />;
    case 'finance':
      return <FinanceDashboard />;
    default:
      return <Navigate to="/select-role" replace />;
  }
};

export default RoleDashboard;
