import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
// REMOVED PageResponse as it is no longer exported or needed
import type { RecipeSummary, RecipeDetail, CursorResponse, Comment } from '../../services/recipe.service';

interface RecipeState {
  exploreFeed: RecipeSummary[];
  personalizedFeed: RecipeSummary[];
  userRecipes: RecipeSummary[];
  recipeDetail: RecipeDetail | null;
  comments: Comment[];
  loading: boolean;
  error: string | null;
  nextCursor: string | null; // For Infinite Scroll
  page: number;
  totalPages: number;
}

const initialState: RecipeState = {
  exploreFeed: [],
  personalizedFeed: [],
  userRecipes: [],
  recipeDetail: null,
  comments: [],
  loading: false,
  error: null,
  nextCursor: null,
  page: 0,
  totalPages: 0,
};

const recipeSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    fetchStart(state) {
      state.loading = true;
      state.error = null;
    },
    // Updated to handle the new backend Cursor structure: { content: [], nextCursor: "" }
    fetchExploreSuccess(state, action: PayloadAction<CursorResponse<RecipeSummary>>) {
      state.loading = false;

      const newContent = (action.payload.content || []).filter((r: RecipeSummary) => {
        if (!r.id || isNaN(Number(r.id))) {
          console.warn('Backend returned a recipe without a valid ID:', r);
          return false;
        }
        return true;
      });
      const incomingCursor = action.payload.nextCursor;

      // Filter out duplicates by ID to prevent "same key" React warnings
      const existingIds = new Set(state.exploreFeed.map(r => r.id));
      const uniqueNewRecipes = newContent.filter((r: RecipeSummary) => !existingIds.has(r.id));

      // If it's a fresh load (no cursor) replace, otherwise append
      if (!state.nextCursor) {
        state.exploreFeed = newContent;
      } else {
        state.exploreFeed = [...state.exploreFeed, ...uniqueNewRecipes];
      }

      state.nextCursor = incomingCursor || null;
    },
    fetchDetailSuccess(state, action: PayloadAction<RecipeDetail>) {
      state.loading = false;
      if (!action.payload?.id) {
        console.error('fetchDetailSuccess reached with null/missing ID:', action.payload);
        state.error = 'Invalid recipe data received';
        return;
      }
      state.recipeDetail = action.payload;
    },
    fetchCommentsSuccess(state, action: PayloadAction<Comment[]>) {
      state.comments = action.payload;
    },
    addCommentSuccess(state, action: PayloadAction<Comment>) {
      state.comments = [action.payload, ...state.comments];
      if (state.recipeDetail) {
        state.recipeDetail.commentCount += 1;
      }
    },
    fetchFailure(state, action: PayloadAction<string | { message?: string; error?: string } | undefined>) {
      state.loading = false;
      const payload = action.payload;
      state.error = typeof payload === 'string' 
        ? payload 
        : (payload?.message || payload?.error || 'An error occurred');
    },
    toggleLike(state, action: PayloadAction<number>) {
      const updateLike = (list: RecipeSummary[]) => {
        const recipe = list.find(r => r.id === action.payload);
        if (recipe) {
          recipe.isLiked = !recipe.isLiked;
          recipe.likeCount += recipe.isLiked ? 1 : -1;
        }
      };
      updateLike(state.exploreFeed);
      updateLike(state.personalizedFeed);
      updateLike(state.userRecipes);
      if (state.recipeDetail?.id === action.payload) {
        state.recipeDetail.isLiked = !state.recipeDetail.isLiked;
        state.recipeDetail.likeCount += state.recipeDetail.isLiked ? 1 : -1;
      }
    },
    resetRecipes(state) {
      state.exploreFeed = [];
      state.nextCursor = null;
      state.error = null;
      state.page = 0;
    }
  },
});

export const {
  fetchStart, fetchExploreSuccess, fetchDetailSuccess,
  fetchCommentsSuccess, addCommentSuccess,
  fetchFailure, toggleLike, resetRecipes
} = recipeSlice.actions;
export default recipeSlice.reducer;