export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export interface PasswordRequirement {
  met: boolean;
  text: string;
}