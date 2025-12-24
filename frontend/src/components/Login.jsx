// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { FcGoogle } from "react-icons/fc";
const API_URL = 'http://localhost:5001/api';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Please enter a username.');
            return;
        }

        try {
            // Use Fetch API for POST request
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }), // Convert object to JSON string
            });

            // Check if the response status is OK (200-299)
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed due to server error.');
                return;
            }

            const data = await response.json(); // Parse the response body as JSON

            if (data.success) {
                localStorage.setItem('todo_username', username);
                onLogin(username); // Update App component state
            } else {
                setError(data.message || 'Login failed.');
            }
        } catch (err) {
            // Handle network connection errors
            setError('Network error: Could not connect to the server.');
            console.error(err);
        }
    };

    return (
            <div className="w-screen h-screen flex items-center justify-center bg-blue-100">
                <div className="w-80 md:w-110 h-00 bg-white shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-semibold">Login (Username Only)</h2>
                        <p className="text-sm text-gray-700">Sign in to manage your tasks</p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                        />
                        <button
                            type="submit"
                            className="cursor-pointer w-full bg-green-500 text-white py-3 rounded-xl font-semibold shadow hover:bg-green-600 transition"
                        >
                            Login
                        </button>
                    </form>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <div className="w-full flex items-center gap-3 text-gray-600">
                        <span className="h-px flex-1 bg-gray-300" />
                        <span className="text-xs">or</span>
                        <span className="h-px flex-1 bg-gray-300" />
                    </div>

                    <button className="cursor-pointer flex items-center justify-center w-full gap-3 bg-white text-gray-800 border border-gray-200 rounded-full py-3 shadow-sm hover:shadow-md transition">
                        <FcGoogle className="text-xl" />
                        <span className="font-medium">Sign in with Google</span>
                    </button>
                </div>
            </div>
    );
}

export default Login;