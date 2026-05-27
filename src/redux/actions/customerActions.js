import { Api } from "@/services/service";
import {
  setCustomers,
  setLoading,
  setError,
  setTotal,
  updateCustomer,
  removeCustomer,
} from "../slices/customerSlice";

export const fetchCustomers = (router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", "auth/users?role=user&limit=100", "", router);
    if (res?.status) {
      dispatch(setCustomers(res.data?.data || res.data || []));
      dispatch(setTotal(res.data?.pagination?.total || 0));
    }
  } catch (err) {
    dispatch(setError(err?.message || "Failed to fetch customers"));
  } finally {
    dispatch(setLoading(false));
  }
};

export const blockUnblockCustomer = (userId, isBlocked, router) => async (dispatch) => {
  try {
    const res = await Api("put", "auth/users/block", { userId, isBlocked }, router);
    if (res?.status) {
      dispatch(updateCustomer(res.data?.data || res.data));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const deleteCustomer = (id, router) => async (dispatch) => {
  try {
    const res = await Api("delete", `auth/users/${id}`, "", router);
    if (res?.status) {
      dispatch(removeCustomer(id));
    }
    return res;
  } catch (err) {
    throw err;
  }
};
