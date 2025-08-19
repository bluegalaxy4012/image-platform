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

  if (!imageId) return <div>No image ID provided.</div>;

  if (showPasswordPrompt)
    return (
      <div>
        <h2>Protected Image</h2>
        <p>{error}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <button onClick={() => fetchImage(password)}>Submit</button>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );

  if (error)
    return (
      <div>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );

  if (!imageUrl) return <div>Loading image...</div>;

  return (
    <div>
      <img src={imageUrl} alt="Loaded image" />
      <div>
        <a href={imageUrl} download={`image-${imageId}`}>
          <button>Download Image</button>
        </a>
        <button
          onClick={async () => {
            await copyToClipboard(
              new ClipboardItem({ "text/plain": window.location.href }),
            );
          }}
        >
          Copy Image Link to Clipboard
        </button>
        <button
          onClick={async () => {
            if (imageBlob)
              await copyToClipboard(
                new ClipboardItem({ [imageBlob.type]: imageBlob }),
              );
          }}
        >
          Copy Image to Clipboard
        </button>
      </div>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
}
