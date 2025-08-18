import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export function useAuthRedirect(shouldBeLoggedIn: boolean) {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth()
      .then(() => {
        if (!shouldBeLoggedIn) {
          navigate("/");
        }
      })
      .catch(() => {
        if (shouldBeLoggedIn) {
          navigate("/register");
        }
      });
  }, [navigate, shouldBeLoggedIn]);
}

export function checkAuth() {
  return apiClient.get("/testauth");
}

export default apiClient;
