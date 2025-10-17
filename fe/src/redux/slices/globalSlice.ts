import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface FileState {
  darkMode: boolean;
}

const initialState: FileState = {
  darkMode: false,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
  },
});

export const { setDarkMode } = globalSlice.actions;
export default globalSlice.reducer;
