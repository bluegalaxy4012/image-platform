import { useEffect, useState } from "react";
import apiClient, { checkAuth } from "../api/ApiClient";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

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
            navigate(`/images/${imageId.value}`);
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
              setIsLoggedIn(false);
              navigate("/");
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
            navigate("/upload");
          }}
        >
          Upload image
        </button>
      )}

      {!isLoggedIn && (
        <button
          className="rounded"
          onClick={() => {
            navigate("/register");
          }}
        >
          Register/Login to see upload images
        </button>
      )}

      <button
        className="rounded"
        onClick={() => {
          navigate("/random-images");
        }}
      >
        View random public images
      </button>
    </div>
  );
}
