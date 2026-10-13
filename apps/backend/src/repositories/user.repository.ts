import type { UserProfile } from '../../lib/types.js';

export interface UserEntity {
  uid: string;
  email: string;
  displayName?: string;
  profile: UserProfile;
  createdAt?: string;
  idToken?: string;
  expiresIn?: number;
}

export interface IUserRepository {
  createUser(params: {
    email: string;
    displayName: string;
    profile: UserProfile;
  }): Promise<UserEntity>;

  authenticateUser(params: {
    email: string;
  }): Promise<UserEntity>;
}

export class UserRepository implements IUserRepository {
  async createUser(params: {
    email: string;
    displayName: string;
    profile: UserProfile;
  }): Promise<UserEntity> {
    const mockUid = `mock_${Date.now()}`;
    return {
      uid: mockUid,
      email: params.email.trim().toLowerCase(),
      displayName: params.displayName,
      profile: params.profile,
      createdAt: new Date().toISOString(),
    };
  }

  async authenticateUser(params: {
    email: string;
  }): Promise<UserEntity> {
    const normalized = params.email.trim().toLowerCase();
    const mockUid = `mock_user_${normalized.split('@')[0]}`;
    return {
      uid: mockUid,
      email: normalized,
      idToken: 'MOCK_ID_TOKEN_REPLACE_IN_PHASE_4',
      expiresIn: 3600,
      profile: 'estudiante',
    };
  }
}

export const userRepository = new UserRepository();
