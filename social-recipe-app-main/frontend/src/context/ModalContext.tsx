/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ModalContextType {
  isCreateRecipeModalOpen: boolean;
  openCreateRecipeModal: () => void;
  closeCreateRecipeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCreateRecipeModalOpen, setIsCreateRecipeModalOpen] = useState(false);

  const openCreateRecipeModal = () => setIsCreateRecipeModalOpen(true);
  const closeCreateRecipeModal = () => setIsCreateRecipeModalOpen(false);

  return (
    <ModalContext.Provider 
      value={{ 
        isCreateRecipeModalOpen, 
        openCreateRecipeModal, 
        closeCreateRecipeModal 
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
