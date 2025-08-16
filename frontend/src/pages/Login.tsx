import { useState } from "react";
import apiClient, { useAuthRedirect } from "../api/ApiClient";

export default function Login() {
    useAuthRedirect(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if( !email || !password) {
            setMessage('All fields are required.');
            return;
        }

        apiClient.post('/login', {
            email,
            password,
        }, { withCredentials: true }).then(response => {
            if (response.status === 200) {
                setMessage('Logged in');
                setEmail('');
                setPassword('');

                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
            else {
                setMessage('Login failed. Try again later.');
            }
                
        }).catch(error => {
            if (error.response) {
                setMessage('Login failed: ' + error.response.data.detail);
            }
        });
    };


    return (
        <div>
           <p> Login </p>    

           <form onSubmit={handleSubmit}>
            <input type="email" name="email" placeholder="Enter your email..."
            value={email} onChange= {(e) => setEmail(e.target.value)} />

            <input type="password" name="password" placeholder="Enter your password..." 
            value={password} onChange= {(e) => setPassword(e.target.value)} />

            <button type="submit">Login</button>

            {message && <p>{message}</p>}

           </form>
        </div>
    );
}
