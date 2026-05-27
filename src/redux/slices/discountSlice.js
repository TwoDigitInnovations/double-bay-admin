import { createSlice } from "@reduxjs/toolkit";

const discountSlice = createSlice({
  name: "discount",
  initialState: {
    discounts: [],
    discount: null,
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    setDiscounts: (state, action) => { state.discounts = action.payload; },
    setDiscount:  (state, action) => { state.discount  = action.payload; },
    setLoading:   (state, action) => { state.loading   = action.payload; },
    setError:     (state, action) => { state.error     = action.payload; },
    setTotal:     (state, action) => { state.total     = action.payload; },
    addDiscount:  (state, action) => { state.discounts.unshift(action.payload); },
    updateDiscount: (state, action) => {
      const idx = state.discounts.findIndex((d) => d._id === action.payload._id);
      if (idx !== -1) state.discounts[idx] = action.payload;
    },
    removeDiscount: (state, action) => {
      state.discounts = state.discounts.filter((d) => d._id !== action.payload);
    },
  },
});

export const {
  setDiscounts, setDiscount, setLoading, setError, setTotal,
  addDiscount, updateDiscount, removeDiscount,
} = discountSlice.actions;

export default discountSlice.reducer;
