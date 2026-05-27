import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  product: null,
  loading: false,
  error: null,
  total: 0,
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },

    setProduct: (state, action) => {
      state.product = action.payload;
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

    addProduct: (state, action) => {
      state.products.unshift(action.payload);
      state.total += 1;
    },

    updateProduct: (state, action) => {
      const index = state.products.findIndex(
        (p) => p._id === action.payload._id,
      );
      if (index !== -1) state.products[index] = action.payload;
      if (state.product?._id === action.payload._id)
        state.product = action.payload;
    },

    deleteProduct: (state, action) => {
      state.products = state.products.filter((p) => p._id !== action.payload);
      state.total = Math.max(0, state.total - 1);
    },
  },
});

export const {
  setProducts,
  setProduct,
  setTotal,
  setLoading,
  setError,
  addProduct,
  updateProduct,
  deleteProduct,
} = productSlice.actions;

export default productSlice.reducer;
