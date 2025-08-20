"use client";

import type React from "react";

import { useState } from "react";
import apiClient, { useAuthRedirect } from "../api/ApiClient";

export default function Register() {
  useAuthRedirect(false);

  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !username || !password || !confirmPassword) {
      setMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    apiClient
      .post("/register", {
        email,
        username,
        password,
      })
      .then((response) => {
        if (response.status === 200 && response.data.message) {
          setMessage(response.data.message);
          setEmail("");
          setUsername("");
          setPassword("");
          setConfirmPassword("");
        } else {
          setMessage("Registration failed. Try again later.");
        }
      })
      .catch((error) => {
        if (error.response) {
          setMessage("Registration failed: " + error.response.data.detail);
        }
      });
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Create Account</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              required
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
              required
              type="text"
              name="username"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              required
              type="password"
              name="password"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              required
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-large">
            Create Account
          </button>

          {message && (
            <div
              className={`message ${message.includes("failed") || message.includes("required") || message.includes("match") ? "message-error" : "message-success"}`}
            >
              {message}
            </div>
          )}

          <div className="text-center mt-3">
            <span className="body-text">Already have an account? </span>
            <a href="/login" className="link">
              Sign In
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
