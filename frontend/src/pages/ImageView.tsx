import { useParams , useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../api/ApiClient'

export default function ImageView() {
    const { imageId } = useParams<string>();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);


    const navigate = useNavigate();

    useEffect(() => {
        if (imageId)
        {
            apiClient.get(`/images/${imageId}`, { responseType: 'blob' }).then(res => {
                const url = URL.createObjectURL(res.data);
                setImageUrl(url);
                setError(null);
            })
            .catch(_ => {
                // console.error('Error fetching image:', e);
                setError('Failed to load image.');
                setImageUrl(null);
            })
        }
    }, [imageId]);

    if (!imageId) return <div>No image ID provided.</div>;

    if (error) return (
        <div>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')}>Back</button>
        </div>
    );

    if (!imageUrl) return <div>Loading image...</div>;

    return (
        <div>
            <img src={imageUrl} alt="Loaded image"/>
            <button onClick={() => navigate('/')}>Back</button>
        </div>
    );
}
