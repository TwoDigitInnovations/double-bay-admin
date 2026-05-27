import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orders: [],
  order: null,
  loading: false,
  error: null,
  total: 0,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
    },

    setOrder: (state, action) => {
      state.order = action.payload;
    },

    setTotal: (state, action) => {
      state.total = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
      state.total += 1;
    },

    updateOrder: (state, action) => {
      const index = state.orders.findIndex(
        (o) => o._id === action.payload._id,
      );
      if (index !== -1) state.orders[index] = action.payload;
      if (state.order?._id === action.payload._id)
        state.order = action.payload;
    },

    deleteOrder: (state, action) => {
      state.orders = state.orders.filter((o) => o._id !== action.payload);
      state.total = Math.max(0, state.total - 1);
    },
  },
});

export const {
  setOrders,
  setOrder,
  setTotal,
  setLoading,
  setError,
  addOrder,
  updateOrder,
  deleteOrder,
} = orderSlice.actions;

export default orderSlice.reducer;
