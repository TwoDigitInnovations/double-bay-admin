import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  collections: [],
  collection: null,
  loading: false,
  error: null,
  total: 0,
};

const collectionSlice = createSlice({
  name: "collection",
  initialState,
  reducers: {
    setCollections: (state, action) => {
      state.collections = action.payload;
    },

    setCollection: (state, action) => {
      state.collection = action.payload;
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

    addCollection: (state, action) => {
      state.collections.unshift(action.payload);
      state.total += 1;
    },

    updateCollection: (state, action) => {
      const index = state.collections.findIndex(
        (c) => c._id === action.payload._id,
      );
      if (index !== -1) state.collections[index] = action.payload;
      if (state.collection?._id === action.payload._id)
        state.collection = action.payload;
    },

    deleteCollection: (state, action) => {
      state.collections = state.collections.filter(
        (c) => c._id !== action.payload,
      );
      state.total = Math.max(0, state.total - 1);
    },
  },
});

export const {
  setCollections,
  setCollection,
  setTotal,
  setLoading,
  setError,
  addCollection,
  updateCollection,
  deleteCollection,
} = collectionSlice.actions;

export default collectionSlice.reducer;
