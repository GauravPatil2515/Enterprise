/**
 * RoleContext — Manages the currently selected role (engineer | hr | chairperson | finance).
 * Persists to localStorage so the user doesn't have to re-select every page load.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SystemUser, RoleDashboard } from '@/services/api';
import { api } from '@/services/api';

export type RoleKey = 'engineer' | 'hr' | 'chairperson' | 'finance';

interface RoleState {
  /** Currently selected role */
  currentRole: RoleKey | null;
  /** Currently selected system user */
  currentUser: SystemUser | null;
  /** All system users available */
  systemUsers: SystemUser[];
  /** Role configuration */
  roleConfig: RoleDashboard | null;
  /** Whether we're loading role data */
  loading: boolean;
  /** Pick a role (and optionally a user) */
  selectRole: (role: RoleKey, user?: SystemUser) => void;
  /** Log out of role */
  clearRole: () => void;
}

const RoleContext = createContext<RoleState>({
  currentRole: null,
  currentUser: null,
  systemUsers: [],
  roleConfig: null,
  loading: false,
  selectRole: () => {},
  clearRole: () => {},
});

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<RoleKey | null>(() => {
    const saved = localStorage.getItem('selectedRole');
    return saved ? (saved as RoleKey) : null;
  });
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('selectedUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [roleConfig, setRoleConfig] = useState<RoleDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  // Load system users on mount
  useEffect(() => {
    api.getSystemUsers()
      .then(setSystemUsers)
      .catch((err) => console.warn('Failed to load system users:', err));
  }, []);

  // Load role config when role changes
  useEffect(() => {
    if (!currentRole) {
      setRoleConfig(null);
      return;
    }
    setLoading(true);
    api.getRoleDashboard(currentRole)
      .then(setRoleConfig)
      .catch(() => setRoleConfig(null))
      .finally(() => setLoading(false));
  }, [currentRole]);

  const selectRole = useCallback((role: RoleKey, user?: SystemUser) => {
    setCurrentRole(role);
    localStorage.setItem('selectedRole', role);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('selectedUser', JSON.stringify(user));
    } else {
      // Auto-pick the first user with this role
      const match = systemUsers.find((u) => u.role === role);
      if (match) {
        setCurrentUser(match);
        localStorage.setItem('selectedUser', JSON.stringify(match));
      }
    }
  }, [systemUsers]);

  const clearRole = useCallback(() => {
    setCurrentRole(null);
    setCurrentUser(null);
    setRoleConfig(null);
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('selectedUser');
  }, []);

  return (
    <RoleContext.Provider
      value={{ currentRole, currentUser, systemUsers, roleConfig, loading, selectRole, clearRole }}
    >
      {children}
    </RoleContext.Provider>
  );
};
