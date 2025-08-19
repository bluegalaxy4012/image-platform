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

    // try {
    //   const response = await apiClient.post("/forgot-password", { email });
    //   setMessage(response.data.message);
    //   setError("");
    //   setTimeout(() => navigate("/login"), 4000);
    // } catch (error: any) {
    //   setError(error.response?.data?.detail || "Failed to send reset email.");
    //   setMessage("");
    // }

    apiClient
      .post("/forgot-password", { email })
      .then((response) => {
        if (response.data) setMessage(response.data.message);

        setError("");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((error) => {
        if (error.response) setError(error.response.data.detail);

        setMessage("");
      });
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
      </div>
      <button onClick={handleSubmit}>Send Reset Link</button>
      <button onClick={() => navigate("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
    </div>
  );
}
