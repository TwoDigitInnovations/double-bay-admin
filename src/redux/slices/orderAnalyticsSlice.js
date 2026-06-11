import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  todayStats: {
    orders: 0,
    itemsOrdered: 0,
    returns: 0,
    fulfilled: 0,
  },
  loading: false,
  error: null,
};

const orderAnalyticsSlice = createSlice({
  name: 'orderAnalytics',
  initialState,
  reducers: {
    setTodayStats: (state, action) => {
      console.log('[setTodayStats reducer] Received payload:', action.payload);
      state.todayStats = action.payload;
      console.log('[setTodayStats reducer] Updated state.todayStats:', state.todayStats);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setTodayStats, setLoading, setError } = orderAnalyticsSlice.actions;
export default orderAnalyticsSlice.reducer;
