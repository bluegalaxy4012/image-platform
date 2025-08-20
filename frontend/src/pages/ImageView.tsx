"use client";

import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/ApiClient";
import { copyToClipboard } from "../utils/utils";

export default function ImageView() {
  const navigate = useNavigate();

  const { imageId } = useParams<string>();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false);

  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  const fetchImage = useCallback(
    (pass?: string) => {
      if (!imageId) return;

      apiClient
        .post(
          `/images/${imageId}`,
          { password: pass || undefined },
          { responseType: "blob" },
        )
        .then((response) => {
          const blob = response.data;
          const url = URL.createObjectURL(blob);

          setImageBlob(blob);
          setImageUrl(url);
          setError("");
          setShowPasswordPrompt(false);
        })
        .catch(async (error) => {
          if (error.response) {
            if (error.response.status === 401) {
              setShowPasswordPrompt(true);

              if (pass) setError("Incorrect password. Please try again.");
              else
                setError("This image is protected. Please enter the password.");
            } else {
              const errorJson = JSON.parse(await error.response.data.text());

              setError(errorJson.detail + ". Try reloading the page.");
              setImageUrl("");
            }
          }
        });
    },
    [imageId],
  );

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  if (!imageId)
    return (
      <div className="container">
        <div className="card text-center">
          <div className="message message-error">No image ID provided.</div>

          <button onClick={() => navigate("/")} className="btn btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );

  if (showPasswordPrompt)
    return (
      <div className="container">
        <div className="card">
          <h2 className="title">Protected Image</h2>

          {error && <div className="message message-error">{error}</div>}

          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="form-input"
            />
          </div>

          <div className="btn-group">
            <button
              onClick={() => fetchImage(password)}
              className="btn btn-primary"
            >
              Submit
            </button>

            <button onClick={() => navigate("/")} className="btn btn-secondary">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="container">
        <div className="card text-center">
          <h2 className="subtitle">Error</h2>

          <div className="message message-error">{error}</div>

          <button onClick={() => navigate("/")} className="btn btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );

  if (!imageUrl)
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading">
            <div className="spinner"></div>
            Loading image...
          </div>
        </div>
      </div>
    );

  return (
    <div className="container">
      <div className="card">
        <div className="image-container">
          <img
            src={imageUrl}
            alt="Loaded image"
            className="image-view-display"
          />
        </div>

        <div className="btn-group-vertical">
          <a href={imageUrl} download={`image-${imageId}`}>
            <button className="btn btn-primary btn-full">Download Image</button>
          </a>
          <button
            onClick={async () => {
              await copyToClipboard(
                new ClipboardItem({ "text/plain": window.location.href }),
              );
            }}
            className="btn btn-secondary btn-full"
          >
            Copy Image Link
          </button>

          <button
            onClick={async () => {
              if (imageBlob)
                await copyToClipboard(
                  new ClipboardItem({ [imageBlob.type]: imageBlob }),
                );
            }}
            className="btn btn-secondary btn-full"
          >
            Copy Image to Clipboard
          </button>
        </div>

        <div className="text-center mt-3">
          <button onClick={() => navigate("/")} className="btn btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
