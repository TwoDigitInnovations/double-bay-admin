import { Api } from '@/services/service';
import {
  setLoading,
  setOverview,
  setSalesChart,
  setTopProducts,
  setLowStock,
  setError,
} from '@/redux/slices/dashboardSlice';

export const fetchDashboardOverview = (router) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await Api('get', 'dashboard/overview', '', router);
    if (res?.status) {
      dispatch(setOverview(res.data?.data || res.data));
      dispatch(setError(null));
    } else {
      dispatch(setError(res?.message || 'Failed to fetch overview'));
    }
  } catch (error) {
    dispatch(setError(error?.message || 'Error fetching overview'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchSalesChart = (router, period = 'monthly', year) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    // `year` only narrows a monthly chart; a yearly one spans every year.
    const qs = new URLSearchParams({ period });
    if (period === 'monthly' && year) qs.set('year', String(year));
    const res = await Api('get', `dashboard/sales-chart?${qs.toString()}`, '', router);
    if (res?.status) {
      dispatch(setSalesChart(res.data?.data || res.data || []));
      dispatch(setError(null));
    } else {
      dispatch(setError(res?.message || 'Failed to fetch sales chart'));
    }
  } catch (error) {
    dispatch(setError(error?.message || 'Error fetching sales chart'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchTopProducts = (router, limit = 10) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await Api('get', `dashboard/top-products?limit=${limit}`, '', router);
    if (res?.status) {
      dispatch(setTopProducts(res.data?.data || res.data || []));
      dispatch(setError(null));
    } else {
      dispatch(setError(res?.message || 'Failed to fetch top products'));
    }
  } catch (error) {
    dispatch(setError(error?.message || 'Error fetching top products'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchLowStock = (router, threshold = 10, limit = 5) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await Api('get', `inventory/low-stock?threshold=${threshold}&limit=${limit}&page=1`, '', router);
    if (res?.status) {
      dispatch(setLowStock(res.data?.data || res.data || []));
      dispatch(setError(null));
    } else {
      dispatch(setError(res?.message || 'Failed to fetch low stock'));
    }
  } catch (error) {
    dispatch(setError(error?.message || 'Error fetching low stock'));
  } finally {
    dispatch(setLoading(false));
  }
};
