// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import ReCAPTCHA from 'react-google-recaptcha';
const API_URL = 'http://localhost:5001/api';
const RECAPTCHA_SITE_KEY = '6LeyGlgsAAAAAGtDmrQD05kJMrhcRUSiqHz-GgRt';

function Login({ onLogin, onSwitchToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaValue, setCaptchaValue] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password');
            return;
        }

        if (!captchaValue) {
            setError('Please complete the CAPTCHA');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, captcha: captchaValue }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('todo_username', data.user.username);
                localStorage.setItem('todo_user', JSON.stringify(data.user));
                onLogin(data.user);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error: Could not connect to the server');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const response = await fetch(`${API_URL}/google-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('todo_username', data.user.username);
                localStorage.setItem('todo_user', JSON.stringify(data.user));
                onLogin(data.user);
            } else {
                setError(data.message || 'Google login failed');
            }
        } catch (err) {
            setError('Network error during Google login');
            console.error(err);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-blue-100">
            <div className="w-80 md:w-96 bg-white shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-6">
                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-semibold">Welcome Back</h2>
                    <p className="text-sm text-gray-700">Sign in to manage your tasks</p>
                </div>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                    />

                    <ReCAPTCHA
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={(value) => setCaptchaValue(value)}
                        onExpired={() => setCaptchaValue(null)}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold shadow hover:bg-green-600 transition disabled:bg-gray-400"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <div className="w-full flex items-center gap-3 text-gray-600">
                    <span className="h-px flex-1 bg-gray-300" />
                    <span className="text-xs">or</span>
                    <span className="h-px flex-1 bg-gray-300" />
                </div>

                <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => {
                        setError('Google login failed. Please try again.');
                    }}
                />

                <button
                    onClick={onSwitchToRegister}
                    className="text-sm text-blue-600 hover:text-blue-700"
                >
                    Don't have an account? Register
                </button>
            </div>
        </div>
    );
}

export default Login;