import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import productReducer from "./slices/productSlice";
import orderReducer from "./slices/orderSlice";
import collectionReducer from "./slices/collectionSlice";
import customerReducer from "./slices/customerSlice";
import discountReducer from "./slices/discountSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    product: productReducer,
    order: orderReducer,
    collection: collectionReducer,
    customer: customerReducer,
    discount: discountReducer,
  },
});
