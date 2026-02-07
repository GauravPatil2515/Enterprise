/**
 * Re-export domain types from types.ts.
 * The members constant is kept for components that need a default assignee list
 * (TicketModal, Navbar). initialTeams has been removed â€” data comes from Neo4j only.
 */
export type { Priority, TicketStatus, ProjectStatus, Member, Ticket, Project, Team } from './types';
import type { Member } from './types';

// Sample members
export const members: Member[] = [
  {
    id: 'm1',
    name: 'You',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
    role: 'Tech Lead',
    email: 'you@datalis.com',
  },
  {
    id: 'm2',
    name: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    role: 'Senior Developer',
    email: 'sarah@datalis.com',
  },
  {
    id: 'm3',
    name: 'Mike Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    role: 'Frontend Developer',
    email: 'mike@datalis.com',
  },
  {
    id: 'm4',
    name: 'Emma Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    role: 'UX Designer',
    email: 'emma@datalis.com',
  },
  {
    id: 'm5',
    name: 'Alex Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    role: 'Backend Developer',
    email: 'alex@datalis.com',
  },
  {
    id: 'm6',
    name: 'Jordan Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
    role: 'DevOps Engineer',
    email: 'jordan@datalis.com',
  },
  {
    id: 'm7',
    name: 'Intern1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=intern1',
    role: 'Intern',
    email: 'intern1@datalis.com',
  },
  {
    id: 'm8',
    name: 'Chris Taylor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris',
    role: 'Product Manager',
    email: 'chris@datalis.com',
  },
];

// initialTeams REMOVED â€” all data comes from Neo4j API.

