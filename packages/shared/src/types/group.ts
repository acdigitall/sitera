export type GroupPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Group {
  id: string;
  name: string;
  slug: string;
  plan: GroupPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupDto {
  name: string;
  slug: string;
  plan?: GroupPlan;
}

export interface UpdateGroupDto {
  name?: string;
  plan?: GroupPlan;
  isActive?: boolean;
}
