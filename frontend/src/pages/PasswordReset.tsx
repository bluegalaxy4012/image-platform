import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../api/ApiClient";

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
      setIsValid(false);
      return;
    }

    apiClient
      .post("/reset-password/verify", { token })
      .then((response) => {
        setMessage(response.data.message);
        setIsValid(true);
      })
      .catch((e) => {
        setError(e.response?.data?.detail || "Invalid reset token.");
        setIsValid(false);
      });
  }, [token]);

  const handleReset = async () => {
    if (newPassword !== retypePassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    //   try {
    //     const response = await apiClient.post("/reset-password", {
    //       token,
    //       new_password: newPassword,
    //     });
    //     setMessage(response.data.message);
    //     setError("");
    //     setTimeout(() => navigate("/login"), 3000);
    //   } catch (e: any) {
    //     setError(e.response?.data?.detail || "Failed to reset password.");
    //   }
    // };

    apiClient
      .post("/reset-password", {
        token,
        new_password: newPassword,
      })
      .then((response) => {
        if (response.data) setMessage(response.data.message);

        setError("");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((error) => {
        if (error.response) setError(error.response.data.detail);
      });
  };

  if (isValid === null) return <div>Loading...</div>;

  if (!isValid)
    return (
      <div>
        <h1>Reset Password</h1>
        <p>{error}</p>
        <button onClick={() => navigate("/forgot-password")}>Try Again</button>
        <button onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    );

  return (
    <div>
      <h1>Reset Password</h1>
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
      <div>
        <label>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
      </div>
      <div>
        <label>Retype Password</label>
        <input
          type="password"
          value={retypePassword}
          onChange={(e) => setRetypePassword(e.target.value)}
          placeholder="Retype new password"
        />
      </div>
      <button onClick={handleReset}>Reset Password</button>
      <button onClick={() => navigate("/login")}>Back to Login</button>
    </div>
  );
}
