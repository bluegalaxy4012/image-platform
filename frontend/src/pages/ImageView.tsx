import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/ApiClient";

export default function ImageView() {
  const { imageId } = useParams<string>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string>("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false);
  const navigate = useNavigate();

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
  };

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
          const url = URL.createObjectURL(response.data);
          setImageUrl(url);
          setError(null);
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
              setImageUrl(null);
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
        <button onClick={() => navigate("/")}>Back</button>
      </div>
    );

  if (error)
    return (
      <div>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Back</button>
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
        <button onClick={copyLinkToClipboard}>Copy Link to Clipboard</button>
      </div>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
}
