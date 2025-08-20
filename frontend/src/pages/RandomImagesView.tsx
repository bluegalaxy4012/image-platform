"use client";

import { useEffect, useState } from "react";
import apiClient from "../api/ApiClient";
import { useNavigate } from "react-router-dom";

export default function RandomImagesView() {
  const navigate = useNavigate();

  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiClient
      .get("/images/random")
      .then(async (response) => {
        const imageIds = response.data as { id: string }[];
        const urls: string[] = [];

        for (const img of imageIds) {
          const blobRes = await apiClient.post(
            `/images/${img.id}`,
            {},
            { responseType: "blob" },
          );

          const url = URL.createObjectURL(blobRes.data);
          urls.push(url);
        }

        setImages(urls);
      })
      .catch(() => setError("Could not fetch random images"));
  }, []);

  if (error)
    return (
      <div className="container">
        <div className="card text-center">
          <div className="message message-error">{error}</div>
        </div>
      </div>
    );

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Random Public Images</h1>

        {images.length === 0 ? (
          <div className="loading">
            <div className="spinner"></div>
            Loading images...
          </div>
        ) : (
          <div className="image-grid">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Random image ${i}`}
                className="image-display"
              />
            ))}
          </div>
        )}

        <button onClick={() => navigate("/")} className="btn btn-secondary">
          Back to Home
        </button>
      </div>
    </div>
  );
}
