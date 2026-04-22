import api from './api';

export interface MealPlan {
  id: number;
  recipeId: number;
  recipeTitle: string;
  recipeImageUrl: string;
  plannedDate: string;
  mealType: string;
  servingsAdjustment: number;
  status: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface MealPlanRequest {
  recipeId: number;
  plannedDate: string;
  mealType: string;
  servingsAdjustment?: number;
  status?: string;
}

export const mealPlanService = {
  getMealPlans: (startDate: string, endDate: string) =>
    api.get<MealPlan[]>(`/meal-planner`, { params: { startDate, endDate } }).then(r => r.data),
  
  addMealPlan: (request: MealPlanRequest) =>
    api.post<MealPlan>(`/meal-planner`, request).then(r => r.data),
  
  deleteMealPlan: (id: number) =>
    api.delete(`/meal-planner/${id}`).then(r => r.data),

  updateMealPlan: (id: number, request: Partial<MealPlanRequest>) =>
    api.put<MealPlan>(`/meal-planner/${id}`, request).then(r => r.data),
};
