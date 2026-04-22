import api from './api';

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  bio: string;
  profilePictureUrl: string;
  coverPictureUrl: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isVerified?: boolean;
  reputationPoints?: number;
  reputationLevel?: string;
  recipeCount?: number;
  premium?: boolean;
  roles: string[];
}

export const userService = {
  getProfile: (id: number) => 
    api.get<UserProfile>(`/users/${id}`).then(r => r.data),
  
  followUser: (id: number) => 
    api.post(`/users/${id}/follow`).then(r => r.data),
  
  unfollowUser: (id: number) => 
    api.delete(`/users/${id}/unfollow`).then(r => r.data),
  
  updateProfile: (data: { bio?: string; profilePictureUrl?: string; coverPictureUrl?: string }) => 
    api.put<UserProfile>('/users/me', data).then(r => r.data),
  
  getFollowers: (id: number) => 
    api.get<UserProfile[]>(`/users/${id}/followers`).then(r => r.data),
  
  getFollowing: (id: number) => 
    api.get<UserProfile[]>(`/users/${id}/following`).then(r => r.data),

  likeRecipe: (id: number) =>
    api.post(`/recipes/${id}/like`).then(r => r.data),

  upgradeToPremium: () => 
    api.post('/payments/create-checkout-session').then(r => r.data),

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  verifyPremiumSession: (sessionId: string) => 
    api.get('/payments/verify-session?session_id=' + sessionId).then(r => r.data),
};
