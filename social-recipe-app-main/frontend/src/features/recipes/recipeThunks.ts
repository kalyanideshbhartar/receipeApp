import type { AppDispatch } from '../../store/store';
import { recipeService } from '../../services/recipe.service';
import {
  fetchStart, fetchExploreSuccess, fetchDetailSuccess,
  fetchCommentsSuccess, addCommentSuccess,
  fetchFailure, toggleLike
} from './recipeSlice';

// FIX: Accept an optional string 'cursor' instead of a number 'page'
export const getExploreFeedThunk = (cursor?: string) => async (dispatch: AppDispatch) => {
  dispatch(fetchStart());
  try {
    // API now expects a string cursor for LocalDateTime pagination
    const data = await recipeService.getExploreFeed(cursor);
    dispatch(fetchExploreSuccess(data));
  } catch (err: unknown) {
    const error = err as { response?: { data?: string | { message?: string } } };
    dispatch(fetchFailure(error.response?.data || 'Failed to fetch explore feed'));
  }
};

export const getRecipeByIdThunk = (id: number) => async (dispatch: AppDispatch) => {
  dispatch(fetchStart());
  try {
    const data = await recipeService.getRecipeById(id);
    dispatch(fetchDetailSuccess(data));
  } catch (err: unknown) {
    const error = err as { response?: { data?: string | { message?: string } } };
    dispatch(fetchFailure(error.response?.data || 'Failed to fetch recipe details'));
  }
};

export const likeRecipeThunk = (id: number) => async (dispatch: AppDispatch) => {
  // Optimistic update
  dispatch(toggleLike(id));
  try {
    await recipeService.likeRecipe(id);
  } catch {
    // Revert on failure
    dispatch(toggleLike(id));
    console.error('Failed to like recipe');
  }
};

export const getCommentsThunk = (recipeId: number) => async (dispatch: AppDispatch) => {
  try {
    const data = await recipeService.getComments(recipeId);
    dispatch(fetchCommentsSuccess(data.content));
  } catch {
    console.error('Failed to fetch comments');
  }
};

export const addCommentThunk = (recipeId: number, content: string, parentId?: number) => async (dispatch: AppDispatch) => {
  try {
    const data = await recipeService.addComment(recipeId, content, parentId);
    dispatch(addCommentSuccess(data));
  } catch {
    console.error('Failed to add comment');
  }
};