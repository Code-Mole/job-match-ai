import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Verify the token is still valid by fetching the current user
      axios
        .get("/api/auth/me")
        .then(({ data }) => setUser(data.user))
        .catch(() => {
          // Token expired or invalid — clear everything
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete axios.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post("/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post("/api/auth/register", {
      name,
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  };

  const updateProfile = async (updates) => {
    const { data } = await axios.put("/api/auth/profile", updates);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// TEMPORARY: demo login bypass — remove in Step 3 when backend is ready
const login = async (email, password) => {
  // In Step 3 this becomes: const { data } = await axios.post('/api/auth/login', ...)
  const demoUser = { id: "1", name: "Alex Johnson", email };
  localStorage.setItem("token", "demo-token");
  localStorage.setItem("user", JSON.stringify(demoUser));
  setUser(demoUser);
  return { user: demoUser, token: "demo-token" };
};

const register = async (name, email, password) => {
  const demoUser = { id: "1", name, email };
  localStorage.setItem("token", "demo-token");
  localStorage.setItem("user", JSON.stringify(demoUser));
  setUser(demoUser);
  return { user: demoUser, token: "demo-token" };
};
