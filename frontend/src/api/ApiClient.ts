import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

export function useAuthRedirect(shouldBeLoggedIn: boolean) {
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth()
        .then(() => {
            if (!shouldBeLoggedIn) {
                navigate('/');
            }
        })
        .catch(() => {
            if (shouldBeLoggedIn) {
                navigate('/register');
            }
        });
    }, []);
}

export function checkAuth() {
    return apiClient.get('/testauth', { withCredentials: true });
}

export default apiClient;