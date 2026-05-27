import { Api, ApiFormData } from "@/services/service";
import {
  setProducts,
  setProduct,
  setTotal,
  setLoading,
  setError,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../slices/productSlice";

export const fetchProducts = (router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", "products", "", router);
    if (res?.status) {
      dispatch(setProducts(res.data?.data || res.data || []));
      dispatch(setTotal(res.data?.total || res.data?.length || 0));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message || "Failed to fetch products"));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchProductById = (id, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", `products/${id}`, "", router);
    if (res?.status) {
      dispatch(setProduct(res.data?.data || res.data));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchProductBySlug = (slug, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", `products/slug/${slug}`, "", router);
    if (res?.status) {
      dispatch(setProduct(res.data?.data || res.data));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchPublicProducts = (router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", "products/public", "", router);
    if (res?.status) {
      dispatch(setProducts(res.data?.data || res.data || []));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchFeaturedProducts = (router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", "products/featured", "", router);
    if (res?.status) {
      dispatch(setProducts(res.data?.data || res.data || []));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const createProduct = (data, router) => async (dispatch) => {
  try {
    const res = await ApiFormData("post", "products", data, router);
    if (res?.status) {
      dispatch(addProduct(res.data?.data || res.data));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const updateProductById = (id, data, router) => async (dispatch) => {
  try {
    const res = await ApiFormData("put", `products/${id}`, data, router);
    if (res?.status) {
      dispatch(updateProduct(res.data?.data || res.data));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const deleteProductById = (id, router) => async (dispatch) => {
  try {
    const res = await Api("delete", `products/${id}`, "", router);
    if (res?.status) {
      dispatch(deleteProduct(id));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const updateProductStock = (id, data, router) => async (dispatch) => {
  try {
    const res = await Api("patch", `products/${id}/stock`, data, router);
    if (res?.status) {
      dispatch(updateProduct(res.data?.data || res.data));
    }
    return res;
  } catch (err) {
    throw err;
  }
};
