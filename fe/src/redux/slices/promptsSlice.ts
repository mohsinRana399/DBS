import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Prompt {
  title: string;
  prompt: string;
}

interface PromptsState {
  prompts: Prompt[];
}

const initialState: PromptsState = {
  prompts: [],
};

const promptsSlice = createSlice({
  name: "prompts",
  initialState,
  reducers: {
    setPrompts: (state, action: PayloadAction<Prompt[]>) => {
      state.prompts = action.payload;
    },
    addPrompt: (state, action: PayloadAction<Prompt>) => {
      state.prompts.push(action.payload);
    },
    updatePrompt: (
      state,
      action: PayloadAction<{ index: number; prompt: Prompt }>
    ) => {
      const { index, prompt } = action.payload;
      if (index >= 0 && index < state.prompts.length) {
        state.prompts[index] = prompt;
      }
    },
    removePrompt: (state, action: PayloadAction<number>) => {
      const idx = action.payload;
      if (idx >= 0 && idx < state.prompts.length) {
        state.prompts.splice(idx, 1);
      }
    },
    clearPrompts: (state) => {
      state.prompts = [];
    },
  },
});

export const {
  setPrompts,
  addPrompt,
  updatePrompt,
  removePrompt,
  clearPrompts,
} = promptsSlice.actions;
export default promptsSlice.reducer;
