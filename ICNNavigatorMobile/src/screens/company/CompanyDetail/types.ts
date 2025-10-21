import { Company } from '@/types';

export interface CompanyDetailScreenProps {
  route: any;
  navigation: any;
}

export interface CapabilityGroup {
  itemName: string;
  items: any[];
  isGroup: boolean;
  count: number;
}

export interface Project {
  id: number;
  name: string;
  client: string;
  date: string;
  description: string;
  value?: string;
  duration?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}