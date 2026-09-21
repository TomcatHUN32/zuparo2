import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import {
  playOnlineOrderSound,
  isAudioMuted,
  toggleAudioMute as toggleSoundMute,
  testSound,
  setAudioMuted,
} from '../utils/soundAlert';

const API = (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL : '') + '/api';
const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user, ready } = useAuth();
  const [menu, setMenu] = useState([]);
  const [zones, setZones] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [restaurantStatus, setRestaurantStatus] = useState({
    isOpen: true,
    allowOrder247: true,
    customNotice: '0-24 órában fogadjuk rendeléseidet! Kiszállítás és átvétel zavartalan.',
  });
  const [loaded, setLoaded] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(isAudioMuted());
  const [lastOnlineOrder, setLastOnlineOrder] = useState(null);

  // Ref to track seen orders to detect fresh incoming ones
  const seenOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  const loadPublic = useCallback(async () => {
    const [m, z, c, cp, rs] = await Promise.all([
      axios.get(`${API}/menu`).then((r) => r.data).catch(() => []),
      axios.get(`${API}/zones`).then((r) => r.data).catch(() => []),
      axios.get(`${API}/couriers`).then((r) => r.data).catch(() => []),
      axios.get(`${API}/coupons`).then((r) => r.data).catch(() => []),
      axios.get(`${API}/restaurant/status`).then((r) => r.data).catch(() => null),
    ]);
    setMenu(m); setZones(z); setCouriers(c); setCoupons(cp);
    if (rs) setRestaurantStatus(rs);
  }, []);

  const loadAdmin = useCallback(async () => {
    const [cu, inv, o] = await Promise.all([
      axios.get(`${API}/customers`).then((r) => r.data).catch(() => []),
      axios.get(`${API}/inventory`).then((r) => r.data).catch(() => []),
      axios.get(`${API}/orders`).then((r) => r.data).catch(() => []),
    ]);
    setCustomers(cu); setInventory(inv);

    if (Array.isArray(o)) {
      setOrders(o);
      if (isFirstLoadRef.current) {
        o.forEach((item) => seenOrderIdsRef.current.add(item.id));
        isFirstLoadRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        // Try to seed if empty
        const m = await axios.get(`${API}/menu`).then((r) => r.data);
        if (!m || m.length === 0) await axios.post(`${API}/seed`);
        await loadPublic();
        if (user?.role === 'admin') await loadAdmin();
      } catch (e) {
        console.error('Data init error', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, [ready, user, loadPublic, loadAdmin]);

  // Polling for new orders when admin is active
  useEffect(() => {
    if (!ready || user?.role !== 'admin') return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/orders`);
        const latestOrders = res.data;
        if (!Array.isArray(latestOrders)) return;

        setOrders(latestOrders);

        // Check if any order is new (not in seenOrderIdsRef)
        let hasNewOnlineOrder = false;
        let newestOnlineOrderObj = null;

        for (const ord of latestOrders) {
          if (!seenOrderIdsRef.current.has(ord.id)) {
            seenOrderIdsRef.current.add(ord.id);

            // Is it an online order?
            const isOnline =
              ord.isOnlineOrder ||
              ord.channel === 'online' ||
              ord.payment === 'online' ||
              ord.source === 'web';

            if (isOnline) {
              hasNewOnlineOrder = true;
              newestOnlineOrderObj = ord;
            }
          }
        }

        if (hasNewOnlineOrder && newestOnlineOrderObj) {
          setLastOnlineOrder(newestOnlineOrderObj);
          // Play sound alert for the kitchen / counter!
          playOnlineOrderSound();
          toast.success(`🔔 ÚJ ONLINE RENDELÉS: ${newestOnlineOrderObj.id}`, {
            description: `${newestOnlineOrderObj.customerName || 'Vendég'} • ${newestOnlineOrderObj.total?.toLocaleString()} Ft`,
            duration: 9000,
          });
        }
      } catch (err) {
        // Polling error silently handled
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ready, user]);

  const toggleMute = () => {
    const nextVal = toggleSoundMute();
    setSoundMutedState(nextVal);
    if (!nextVal) {
      testSound();
      toast.success('Hangjelzés bekapcsolva');
    } else {
      toast.info('Hangjelzés némítva');
    }
    return nextVal;
  };

  const handleTestSound = () => {
    const ok = testSound();
    if (ok) {
      toast.info('🔔 Hangjelzés tesztelve');
    } else {
      toast.error('A böngésző blokkolta az audiót, kattints újra!');
    }
  };

  // -------- Orders --------
  const addOrder = async (o) => {
    const { data } = await axios.post(`${API}/orders`, o);
    setOrders((prev) => [data, ...prev]);
    if (user?.role === 'admin') {
      const [cs, inv] = await Promise.all([
        axios.get(`${API}/customers`).then((r) => r.data).catch(() => []),
        axios.get(`${API}/inventory`).then((r) => r.data).catch(() => []),
      ]);
      setCustomers(cs);
      if (inv && inv.length) setInventory(inv);
    }
    return data;
  };
  const updateOrder = async (id, patch) => {
    const { data } = await axios.put(`${API}/orders/${id}`, patch);
    setOrders((prev) => prev.map((o) => (o.id === id ? data : o)));
    if (user?.role === 'admin' && patch.status) {
      const inv = await axios.get(`${API}/inventory`).then((r) => r.data).catch(() => []);
      if (inv && inv.length) setInventory(inv);
    }
    return data;
  };
  const deleteOrder = async (id) => {
    await axios.delete(`${API}/orders/${id}`);
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // -------- Menu --------
  const addMenuItem = async (item) => {
    const { data } = await axios.post(`${API}/menu`, item);
    setMenu((prev) => [data, ...prev]);
  };
  const updateMenuItem = async (id, patch) => {
    const { data } = await axios.put(`${API}/menu/${id}`, patch);
    setMenu((prev) => prev.map((m) => (m.id === id ? data : m)));
  };
  const deleteMenuItem = async (id) => {
    await axios.delete(`${API}/menu/${id}`);
    setMenu((prev) => prev.filter((m) => m.id !== id));
  };

  // -------- Zones --------
  const addZone = async (z) => {
    const { data } = await axios.post(`${API}/zones`, z);
    setZones((prev) => [data, ...prev]);
  };
  const updateZone = async (id, patch) => {
    const { data } = await axios.put(`${API}/zones/${id}`, patch);
    setZones((prev) => prev.map((z) => (z.id === id ? data : z)));
  };
  const deleteZone = async (id) => {
    await axios.delete(`${API}/zones/${id}`);
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  // -------- Couriers --------
  const addCourier = async (c) => {
    const { data } = await axios.post(`${API}/couriers`, { ...c, active: true });
    setCouriers((prev) => [data, ...prev]);
  };
  const updateCourier = async (id, patch) => {
    const { data } = await axios.put(`${API}/couriers/${id}`, patch);
    setCouriers((prev) => prev.map((c) => (c.id === id ? data : c)));
  };
  const deleteCourier = async (id) => {
    await axios.delete(`${API}/couriers/${id}`);
    setCouriers((prev) => prev.filter((c) => c.id !== id));
  };

  // -------- Inventory --------
  const addInventory = async (it) => {
    const { data } = await axios.post(`${API}/inventory`, it);
    setInventory((prev) => [data, ...prev]);
  };
  const updateInventory = async (id, patch) => {
    const { data } = await axios.put(`${API}/inventory/${id}`, patch);
    setInventory((prev) => prev.map((i) => (i.id === id ? data : i)));
  };
  const deleteInventory = async (id) => {
    await axios.delete(`${API}/inventory/${id}`);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  // -------- Customers --------
  const deleteCustomer = async (id) => {
    await axios.delete(`${API}/customers/${id}`);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // -------- Coupons --------
  const addCoupon = async (c) => {
    const { data } = await axios.post(`${API}/coupons`, c);
    setCoupons((prev) => [data, ...prev]);
  };
  const updateCoupon = async (id, patch) => {
    const { data } = await axios.put(`${API}/coupons/${id}`, patch);
    setCoupons((prev) => prev.map((c) => (c.id === id ? data : c)));
  };
  const deleteCoupon = async (id) => {
    await axios.delete(`${API}/coupons/${id}`);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };
  const validateCoupon = async (code) => {
    const { data } = await axios.post(`${API}/coupons/validate`, { code });
    return data;
  };

  // -------- Reports & Closings --------
  const getDayReport = async (dateStr) => {
    const url = dateStr ? `${API}/reports/day?date=${encodeURIComponent(dateStr)}` : `${API}/reports/today`;
    const { data } = await axios.get(url);
    return data;
  };

  const closeDay = async (dateStr) => {
    const { data } = await axios.post(`${API}/reports/close-day`, { date: dateStr });
    return data;
  };

  const getDayCloses = async (searchQuery) => {
    const url = searchQuery ? `${API}/reports/history?q=${encodeURIComponent(searchQuery)}` : `${API}/reports/history`;
    const { data } = await axios.get(url);
    return data;
  };

  const getZoneFee = (zip) => zones.find((z) => z.zip === zip)?.fee ?? 0;

  // Restaurant Open/Close & 0-24 Ordering
  const updateRestaurantStatus = async (statusData) => {
    const { data } = await axios.post(`${API}/restaurant/status`, statusData);
    setRestaurantStatus(data);
    toast.success('Étterem beállítások frissítve');
    return data;
  };

  const toggleRestaurantOpen = async () => {
    const nextState = !restaurantStatus.isOpen;
    const { data } = await axios.post(`${API}/restaurant/status`, {
      isOpen: nextState,
      allowOrder247: restaurantStatus.allowOrder247,
      customNotice: restaurantStatus.customNotice,
    });
    setRestaurantStatus(data);
    toast.success(nextState ? 'Étterem megnyitva! Konyha aktív.' : 'Étterem zárva / konyha szünetel. 0-24 előrendelés aktív.');
    return data;
  };

  const uploadFoodImage = async (imageData) => {
    const { data } = await axios.post(`${API}/upload/image`, { image: imageData });
    return data.url;
  };

  return (
    <DataContext.Provider value={{
      menu, zones, couriers, customers, inventory, orders, coupons, loaded,
      addOrder, updateOrder, deleteOrder,
      addMenuItem, updateMenuItem, deleteMenuItem,
      addZone, updateZone, deleteZone,
      addCourier, updateCourier, deleteCourier,
      addInventory, updateInventory, deleteInventory,
      deleteCustomer,
      addCoupon, updateCoupon, deleteCoupon, validateCoupon,
      getZoneFee,
      getDayReport, closeDay, getDayCloses,
      soundMuted, toggleSoundMute: toggleMute, testSound: handleTestSound,
      lastOnlineOrder,
      restaurantStatus, updateRestaurantStatus, toggleRestaurantOpen, uploadFoodImage,
      reloadPublic: loadPublic, reloadAdmin: loadAdmin,
    }}>{children}</DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
