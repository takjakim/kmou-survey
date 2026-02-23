import { create } from 'zustand';

type ResponseValue = string | string[] | number | null;

interface SurveyStore {
  responses: Record<string, ResponseValue>;
  currentIndex: number;
  setResponse: (questionId: string, value: ResponseValue) => void;
  setCurrentIndex: (index: number) => void;
  reset: () => void;
}

export const useSurveyStore = create<SurveyStore>((set) => ({
  responses: {},
  currentIndex: 0,
  setResponse: (questionId, value) =>
    set((state) => ({
      responses: { ...state.responses, [questionId]: value },
    })),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  reset: () => set({ responses: {}, currentIndex: 0 }),
}));
