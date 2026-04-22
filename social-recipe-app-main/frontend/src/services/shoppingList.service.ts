import api from './api';

export interface ShoppingListItem {
  id: number;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  recipeId?: number;
  recipeTitle?: string;
  purchased: boolean;
}

export interface ShoppingListItemRequest {
  name: string;
  quantity?: string;
  unit?: string;
}

export const shoppingListService = {
  getItems: () =>
    api.get<ShoppingListItem[]>(`/shopping-list`).then(r => r.data),
  
  addItem: (request: ShoppingListItemRequest) =>
    api.post<ShoppingListItem>(`/shopping-list`, request).then(r => r.data),
  
  togglePurchased: (id: number) =>
    api.patch<ShoppingListItem>(`/shopping-list/${id}/toggle`).then(r => r.data),
  
  deleteChecked: () =>
    api.delete(`/shopping-list/checked`).then(r => r.data),
  
  addFromRecipe: (recipeId: number) =>
    api.post(`/shopping-list/from-recipe/${recipeId}`).then(r => r.data),

  addFromMealPlan: (startDate: string, endDate: string) =>
    api.post(`/shopping-list/from-meal-plan`, null, { params: { startDate, endDate } }).then(r => r.data),
};
