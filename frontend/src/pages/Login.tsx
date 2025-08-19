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
          }, 1000);
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
    <div>
      <p> Login </p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Enter your email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          name="password"
          placeholder="Enter your password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>
      </form>

      {message && <p>{message}</p>}

      <br />
      <p>
        Forgot your account? <a href="/forgot-password">Reset password</a>
      </p>
    </div>
  );
}
