import { useEffect, useState } from "react";
import apiClient, { checkAuth } from "../api/ApiClient";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth()
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <div>
      <h1>Image Platform</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const imageId = (e.target as HTMLFormElement).elements.namedItem(
            "imageId",
          ) as HTMLInputElement;
          if (imageId.value) {
            window.location.href = `/images/${imageId.value}`;
          }
        }}
      >
        <input type="text" name="imageId" placeholder="Enter Image ID" />
        <button type="submit" className="rounded">
          View Image
        </button>
      </form>

      {isLoggedIn && (
        <button
          onClick={() => {
            apiClient.post("/logout").then(() => {
              window.location.reload();
            });
          }}
        >
          {" "}
          Logout{" "}
        </button>
      )}

      {isLoggedIn && (
        <button
          className="rounded"
          onClick={() => {
            window.location.href = "/upload";
          }}
        >
          Upload image
        </button>
      )}

      {!isLoggedIn && (
        <button
          className="rounded"
          onClick={() => {
            window.location.href = "/register";
          }}
        >
          Register/Login to see upload images
        </button>
      )}
    </div>
  );
}
