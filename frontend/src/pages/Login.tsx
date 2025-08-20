"use client";

import type React from "react";

import { useState } from "react";
import apiClient, { useAuthRedirect } from "../api/ApiClient";

export default function Login() {
  useAuthRedirect(false);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("All fields are required.");
      return;
    }

    apiClient
      .post("/login", {
        email,
        password,
      })
      .then((response) => {
        if (response.status === 200) {
          setMessage("Logged in");
          setEmail("");
          setPassword("");

          setTimeout(() => {
            window.location.href = "/";
          }, 850);
        } else {
          setMessage("Login failed. Try again later.");
        }
      })
      .catch((error) => {
        if (error.response) {
          setMessage("Login failed: " + error.response.data.detail);
        }
      });
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Welcome Back</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-large">
            Sign In
          </button>
        </form>

        {/* based on message / error */}
        {message && (
          <div
            className={`message ${message.includes("failed") || message.includes("required") ? "message-error" : "message-success"}`}
          >
            {message}
          </div>
        )}

        <div className="text-center mt-3">
          <span className="body-text">Forgot your password? </span>

          <a href="/forgot-password" className="link">
            Reset it here
          </a>
        </div>
      </div>
    </div>
  );
}
