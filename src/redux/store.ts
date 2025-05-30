import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import AsyncTasksPipelineReducer from './reducers/AsyncTasksPipelineReducer';

export const store = configureStore({
  reducer: {
    asyncTasksState: AsyncTasksPipelineReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
