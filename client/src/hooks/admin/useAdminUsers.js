import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_FILTERS = { search: "", role: "", isActive: "" };

export default function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const { showToast } = useToast();
  const { user: currentAdmin } = useAuth();
  const debounceRef = useRef(null);

  const buildParams = useCallback(
    (overridePage) => {
      const params = { page: overridePage || page, limit };
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== "") params[key] = val;
      });
      return params;
    },
    [filters, page],
  );

  const fetchUsers = useCallback(
    async (overridePage) => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/admin/users", {
          params: buildParams(overridePage),
        });
        setUsers(data.users);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err) {
        showToast(
          err.response?.data?.message || "Failed to load users.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [buildParams, showToast],
  );

  // Debounce search specifically
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, filters.isActive, page]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== "search") setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const isSelf = (userId) => String(userId) === String(currentAdmin?._id);

  const changeRole = async (userId, role) => {
    try {
      const { data } = await axios.patch(`/api/admin/users/${userId}/role`, {
        role,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, role: data.user.role } : u,
        ),
      );
      showToast(data.message, "success");
      return true;
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to change role.",
        "error",
      );
      return false;
    }
  };

  const changeStatus = async (userId, isActive) => {
    try {
      const { data } = await axios.patch(`/api/admin/users/${userId}/status`, {
        isActive,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: data.user.isActive } : u,
        ),
      );
      showToast(data.message, "success");
      return true;
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update status.",
        "error",
      );
      return false;
    }
  };

  const deleteUser = async (userId) => {
    try {
      const { data } = await axios.delete(`/api/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setTotal((prev) => prev - 1);
      showToast(data.message, "success");
      return true;
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete user.",
        "error",
      );
      return false;
    }
  };

  return {
    users,
    total,
    page,
    pages,
    limit,
    filters,
    loading,
    isSelf,
    setPage,
    updateFilter,
    clearFilters,
    changeRole,
    changeStatus,
    deleteUser,
  };
}
