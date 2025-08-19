import { useEffect, useState } from "react";
import apiClient from "../api/ApiClient";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Verification() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    apiClient
      .get("/verify", {
        params: {
          token: searchParams.get("token") || "",
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
          navigate("/");
        }}
      >
        Back to Home
      </button>
    </div>
  );
}
