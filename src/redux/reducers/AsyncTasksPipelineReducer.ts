import { ActionReducerMapBuilder, AsyncThunkPayloadCreator, CaseReducer, createAction, createAsyncThunk, createReducer, PayloadAction, SerializedError } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { ReducerWithInitialState } from "@reduxjs/toolkit/dist/createReducer";
import { GetThunkAPI } from "@reduxjs/toolkit/dist/createAsyncThunk";


// Redux complex Http Async Task chains Scenario Reducers

// Task 1 Dto

export interface Task1DtoRequest {
    request1Id: number;
    // ...
}

export interface Task1DtoResponse {
    request1Id: number;
    // ...
}

// Task 2 Dto

export interface Task2DtoRequest {
    request2Id: number;
    // ...
}

export interface Task2DtoResponse {
    request2Id: number;
    // ...
}

    /*  +------------------+
        | STATE DEFINITION |
        +------------------+   */

export type AsyncTaskState = { loading:boolean, lastRunStart: number }

export interface IReducerState {
    asyncStep1State: AsyncTaskState
    asyncStep1Result? : Task1DtoResponse;
    asyncStep2State: AsyncTaskState
    asyncStep2Result? : Task2DtoResponse;
    finalResult?: string
}

const INIT_STATE:IReducerState = {
    asyncStep1State: { loading: false, lastRunStart: -1 },
    asyncStep1Result : undefined,
    asyncStep2State: { loading: false, lastRunStart: -1 },
    asyncStep2Result : undefined,
    finalResult: undefined
}


    /*  +--------------------+
        | ACTIONS DEFINITION |
        +--------------------+   */

export enum ReducersActionsEnum {
    INIT  = '@@INIT',
    RESET = 'asyncTaskPipeline/reset',
    ASYNC_TASK1 = 'asyncTaskPipeline/asyncTask1',
    ASYNC_TASK2 = 'asyncTaskPipeline/asyncTask2',
}

export const INIT  = createAction<void,string>(ReducersActionsEnum.INIT);
export const RESET = createAction<void,string>(ReducersActionsEnum.RESET);

    /*  +------------------------+
        | ASYNC THUNK DEFINITION |
        +------------------------+   */

// Async Actions Dto with other request data
export interface CallData<T> {
    dto: T,
    controller: AbortController,
    timerStart: number
}

const AsyncTask1:AsyncThunkPayloadCreator<Task1DtoResponse, CallData<Task1DtoRequest>,{state: RootState}> = 
    async (data:CallData<Task1DtoRequest>, thunkAPI:GetThunkAPI<{state: RootState;}>) => {
        try {
            const asyncResult1 = await new Promise<Task1DtoResponse>((resolve)=>{ resolve({request1Id:0})});
            return asyncResult1;
        } catch (error) {
            return thunkAPI.rejectWithValue('Failed Setup Task');
        }
    };

const AsyncTask2:AsyncThunkPayloadCreator<Task2DtoResponse, CallData<Task2DtoRequest>,{state: RootState}> = 
    async (data:CallData<Task2DtoRequest>, thunkAPI:GetThunkAPI<{state: RootState;}>) => {
        try {
            // Task1 result is needed
            // ...
            const asyncResult2 = await new Promise<Task2DtoResponse>((resolve)=>{ resolve({request2Id:0})})
            const asyncResult1 = thunkAPI.getState().asyncTasksState.asyncStep1Result;
            if(asyncResult1===undefined){
                throw new Error('Missing Async Task 1 result');
            }
            // Dispatch actions to other redux store slices.. other logic
            // thunkAPI.dispatch<>()
            return asyncResult2;
        } catch (error) {
            return thunkAPI.rejectWithValue('Failed Setup Task');
        }
    };

export const ASYNC_TASK1  = createAsyncThunk<Task1DtoResponse,CallData<Task1DtoRequest>>(ReducersActionsEnum.ASYNC_TASK1, AsyncTask1);
export const ASYNC_TASK2  = createAsyncThunk<Task2DtoResponse,CallData<Task2DtoRequest>>(ReducersActionsEnum.ASYNC_TASK2, AsyncTask2);


    /*  +--------------------------+
        | CASE REDUCERS DEFINITION |
        +--------------------------+   */
        
// [1] INIT action
const initActionReducer:CaseReducer<IReducerState, PayloadAction<void,string>> = 
    (state:IReducerState, action:PayloadAction<void,string>) => {
        state = {...INIT_STATE};
        return state;
    };

// [2] RESET action
const resetActionReducer:CaseReducer<IReducerState, PayloadAction<void,string>> = 
    (state:IReducerState, action:PayloadAction<void,string>) => {
        state = {...INIT_STATE};
        return state;
    };

// [3] Async Task 1 Action

const asyncTask1ActionPending:CaseReducer<IReducerState, PayloadAction<void, string, {arg: CallData<Task1DtoRequest>;requestId: string;requestStatus: "pending";}, never>> = 
    (state:IReducerState,action:PayloadAction<void, string, {arg: CallData<Task1DtoRequest>;requestId: string;requestStatus: "pending";}, never>) => {
        state = JSON.parse(JSON.stringify(INIT_STATE)) // Step 1 will reset other steps
        state.asyncStep1State.loading      = true;
        state.asyncStep1State.lastRunStart = action.meta.arg.timerStart; // Extract data from action payload after async execution
        return state;
    }
const asyncTask1ActionFulfilled:CaseReducer<IReducerState, PayloadAction<Task1DtoResponse, string, {arg: CallData<Task1DtoRequest>;requestId: string;requestStatus: "fulfilled";}, never>> = 
    (state:IReducerState,action:PayloadAction<Task1DtoResponse, string, {arg: CallData<Task1DtoRequest>;requestId: string;requestStatus: "fulfilled";}, never>) => {
        state.asyncStep1Result = action.payload;
        state.asyncStep1State.loading = false;
        return state;
    }
const asyncTask1ActionRejected:CaseReducer<IReducerState, PayloadAction<unknown, string, {arg: CallData<Task1DtoRequest>;requestId: string;requestStatus: "rejected";aborted: boolean;condition: boolean;}, SerializedError>> = 
    (state:IReducerState,action:PayloadAction<unknown, string, {arg: CallData<Task1DtoRequest>;requestId: string;requestStatus: "rejected";aborted: boolean;condition: boolean;}, SerializedError>) => {
        state.asyncStep1Result = undefined;
        state.asyncStep1State.loading = false;
        return state;
    }

// [4] Async Task 1 Action

const asyncTask2ActionPending:CaseReducer<IReducerState, PayloadAction<void, string, {arg: CallData<Task2DtoRequest>;requestId: string;requestStatus: "pending";}, never>> = 
    (state:IReducerState,action:PayloadAction<void, string, {arg: CallData<Task2DtoRequest>;requestId: string;requestStatus: "pending";}, never>) => {
        state = JSON.parse(JSON.stringify(INIT_STATE)) // Step 1 will reset other steps
        state.asyncStep2State.loading      = true;
        state.asyncStep2State.lastRunStart = action.meta.arg.timerStart; // Extract data from action payload after async execution
        return state;
    }
const asyncTask2ActionFulfilled:CaseReducer<IReducerState, PayloadAction<Task2DtoResponse, string, {arg: CallData<Task2DtoRequest>;requestId: string;requestStatus: "fulfilled";}, never>> = 
    (state:IReducerState,action:PayloadAction<Task2DtoResponse, string, {arg: CallData<Task2DtoRequest>;requestId: string;requestStatus: "fulfilled";}, never>) => {
        state.asyncStep2Result = action.payload;
        state.asyncStep2State.loading = false;
        return state;
    }
const asyncTask2ActionRejected:CaseReducer<IReducerState, PayloadAction<unknown, string, {arg: CallData<Task2DtoRequest>;requestId: string;requestStatus: "rejected";aborted: boolean;condition: boolean;}, SerializedError>> = 
    (state:IReducerState,action:PayloadAction<unknown, string, {arg: CallData<Task2DtoRequest>;requestId: string;requestStatus: "rejected";aborted: boolean;condition: boolean;}, SerializedError>) => {
        state.asyncStep2Result = undefined;
        state.asyncStep2State.loading = false;
        return state;
    }

/*  +----------------------------+
    | REDUCER BUILDER DEFINITION |
    +----------------------------+   */
const reducerBuilder = (builder:ActionReducerMapBuilder<IReducerState>) => {

    builder.addCase(INIT , initActionReducer);
    builder.addCase(RESET, resetActionReducer);
    
    builder.addCase(ASYNC_TASK1.pending  , asyncTask1ActionPending);
    builder.addCase(ASYNC_TASK1.fulfilled, asyncTask1ActionFulfilled);
    builder.addCase(ASYNC_TASK1.rejected , asyncTask1ActionRejected);

    builder.addCase(ASYNC_TASK2.pending  , asyncTask2ActionPending);
    builder.addCase(ASYNC_TASK2.fulfilled, asyncTask2ActionFulfilled);
    builder.addCase(ASYNC_TASK2.rejected , asyncTask2ActionRejected);
};

const AsyncTasksPipelineReducer: ReducerWithInitialState<IReducerState> = 
    createReducer<IReducerState>(INIT_STATE,reducerBuilder);

export default AsyncTasksPipelineReducer;
