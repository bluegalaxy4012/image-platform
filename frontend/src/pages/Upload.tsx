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
    return <div>File size exceeds the limit of 1 MB.</div>;
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
    <div>
      <label htmlFor="image-format">Image Format:</label>
      <select
        id="image-format"
        value={format}
        onChange={(e) => {
          setFormat(e.target.value);
        }}
      >
        <option value="PNG">PNG</option>
        <option value="JPG">JPG</option>
        <option value="JPEG">JPEG</option>
      </select>

      <label htmlFor="apply_resize">Apply Resize:</label>
      <input
        type="checkbox"
        name="apply_resize"
        checked={applyResize}
        onChange={(e) => {
          setApplyResize(e.target.checked);
        }}
      ></input>

      {applyResize && (
        <div>
          <label htmlFor="resize_width">Resize Width:</label>
          <input
            required
            type="number"
            name="resize_width"
            placeholder="Width in pixels..."
            onChange={(e) => {
              setWidth(Number(e.target.value));
            }}
          />

          <br></br>

          <label htmlFor="resize_height">Resize Height:</label>
          <input
            required
            type="number"
            name="resize_height"
            placeholder="Height in pixels..."
            onChange={(e) => {
              setHeight(Number(e.target.value));
            }}
          />
        </div>
      )}

      {effects.map((eff) => (
        <div key={eff.key}>
          <label htmlFor={eff.key}>{eff.label}:</label>
          <input
            type="checkbox"
            value={eff.key}
            checked={effect === eff.key}
            onChange={(e) => {
              if (effect === eff.key) setEffect("");
              else setEffect(e.target.value);
            }}
          />
        </div>
      ))}

      <label htmlFor="protected">Protect Image:</label>
      <input
        type="checkbox"
        name="protected"
        checked={protectedImage}
        onChange={(e) => {
          setProtectedImage(e.target.checked);
        }}
      ></input>

      {protectedImage && (
        <div>
          <label htmlFor="password">Image Password:</label>
          <input
            required
            type="password"
            name="password"
            placeholder="Password..."
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </div>
      )}

      <button type="submit" onClick={handleUpload}>
        Upload
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
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          width: "300px",
          height: "150px",
          border: "2px dashed gray",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Drag your image here</p>
      </div>

      <p>or</p>

      {/* <input
        type="file"
        accept="image/*"
        style={{ border: "2px solid black" }}
        onChange={handleChange}
      /> */}

      <label
        htmlFor="fileInput"
        style={{
          border: "2px solid black",
          cursor: "pointer",
        }}
      >
        Choose an image from your computer
      </label>

      <input
        id="fileInput"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      {file && (
        <p>
          Selected: <strong>{file.name}</strong>
        </p>
      )}

      <FileUploadOptions
        file={file}
        setFile={setFile}
        setMessage={setMessage}
        setImageLink={setImageLink}
      />

      <br />
      {message && <p>{message}</p>}
      <br />

      {imageLink && (
        <div>
          <a href={imageLink} target="_blank" rel="noopener noreferrer">
            {imageLink}
          </a>
          <br />
          <button
            className="rounded"
            onClick={() => {
              copyToClipboard(new ClipboardItem({ "text/plain": imageLink }));
            }}
          >
            Copy link to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
