"use client";

import type React from "react";

import { useEffect, useState } from "react";
import apiClient, { useAuthRedirect } from "../api/ApiClient";
import { copyToClipboard, FRONTEND_URL } from "../utils/utils";

function FileUploadOptions({
  file,
  setFile,
  setMessage,
  setImageLink,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
  setMessage: (message: string) => void;
  setImageLink: (link: string) => void;
}) {
  const maxFileSize = 1000000; // ~ 1 MB
  const [format, setFormat] = useState<string>("PNG");
  const [applyResize, setApplyResize] = useState<boolean>(false);
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [effect, setEffect] = useState<string>("");
  const [protectedImage, setProtectedImage] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

  const effects = [
    { key: "apply_grayscale", label: "Grayscale" },
    { key: "apply_color_inversion", label: "Color Inversion" },
    { key: "apply_sepia", label: "Sepia" },
    { key: "apply_blur", label: "Blur" },
  ];

  if (!file) return null;

  if (file.size > maxFileSize) {
    return (
      <div className="message message-error">
        File size exceeds the limit of 1 MB.
      </div>
    );
  }

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const bodyData = {
      format: format,
      apply_resize: applyResize,
      width: applyResize && width !== "" ? width : undefined,
      height: applyResize && height !== "" ? height : undefined,
      apply_grayscale: effect === "apply_grayscale",
      apply_color_inversion: effect === "apply_color_inversion",
      apply_sepia: effect === "apply_sepia",
      apply_blur: effect === "apply_blur",
      protected: protectedImage,
      password: protectedImage && password ? password : undefined,
    };

    formData.append("options", JSON.stringify(bodyData));

    apiClient
      .post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setFile(null);

          setFormat("PNG");
          setApplyResize(false);
          setWidth("");
          setHeight("");
          setEffect("");
          setProtectedImage(false);
          setPassword("");

          setMessage(response.data.message);
          setImageLink(`${FRONTEND_URL}/images/${response.data.image_id}`);
        } else {
          setMessage("Failed to upload image.");
        }
      })
      .catch((error) => {
        if (error.response) {
          setMessage("Error uploading image: " + error.response.data.detail);
        }
      });
  };

  return (
    <div className="content-card">
      <h3 className="subtitle">Upload Options</h3>

      <div className="form-group">
        <label htmlFor="image-format" className="form-label">
          Image Format:
        </label>

        <select
          id="image-format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="select"
        >
          <option value="PNG">PNG</option>
          <option value="JPG">JPG</option>
          <option value="JPEG">JPEG</option>
        </select>
      </div>

      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          id="apply_resize"
          name="apply_resize"
          checked={applyResize}
          onChange={(e) => setApplyResize(e.target.checked)}
          className="checkbox"
        />

        <label htmlFor="apply_resize" className="form-label">
          Apply Resize
        </label>
      </div>

      {applyResize && (
        <div className="content-card">
          <div className="form-group">
            <label htmlFor="resize_width" className="form-label">
              Resize Width:
            </label>

            <input
              required
              type="number"
              id="resize_width"
              name="resize_width"
              placeholder="Width in pixels..."
              onChange={(e) => setWidth(Number(e.target.value))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="resize_height" className="form-label">
              Resize Height:
            </label>

            <input
              required
              type="number"
              id="resize_height"
              name="resize_height"
              placeholder="Height in pixels..."
              onChange={(e) => setHeight(Number(e.target.value))}
              className="form-input"
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Effects:</label>
        <div className="content-card">
          {effects.map((eff) => (
            <div key={eff.key} className="checkbox-group">
              <input
                type="checkbox"
                id={eff.key}
                value={eff.key}
                checked={effect === eff.key}
                onChange={(e) => {
                  if (effect === eff.key) setEffect("");
                  else setEffect(e.target.value);
                }}
                className="checkbox"
              />

              <label htmlFor={eff.key} className="form-label">
                {eff.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          id="protected"
          name="protected"
          checked={protectedImage}
          onChange={(e) => setProtectedImage(e.target.checked)}
          className="checkbox"
        />

        <label htmlFor="protected" className="form-label">
          Protect Image
        </label>
      </div>

      {protectedImage && (
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Image Password:
          </label>

          <input
            required
            type="password"
            id="password"
            name="password"
            placeholder="Password..."
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>
      )}

      <button type="submit" onClick={handleUpload} className="btn btn-primary">
        Upload Image
      </button>
    </div>
  );
}

export default function Upload() {
  useAuthRedirect(true);

  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [imageLink, setImageLink] = useState<string>("");

  // handlePasteImage
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      try {
        const clipboard = e.clipboardData;
        if (!clipboard) return;

        const target = e.target as HTMLElement | null;

        // skip if we are pasting into an editable element
        const isEditable =
          !!target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);

        if (isEditable) return;

        const pastedFile = Array.from(clipboard.files || []).find((f) =>
          f.type.startsWith("image/"),
        );

        if (pastedFile) {
          e.preventDefault();

          setFile(pastedFile);
          setMessage("");
          setImageLink("");
        }
      } catch (err) {
        console.error("Pasting image error:", err);
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [setFile, setMessage]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setMessage("");
      setImageLink("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
      setImageLink("");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Upload Image</h1>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="upload-area"
        >
          <p className="body-text">Drag your image here</p>
        </div>

        <div className="text-center mt-2 mb-2">
          <span className="caption">or</span>
        </div>

        <div className="text-center">
          <label htmlFor="fileInput" className="file-input-label">
            Choose an image from your device
          </label>

          <input
            id="fileInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleChange}
          />
        </div>

        {file && (
          <div className="message message-info">
            Selected: <strong>{file.name}</strong>
          </div>
        )}

        <FileUploadOptions
          file={file}
          setFile={setFile}
          setMessage={setMessage}
          setImageLink={setImageLink}
        />

        {message && (
          <div
            className={`message ${message.includes("Error") || message.includes("Failed") ? "message-error" : "message-success"}`}
          >
            {message}
          </div>
        )}

        {imageLink && (
          <div className="content-card text-center">
            <p className="body-text">Your image is ready.</p>
            <a
              href={imageLink}
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              {imageLink}
            </a>

            <div className="mt-2">
              <button
                className="btn btn-secondary btn-small"
                onClick={() => {
                  copyToClipboard(
                    new ClipboardItem({ "text/plain": imageLink }),
                  );
                }}
              >
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
