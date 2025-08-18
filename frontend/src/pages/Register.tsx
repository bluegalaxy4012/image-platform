import { useState } from "react";
import apiClient, { useAuthRedirect } from "../api/ApiClient";

export default function Register() {
  useAuthRedirect(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

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
        if (
          response.status === 200 &&
          response.data.message === "User registered successfully"
        ) {
          setMessage("Registration successful! Now you can log in.");
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
          type="email"
          name="email"
          placeholder="Enter your email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          name="username"
          placeholder="Enter your username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          name="password"
          placeholder="Enter your password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password..."
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit">Register</button>

        {message && <p>{message}</p>}

        <p>
          {" "}
          Already have an account? <a href="/login">Login</a>{" "}
        </p>
      </form>
    </div>
  );
}
