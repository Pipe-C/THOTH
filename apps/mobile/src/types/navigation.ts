import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { UserProfileRole, DocumentType } from '../types/index';


export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  RoleSelect: { currentRole?: UserProfileRole } | undefined;
  Directory: { activeRole?: UserProfileRole } | undefined;
  Chat: {
    docId?: string;
    documentType?: DocumentType;
    activeRole?: UserProfileRole;
    initialTitle?: string;
  } | undefined;
};