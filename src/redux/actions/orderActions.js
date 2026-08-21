import { Api } from "@/services/service";
import { mapApiOrderToRow, mapApiOrdersToRows } from "@/lib/orderMapper";
import {
  setOrders,
  setOrder,
  setTotal,
  setLoading,
  setError,
  addOrder,
  updateOrder,
  deleteOrder,
} from "../slices/orderSlice";

export const fetchOrders = (router, query = "", page = 1) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    const skip = (page - 1) * 20;
    let qs;
    if (query) {
      qs = query.startsWith("?") ? query : `?${query}`;
      qs += qs.includes("limit") ? "" : `&limit=20&skip=${skip}`;
    } else {
      qs = `?limit=20&skip=${skip}`;
    }
    const res = await Api("get", `orders${qs}`, "", router);
    if (res?.status) {
      const list = res.data?.data || [];
      const mapped = mapApiOrdersToRows(list);
      dispatch(setOrders(mapped));
      dispatch(setTotal(res.data?.pagination?.total ?? res.data?.total ?? mapped.length));
    } else {
      dispatch(setOrders([]));
      dispatch(setTotal(0));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message || "Failed to fetch orders"));
    dispatch(setOrders([]));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchOrderById = (id, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", `orders/${id}`, "", router);
    if (res?.status) {
      const raw = res.data?.data || res.data;
      dispatch(setOrder(mapApiOrderToRow(raw) || raw));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createOrder = (data, router) => async (dispatch) => {
  try {
    const res = await Api("post", "orders", data, router);
    if (res?.status) {
      const raw = res.data?.data || res.data;
      dispatch(addOrder(mapApiOrderToRow(raw) || raw));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const updateOrderById = (id, data, router) => async (dispatch) => {
  try {
    const res = await Api("put", `orders/${id}/status`, data, router);
    if (res?.status) {
      const raw = res.data?.data || res.data;
      dispatch(updateOrder(mapApiOrderToRow(raw) || raw));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const updateOrderNotes = (id, notes, router) => async (dispatch) => {
  try {
    const res = await Api("put", `orders/${id}/notes`, { notes }, router);
    if (res?.status) {
      const raw = res.data?.data || res.data;
      dispatch(updateOrder(mapApiOrderToRow(raw) || raw));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const deleteOrderById = (id, router) => async (dispatch) => {
  try {
    const res = await Api("delete", `orders/${id}`, "", router);
    if (res?.status) {
      dispatch(deleteOrder(id));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const fulfillOrder = (id, data, router) => async (dispatch) => {
  try {
    const res = await Api("put", `orders/${id}/status`, {
      orderStatus: "delivered",
      ...data,
    }, router);
    if (res?.status) {
      const raw = res.data?.data || res.data;
      dispatch(updateOrder(mapApiOrderToRow(raw) || raw));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const updateOrderPayment = (id, data, router) => async (dispatch) => {
  try {
    const res = await Api("put", `orders/${id}/status`, data, router);
    if (res?.status) {
      const raw = res.data?.data || res.data;
      dispatch(updateOrder(mapApiOrderToRow(raw) || raw));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

/** Admin: full order edit — line items, discounts, shipping, tax, tags. */
export const updateOrderDetails = (id, data, router) => async (dispatch) => {
  try {
    const res = await Api("put", `orders/${id}`, data, router);
    if (res?.status) {
      const raw = res.data?.data || res.data;
      dispatch(updateOrder(mapApiOrderToRow(raw) || raw));
    }
    return res;
  } catch (err) {
    return { status: false, message: err?.message || "Failed to update order" };
  }
};

export const duplicateOrderById = (id, router) => async (dispatch) => {
  try {
    const res = await Api("post", `orders/${id}/duplicate`, {}, router);
    if (res?.status) {
      const raw = res.data?.data || res.data;
      dispatch(addOrder(mapApiOrderToRow(raw) || raw));
      return { status: true, order: raw };
    }
    return res;
  } catch (err) {
    return { status: false, message: err?.message || "Failed to duplicate order" };
  }
};

export const addOrderComment = (id, message, router) => async () => {
  try {
    return await Api("post", `orders/${id}/comments`, { message }, router);
  } catch (err) {
    return { status: false, message: err?.message || "Failed to add comment" };
  }
};

export const deleteOrderComment = (id, entryId, router) => async () => {
  try {
    return await Api("delete", `orders/${id}/comments/${entryId}`, "", router);
  } catch (err) {
    return { status: false, message: err?.message || "Failed to delete comment" };
  }
};

export const sendOrderInvoice = (id, data, router) => async () => {
  try {
    return await Api("post", `orders/${id}/invoice`, data, router);
  } catch (err) {
    return { status: false, message: err?.message || "Failed to send invoice" };
  }
};
