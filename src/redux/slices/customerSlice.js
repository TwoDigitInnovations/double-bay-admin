import { createSlice } from "@reduxjs/toolkit";

const customerSlice = createSlice({
  name: "customer",
  initialState: {
    customers: [],
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    setCustomers: (state, action) => {
      state.customers = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setTotal: (state, action) => {
      state.total = action.payload;
    },
    updateCustomer: (state, action) => {
      const idx = state.customers.findIndex((c) => c._id === action.payload._id);
      if (idx !== -1) state.customers[idx] = action.payload;
    },
    removeCustomer: (state, action) => {
      state.customers = state.customers.filter((c) => c._id !== action.payload);
    },
  },
});

export const {
  setCustomers,
  setLoading,
  setError,
  setTotal,
  updateCustomer,
  removeCustomer,
} = customerSlice.actions;

export default customerSlice.reducer;
