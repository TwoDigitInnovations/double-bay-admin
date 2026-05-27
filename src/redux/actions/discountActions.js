import { Api } from "@/services/service";
import {
  setDiscounts, setDiscount, setLoading, setError, setTotal,
  addDiscount, updateDiscount, removeDiscount,
} from "../slices/discountSlice";

export const fetchDiscounts = (router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", "coupons", "", router);
    if (res?.status) {
      dispatch(setDiscounts(res.data?.data || res.data || []));
      dispatch(setTotal(res.data?.pagination?.total || 0));
    }
  } catch (err) {
    dispatch(setError(err?.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchDiscountById = (id, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", `coupons/${id}`, "", router);
    if (res?.status) dispatch(setDiscount(res.data?.data || res.data));
    return res;
  } catch (err) {
    dispatch(setError(err?.message));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createDiscount = (data, router) => async (dispatch) => {
  try {
    const res = await Api("post", "coupons", data, router);
    if (res?.status) dispatch(addDiscount(res.data?.data || res.data));
    return res;
  } catch (err) {
    throw err;
  }
};

export const updateDiscountById = (id, data, router) => async (dispatch) => {
  try {
    const res = await Api("put", `coupons/${id}`, data, router);
    if (res?.status) dispatch(updateDiscount(res.data?.data || res.data));
    return res;
  } catch (err) {
    throw err;
  }
};

export const deleteDiscountById = (id, router) => async (dispatch) => {
  try {
    const res = await Api("delete", `coupons/${id}`, "", router);
    if (res?.status) dispatch(removeDiscount(id));
    return res;
  } catch (err) {
    throw err;
  }
};
