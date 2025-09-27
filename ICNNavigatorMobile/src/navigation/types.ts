import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Auth types
export type AuthStackParamList = {
  Welcome: undefined;
  LoginSignUp: undefined;
};

// Main app types
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  EditProfile: undefined;
  ChangePassword: undefined;
  Payment: { planType?: string };
  ManageSubscription: undefined;
};

// Tab types
export type TabParamList = {
  Companies: NavigatorScreenParams<CompaniesStackParamList>;
  Map: NavigatorScreenParams<MapStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Companies Stack types
export type CompaniesStackParamList = {
  CompaniesList: undefined;
  CompanyDetail: { companyId: string; companyName?: string };
};

// Map Stack types
export type MapStackParamList = {
  MapView: undefined;
  CompanyDetail: { companyId: string; companyName?: string };
};

// Profile Stack types
export type ProfileStackParamList = {
  ProfileMain: undefined;
};

// Root navigator type
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// Helper types for screen props
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>;

export type CompaniesStackScreenProps<T extends keyof CompaniesStackParamList> = 
  NativeStackScreenProps<CompaniesStackParamList, T>;

export type MapStackScreenProps<T extends keyof MapStackParamList> = 
  NativeStackScreenProps<MapStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  NativeStackScreenProps<ProfileStackParamList, T>;