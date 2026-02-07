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

// Initial teams data
export const initialTeams: Team[] = [
  {
    id: 't1',
    name: 'Datalis Team',
    description: 'Core development team building the main platform',
    color: '#0052CC',
    members: [members[0], members[1], members[2], members[6]],
    projects: [
      {
        id: 'p1',
        name: 'Blockchain App',
        description: 'Decentralized application for secure transactions',
        status: 'Ongoing',
        progress: 65,
        icon: 'Link',
        createdAt: '2024-01-15',
        tickets: [
          {
            id: 'TKT-001',
            title: 'Fix UI Bug in Dashboard',
            description: 'The dashboard widgets are not aligned properly on mobile devices. Need to fix responsive layout.',
            assignee: members[0],
            priority: 'High',
            status: 'In Progress',
            dueDate: '2024-02-20',
            createdAt: '2024-02-01',
            attachments: 2,
            comments: 5,
            labels: ['bug', 'ui', 'mobile'],
          },
          {
            id: 'TKT-002',
            title: 'Implement Wallet Connection',
            description: 'Add support for MetaMask and WalletConnect integration.',
            assignee: members[1],
            priority: 'High',
            status: 'To Do',
            dueDate: '2024-02-25',
            createdAt: '2024-02-05',
            attachments: 1,
            comments: 3,
            labels: ['feature', 'blockchain'],
          },
          {
            id: 'TKT-003',
            title: 'Smart Contract Audit',
            description: 'Review and audit all smart contracts for security vulnerabilities.',
            assignee: members[1],
            priority: 'High',
            status: 'Review',
            dueDate: '2024-02-18',
            createdAt: '2024-02-02',
            attachments: 4,
            comments: 8,
            labels: ['security', 'blockchain'],
          },
          {
            id: 'TKT-004',
            title: 'Add Transaction History',
            description: 'Display user transaction history with filtering and export options.',
            assignee: members[2],
            priority: 'Medium',
            status: 'In Progress',
            dueDate: '2024-02-22',
            createdAt: '2024-02-08',
            attachments: 0,
            comments: 2,
            labels: ['feature', 'ui'],
          },
          {
            id: 'TKT-005',
            title: 'Documentation Update',
            description: 'Update API documentation with new endpoints.',
            assignee: members[6],
            priority: 'Low',
            status: 'Done',
            dueDate: '2024-02-10',
            createdAt: '2024-02-01',
            attachments: 1,
            comments: 1,
            labels: ['docs'],
          },
          {
            id: 'TKT-006',
            title: 'Optimize Gas Fees',
            description: 'Reduce gas consumption for contract interactions.',
            assignee: members[0],
            priority: 'Medium',
            status: 'To Do',
            dueDate: '2024-02-28',
            createdAt: '2024-02-10',
            attachments: 0,
            comments: 4,
            labels: ['optimization', 'blockchain'],
          },
        ],
      },
      {
        id: 'p2',
        name: 'Analytics Dashboard',
        description: 'Real-time analytics and reporting platform',
        status: 'Ongoing',
        progress: 40,
        icon: 'BarChart',
        createdAt: '2024-02-01',
        tickets: [
          {
            id: 'TKT-007',
            title: 'Design Chart Components',
            description: 'Create reusable chart components using Recharts library.',
            assignee: members[2],
            priority: 'High',
            status: 'In Progress',
            dueDate: '2024-02-24',
            createdAt: '2024-02-12',
            attachments: 3,
            comments: 6,
            labels: ['design', 'component'],
          },
          {
            id: 'TKT-008',
            title: 'Implement Data Export',
            description: 'Allow users to export reports in CSV and PDF formats.',
            assignee: members[1],
            priority: 'Medium',
            status: 'To Do',
            dueDate: '2024-03-01',
            createdAt: '2024-02-14',
            attachments: 0,
            comments: 2,
            labels: ['feature'],
          },
        ],
      },
    ],
  },
  {
    id: 't2',
    name: 'Frontend Team',
    description: 'UI/UX experts crafting beautiful interfaces',
    color: '#00875A',
    members: [members[2], members[3], members[7]],
    projects: [
      {
        id: 'p3',
        name: 'Design System',
        description: 'Component library and design tokens',
        status: 'Ongoing',
        progress: 80,
        icon: 'Palette',
        createdAt: '2023-11-01',
        tickets: [
          {
            id: 'TKT-009',
            title: 'Create Button Variants',
            description: 'Add primary, secondary, ghost, and destructive button variants.',
            assignee: members[3],
            priority: 'High',
            status: 'Done',
            dueDate: '2024-02-10',
            createdAt: '2024-01-20',
            attachments: 2,
            comments: 4,
            labels: ['component', 'design-system'],
          },
          {
            id: 'TKT-010',
            title: 'Dark Mode Support',
            description: 'Implement dark mode across all components.',
            assignee: members[2],
            priority: 'Medium',
            status: 'In Progress',
            dueDate: '2024-02-28',
            createdAt: '2024-02-05',
            attachments: 1,
            comments: 7,
            labels: ['enhancement', 'accessibility'],
          },
          {
            id: 'TKT-011',
            title: 'Form Components',
            description: 'Build input, select, checkbox, and radio components.',
            assignee: members[3],
            priority: 'High',
            status: 'Review',
            dueDate: '2024-02-20',
            createdAt: '2024-02-08',
            attachments: 0,
            comments: 3,
            labels: ['component', 'forms'],
          },
        ],
      },
      {
        id: 'p4',
        name: 'Marketing Website',
        description: 'Public-facing company website',
        status: 'Completed',
        progress: 100,
        icon: 'Globe',
        createdAt: '2023-09-15',
        tickets: [
          {
            id: 'TKT-012',
            title: 'SEO Optimization',
            description: 'Improve meta tags and add structured data.',
            assignee: members[7],
            priority: 'Medium',
            status: 'Done',
            dueDate: '2024-01-30',
            createdAt: '2024-01-15',
            attachments: 1,
            comments: 2,
            labels: ['seo', 'marketing'],
          },
        ],
      },
    ],
  },
  {
    id: 't3',
    name: 'Blockchain Team',
    description: 'Web3 and smart contract specialists',
    color: '#6554C0',
    members: [members[4], members[5], members[0]],
    projects: [
      {
        id: 'p5',
        name: 'NFT Marketplace',
        description: 'Platform for creating and trading NFTs',
        status: 'Ongoing',
        progress: 55,
        icon: 'Image',
        createdAt: '2024-01-01',
        tickets: [
          {
            id: 'TKT-013',
            title: 'Implement Minting Flow',
            description: 'Create user flow for minting new NFTs with metadata.',
            assignee: members[4],
            priority: 'High',
            status: 'In Progress',
            dueDate: '2024-02-25',
            createdAt: '2024-02-10',
            attachments: 2,
            comments: 5,
            labels: ['feature', 'nft'],
          },
          {
            id: 'TKT-014',
            title: 'Auction System',
            description: 'Build bidding and auction functionality for NFTs.',
            assignee: members[5],
            priority: 'High',
            status: 'To Do',
            dueDate: '2024-03-05',
            createdAt: '2024-02-12',
            attachments: 1,
            comments: 3,
            labels: ['feature', 'marketplace'],
          },
          {
            id: 'TKT-015',
            title: 'IPFS Integration',
            description: 'Store NFT metadata and images on IPFS.',
            assignee: members[4],
            priority: 'Medium',
            status: 'Review',
            dueDate: '2024-02-22',
            createdAt: '2024-02-08',
            attachments: 0,
            comments: 4,
            labels: ['infrastructure', 'storage'],
          },
        ],
      },
      {
        id: 'p6',
        name: 'DeFi Protocol',
        description: 'Decentralized finance protocol',
        status: 'On Hold',
        progress: 25,
        icon: 'Coins',
        createdAt: '2023-12-01',
        tickets: [
          {
            id: 'TKT-016',
            title: 'Liquidity Pool Design',
            description: 'Design the liquidity pool smart contract architecture.',
            assignee: members[0],
            priority: 'Low',
            status: 'To Do',
            dueDate: '2024-03-15',
            createdAt: '2024-02-01',
            attachments: 3,
            comments: 6,
            labels: ['design', 'defi'],
          },
        ],
      },
    ],
  },
];

// Helper functions
export const getTicketsByStatus = (tickets: Ticket[], status: TicketStatus): Ticket[] => {
  return tickets.filter(ticket => ticket.status === status);
};

export const getTicketCount = (tickets: Ticket[], status?: TicketStatus): number => {
  if (status) {
    return tickets.filter(ticket => ticket.status === status).length;
  }
  return tickets.length;
};

export const calculateProjectProgress = (tickets: Ticket[]): number => {
  if (tickets.length === 0) return 0;
  const doneCount = tickets.filter(t => t.status === 'Done').length;
  return Math.round((doneCount / tickets.length) * 100);
};

export const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'High':
      return 'priority-high';
    case 'Medium':
      return 'priority-medium';
    case 'Low':
      return 'priority-low';
    default:
      return 'muted';
  }
};

export const getStatusColor = (status: TicketStatus): string => {
  switch (status) {
    case 'To Do':
      return 'status-todo';
    case 'In Progress':
      return 'status-progress';
    case 'Review':
      return 'status-review';
    case 'Done':
      return 'status-done';
    default:
      return 'status-todo';
  }
};
