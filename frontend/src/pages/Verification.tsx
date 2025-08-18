import { useEffect, useState } from "react";
import apiClient from "../api/ApiClient";
import { useSearchParams } from "react-router-dom";

export default function Verification() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    apiClient
      .get("/verify", {
        params: {
          email: searchParams.get("email") || "",
          code: searchParams.get("code") || "",
        },
      })
      .then((response) => {
        if (response.status === 200) setMessage(response.data.message);
        else setMessage("Verification failed. Try reloading the page.");
      })
      .catch((error) => {
        if (error.response) {
          setMessage(error.response.data.detail);
        }
      });
  }, [searchParams]);

  return (
    <div>
      <h1>Verification</h1>

      {message && <p>{message}</p>}

      <button
        onClick={() => {
          window.location.href = "/";
        }}
      >
        Back to Home
      </button>
    </div>
  );
}
