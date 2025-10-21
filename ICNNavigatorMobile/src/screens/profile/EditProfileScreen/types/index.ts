export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  bio: string;
  linkedIn: string;
  website: string;
  avatar: string | null;
}

export type FormField = keyof ProfileFormData;