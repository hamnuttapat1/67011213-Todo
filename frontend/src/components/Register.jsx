// frontend/src/components/Register.jsx
import React, { useState } from 'react';

const API_URL = 'http://localhost:5001/api';

function Register({ onRegisterSuccess, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            setProfileImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.full_name || !formData.username || !formData.password) {
            setError('All fields are required');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('full_name', formData.full_name);
            formDataToSend.append('username', formData.username);
            formDataToSend.append('password', formData.password);
            if (profileImage) {
                formDataToSend.append('profile_image', profileImage);
            }

            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                body: formDataToSend
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onRegisterSuccess(data.message);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Network error: Could not connect to the server');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-blue-100">
            <div className="w-96 bg-white shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4">
                <h2 className="text-2xl font-semibold">Create Account</h2>
                <p className="text-sm text-gray-700">Sign up to get started</p>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                    {/* Profile Image Upload */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-3xl">👤</span>
                            )}
                        </div>
                        <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                            Upload Photo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <input
                        type="text"
                        name="full_name"
                        placeholder="Full Name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    />

                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password (min 6 characters)"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    />

                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:bg-gray-400"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <button
                    onClick={onSwitchToLogin}
                    className="text-sm text-blue-600 hover:text-blue-700"
                >
                    Already have an account? Login
                </button>
            </div>
        </div>
    );
}

export default Register;
