"use client";

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
    <div className="container">
      <div className="card text-center">
        <h1 className="title">Image Platform</h1>

        <div className="content-card">
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
            <div className="form-group">
              <input
                type="text"
                name="imageId"
                placeholder="Enter Image ID"
                className="form-input"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              View Image
            </button>
          </form>
        </div>

        <div className="btn-group-vertical">
          {isLoggedIn && (
            <button
              onClick={() => {
                apiClient.post("/logout").then(() => {
                  setIsLoggedIn(false);
                  navigate("/");
                });
              }}
              className="btn btn-secondary"
            >
              Sign Out
            </button>
          )}

          {isLoggedIn && (
            <button
              onClick={() => {
                navigate("/upload");
              }}
              className="btn btn-primary"
            >
              Upload Image
            </button>
          )}

          {!isLoggedIn && (
            <button
              onClick={() => {
                navigate("/register");
              }}
              className="btn btn-primary"
            >
              Register/Login to Upload Images
            </button>
          )}

          <button
            onClick={() => {
              navigate("/random-images");
            }}
            className="btn btn-secondary"
          >
            View Random Public Images
          </button>
        </div>
      </div>
    </div>
  );
}
