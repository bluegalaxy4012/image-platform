"use client";

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

  if (isValid === null)
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading">
            <div className="spinner"></div>
            Verifying reset token...
          </div>
        </div>
      </div>
    );

  if (!isValid)
    return (
      <div className="container">
        <div className="card text-center">
          <h1 className="title">Reset Password</h1>
          <div className="message message-error">{error}</div>
          <div className="btn-group">
            <button
              onClick={() => navigate("/forgot-password")}
              className="btn btn-primary"
            >
              Try Again
            </button>

            <button
              onClick={() => navigate("/login")}
              className="btn btn-secondary"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Reset Password</h1>

        {message && <div className="message message-success">{message}</div>}

        {error && <div className="message message-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Retype Password</label>
          <input
            type="password"
            value={retypePassword}
            onChange={(e) => setRetypePassword(e.target.value)}
            placeholder="Retype new password"
            className="form-input"
          />
        </div>

        <div className="btn-group-vertical">
          <button onClick={handleReset} className="btn btn-primary btn-full">
            Reset Password
          </button>

          <button
            onClick={() => navigate("/login")}
            className="btn btn-secondary btn-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
