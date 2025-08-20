"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/ApiClient";

export default function PasswordForget() {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email) {
      setError("Email is required.");
      return;
    }

    apiClient
      .post("/forgot-password", { email })
      .then((response) => {
        if (response.data) setMessage(response.data.message);

        setError("");
        setTimeout(() => navigate("/login"), 5000);
      })
      .catch((error) => {
        if (error.response) setError(error.response.data.detail);

        setMessage("");
      });
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Forgot Password</h1>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="form-input"
          />
        </div>

        <div className="btn-group-vertical">
          <button onClick={handleSubmit} className="btn btn-primary btn-full">
            Send Reset Link
          </button>

          <button
            onClick={() => navigate("/login")}
            className="btn btn-secondary btn-full"
          >
            Back to Login
          </button>
        </div>

        {message && <div className="message message-success">{message}</div>}

        {error && <div className="message message-error">{error}</div>}
      </div>
    </div>
  );
}
