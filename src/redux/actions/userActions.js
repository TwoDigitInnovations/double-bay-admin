import { Api, ApiFormData } from "@/services/service";
import {
  setUser,
  setUsers,
  setCurrentUser,
  setLoading,
  setError,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "../slices/userSlice";

export const loginUser = (data, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("post", "auth/login", data, router);

    if (res?.status) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userDetail", JSON.stringify(res.data.user));
      dispatch(setUser(res.data.user));
      router.push("/");
      return { success: true };
    } else {
      dispatch(setError(res?.message));
      return res;
    }
  } catch (err) {
    dispatch(setLoading(false));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const registerUser = (data, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("post", "auth/register", data, router);
    return res;
  } catch (err) {
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchProfile = (router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", "auth/profile", "", router);
    if (res?.status) {
      localStorage.setItem("userDetail", JSON.stringify(res.data));
      dispatch(setUser(res.data));
    }
  } catch (err) {
    // silently fail — profile fetch is non-critical
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateProfile = (data, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await ApiFormData("put", "auth/profile", data, router);
    if (res?.status) {
      localStorage.setItem("userDetail", JSON.stringify(res.data));
      dispatch(setUser(res.data));
    }
    return res;
  } catch (err) {
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchUsers = (router, role = null) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const url = role ? `auth/users?role=${role}` : "auth/users";
    const res = await Api("get", url, "", router);
    if (res?.status) {
      dispatch(setUsers(res.data?.data || []));
      return res.data?.data || [];
    }
    return [];
  } catch (err) {
    return [];
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchUserById = (id, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", `auth/users/${id}`, "", router);
    if (res?.status) {
      dispatch(setCurrentUser(res.data?.data));
    }
  } catch (err) {
    // ignore
  } finally {
    dispatch(setLoading(false));
  }
};

export const deleteCustomerById = (id, router) => async (dispatch) => {
  try {
    const res = await Api("delete", `auth/users/${id}`, "", router);
    if (res?.status) {
      dispatch(deleteCustomer(id));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const blockUnblockCustomer = (data, router) => async (dispatch) => {
  try {
    const res = await Api("put", "auth/users/block", data, router);
    if (res?.status) {
      dispatch(updateCustomer(res.data));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const createCustomer = (data, router) => async (dispatch) => {
  try {
    const res = await ApiFormData("post", "auth/register", data, router);
    if (res?.status) {
      dispatch(addCustomer(res.data));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const updateCustomerById = (id, data, router) => async (dispatch) => {
  try {
    const res = await ApiFormData("put", `auth/users/${id}`, data, router);
    if (res?.status) {
      dispatch(updateCustomer(res.data));
    }
    return res;
  } catch (err) {
    throw err;
  }
};
