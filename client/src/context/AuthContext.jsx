import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Point all API calls at our Express backend
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app load, check if we have a saved token and fetch the user profile
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // We'll call /api/auth/me once the backend is ready (Step 3)
      // For now, try to parse the stored user
      try {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post("/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
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
    localStorage.setItem("user", JSON.stringify(data.user));
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
  const demoUser = { id: '1', name: 'Alex Johnson', email }
  localStorage.setItem('token', 'demo-token')
  localStorage.setItem('user', JSON.stringify(demoUser))
  setUser(demoUser)
  return { user: demoUser, token: 'demo-token' }
}

const register = async (name, email, password) => {
  const demoUser = { id: '1', name, email }
  localStorage.setItem('token', 'demo-token')
  localStorage.setItem('user', JSON.stringify(demoUser))
  setUser(demoUser)
  return { user: demoUser, token: 'demo-token' }
}