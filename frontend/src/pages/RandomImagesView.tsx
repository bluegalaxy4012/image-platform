import { useEffect, useState } from "react";
import apiClient from "../api/ApiClient";

export default function RandomImagesView() {
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

  if (error) return <p>{error}</p>;

  return (
    <div
      style={{
        overflowY: "auto",
        maxHeight: "100vh",
        textAlign: "center",
        padding: "15px",
      }}
    >
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Random image ${i}`}
          style={{
            display: "block",
            margin: "0 auto",
          }}
        />
      ))}
    </div>
  );
}
