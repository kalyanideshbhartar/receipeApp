import api from './api';

export interface Ingredient {
  id: number;
  name: string;
  quantity: string;
  unit: string;
  category?: string;
}

export interface Step {
  id: number;
  stepNumber: number;
  instruction: string;
}

export interface RecipeSummary {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  additionalImages?: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  likeCount: number;
  commentCount: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
  isPublished?: boolean;
  isPremium?: boolean;
  createdAt: string;
  author: {
    id: number;
    username: string;
    profilePictureUrl: string;
    isVerified?: boolean;
  };
  category?: string;
  content?: string;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: Ingredient[];
  steps: Step[];
}

// Updated to match the new backend Cursor Map structure
export interface CursorResponse<T> {
  content: T[];
  nextCursor: string;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    profilePictureUrl: string;
  };
  parentId?: number;
  replies?: Comment[];
}

export const recipeService = {
  // Updated for Cursor-based Pagination
  getExploreFeed: (cursor?: string, category?: string, size = 12, maxTime?: number, maxCalories?: number, sort = 'newest'): Promise<CursorResponse<RecipeSummary>> =>
    api.get(`/recipes/explore`, { params: { cursor, category, size, maxTime, maxCalories, sort } }).then(r => r.data),

  getPersonalizedFeed: (cursor?: string, size = 12): Promise<CursorResponse<RecipeSummary>> =>
    api.get(`/recipes/feed`, { params: { cursor, size } }).then(r => r.data),

  getRecipeById: (id: number): Promise<RecipeDetail> =>
    api.get(`/recipes/${id}`).then(r => r.data),

  createRecipe: (data: object): Promise<RecipeDetail> =>
    api.post('/recipes', data).then(r => r.data),

  updateRecipe: (id: number, data: object): Promise<RecipeDetail> =>
    api.put(`/recipes/${id}`, data).then(r => r.data),

  deleteRecipe: (id: number) =>
    api.delete(`/recipes/${id}`),

  // Updated search to match the new List return type
  searchRecipes: (q: string): Promise<RecipeSummary[]> =>
    api.get(`/recipes/search`, { params: { q } }).then(r => r.data),

  getUserRecipes: (userId: number, cursor?: string, size = 12): Promise<CursorResponse<RecipeSummary>> =>
    api.get(`/users/${userId}/recipes`, { params: { cursor, size } }).then(r => r.data),

  getUserLikedRecipes: (userId: number, cursor?: string, size = 12): Promise<CursorResponse<RecipeSummary>> =>
    api.get(`/users/${userId}/liked-recipes`, { params: { cursor, size } }).then(r => r.data),

  likeRecipe: (id: number) =>
    api.post(`/recipes/${id}/like`).then(r => r.data),

  bookmarkRecipe: (id: number) =>
    api.post(`/bookmarks/${id}`).then(r => r.data),

  getComments: (recipeId: number, page = 0, size = 20) =>
    api.get(`/recipes/${recipeId}/comments`, { params: { page, size } }).then(r => r.data),

  addComment: (recipeId: number, content: string, parentId?: number) =>
    api.post(`/recipes/${recipeId}/comments`, { content, parentId }).then(r => r.data),

  deleteComment: (commentId: number) =>
    api.delete(`/comments/${commentId}`),

  getCloudinarySignature: (folder = 'recipes') =>
    api.get<{ signature: string; timestamp: string; apiKey: string; cloudName: string; folder: string }>(
      `/cloudinary/signature`, { params: { folder } }
    ).then(r => r.data),

  getTrendingRecipes: (limit = 10): Promise<RecipeSummary[]> =>
    api.get(`/recipes/trending`, { params: { limit } }).then(r => r.data),

  rateRecipe: (id: number, rating: number) =>
    api.post(`/recipes/${id}/rating`, { rating }).then(r => r.data),
};