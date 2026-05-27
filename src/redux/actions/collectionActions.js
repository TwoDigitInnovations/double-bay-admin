import { Api, ApiFormData } from "@/services/service";
import {
  setCollections,
  setCollection,
  setTotal,
  setLoading,
  setError,
  addCollection,
  updateCollection,
  deleteCollection,
} from "../slices/collectionSlice";

export const fetchCollections = (router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", "collections", "", router);
    if (res?.status) {
      dispatch(setCollections(res.data?.data || res.data || []));
      dispatch(setTotal(res.data?.total || 0));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message || "Failed to fetch collections"));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchCollectionById = (id, router) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await Api("get", `collections/${id}`, "", router);
    if (res?.status) {
      dispatch(setCollection(res.data?.data || res.data));
    }
    return res;
  } catch (err) {
    dispatch(setError(err?.message));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

// formData includes: name, description, type, status, featured,
// channels (JSON), conditions (JSON), themeTemplate, seo (JSON),
// image (file), banner (file)
export const createCollection = (formData, router) => async (dispatch) => {
  try {
    const res = await ApiFormData("post", "collections", formData, router);
    if (res?.status) {
      dispatch(addCollection(res.data?.data || res.data));
    }
    return res;
  } catch (err) {
    throw err;
  }
};

export const updateCollectionById =
  (id, formData, router) => async (dispatch) => {
    try {
      const res = await ApiFormData(
        "put",
        `collections/${id}`,
        formData,
        router,
      );
      if (res?.status) {
        dispatch(updateCollection(res.data?.data || res.data));
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

export const deleteCollectionById = (id, router) => async (dispatch) => {
  try {
    const res = await Api("delete", `collections/${id}`, "", router);
    if (res?.status) {
      dispatch(deleteCollection(id));
    }
    return res;
  } catch (err) {
    throw err;
  }
};
