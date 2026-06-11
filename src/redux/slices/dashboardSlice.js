import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  overview: null,
  salesChart: [],
  topProducts: [],
  lowStock: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setOverview: (state, action) => {
      state.overview = action.payload;
    },
    setSalesChart: (state, action) => {
      state.salesChart = action.payload;
    },
    setTopProducts: (state, action) => {
      state.topProducts = action.payload;
    },
    setLowStock: (state, action) => {
      state.lowStock = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setLoading,
  setOverview,
  setSalesChart,
  setTopProducts,
  setLowStock,
  setError,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
