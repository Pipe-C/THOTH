import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { UserProfileRole, DocumentType } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  RoleSelect: { currentRole?: UserProfileRole } | undefined;
  Directory: { activeRole?: UserProfileRole } | undefined;
  Chat: {
    docId?: string;
    documentType?: DocumentType;
    activeRole?: UserProfileRole;
    initialTitle?: string;
  } | undefined;
};

export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};
