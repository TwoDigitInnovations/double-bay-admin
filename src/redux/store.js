import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import productReducer from "./slices/productSlice";
import orderReducer from "./slices/orderSlice";
import collectionReducer from "./slices/collectionSlice";
import customerReducer from "./slices/customerSlice";
import discountReducer from "./slices/discountSlice";
import dashboardReducer from "./slices/dashboardSlice";
import orderAnalyticsReducer from "./slices/orderAnalyticsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    product: productReducer,
    order: orderReducer,
    collection: collectionReducer,
    customer: customerReducer,
    discount: discountReducer,
    dashboard: dashboardReducer,
    orderAnalytics: orderAnalyticsReducer,
  },
});
