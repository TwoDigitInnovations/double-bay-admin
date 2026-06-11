import { Api } from '@/services/service';
import {
  setTodayStats,
  setLoading,
  setError,
} from '@/redux/slices/orderAnalyticsSlice';

export const fetchOrderStats = (router, range = 'today') => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    console.log('[fetchOrderStats] Fetching with range:', range);
    const res = await Api('get', `orders/analytics?range=${range}`, '', router);
    console.log('[fetchOrderStats] Full API Response:', res);
    console.log('[fetchOrderStats] res.status:', res?.status);
    console.log('[fetchOrderStats] res.data:', res?.data);
    console.log('[fetchOrderStats] res type:', typeof res);

    if (res?.status === true && res?.data) {
      console.log('[fetchOrderStats] Dispatching stats:', res.data.data || res.data);
      dispatch(setTodayStats(res.data.data || res.data));
      dispatch(setError(null));
      console.log('[fetchOrderStats] Successfully dispatched');
    } else {
      console.error('[fetchOrderStats] Invalid response:', res);
      dispatch(setError('Invalid response'));
    }
  } catch (error) {
    console.error('[fetchOrderStats] Exception caught:', error);
    dispatch(setError(error?.message || 'Error fetching stats'));
  } finally {
    dispatch(setLoading(false));
  }
};
