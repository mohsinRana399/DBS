import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import fileReducer from "./slices/fileSlice";
import globalReducer from "./slices/globalSlice";
import promptsReducer from "./slices/promptsSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["file", "global", "prompts"],
};

const rootReducer = combineReducers({
  file: fileReducer,
  global: globalReducer,
  prompts: promptsReducer,
});

const persistedReducer = persistReducer(
  persistConfig,
  rootReducer
) as unknown as typeof rootReducer;

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
