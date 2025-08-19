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
    <div>
      <p> Register </p>

      <form onSubmit={handleSubmit}>
        <input
          required
          type="email"
          name="email"
          placeholder="Enter your email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          required
          type="text"
          name="username"
          placeholder="Enter your username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          required
          type="password"
          name="password"
          placeholder="Enter your password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          required
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password..."
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit">Register</button>

        {message && <p>{message}</p>}

        <br />

        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  );
}
