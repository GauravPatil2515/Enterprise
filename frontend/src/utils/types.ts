/**
 * Core domain types — extracted from mockData.ts so no mock dependency remains.
 */

export type Priority = 'High' | 'Medium' | 'Low';
export type TicketStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';
export type ProjectStatus = 'Ongoing' | 'Completed' | 'On Hold';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  assignee: Member;
  priority: Priority;
  status: TicketStatus;
  dueDate: string;
  createdAt: string;
  attachments: number;
  comments: number;
  labels: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  tickets: Ticket[];
  createdAt: string;
  icon: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: Member[];
  projects: Project[];
  color: string;
}
