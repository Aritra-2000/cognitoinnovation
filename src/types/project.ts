// src/types/project.ts
import { Project, User, ProjectMember } from '@prisma/client';

type Member = ProjectMember & {
  user: User;
};

export type ProjectWithMembers = Project & {
  members: Member[];
};
