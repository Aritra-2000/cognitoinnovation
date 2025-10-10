// src/types/project.ts
// Keep this file decoupled from Prisma generated types to avoid drift
type User = {
  id: string;
  email: string;
  name: string | null;
};
type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: 'ADMIN' | 'MAINTAINER' | 'VIEWER';
};

type Member = ProjectMember & {
  user: User;
};

export type ProjectWithMembers = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  members: Member[];
};
