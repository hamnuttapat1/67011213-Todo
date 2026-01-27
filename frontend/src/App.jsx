// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import TodoList from './components/TodoList.jsx';

function App() {
    const [currentUser, setCurrentUser] = useState(null); // { username, full_name?, profile_image? }
    const [showRegister, setShowRegister] = useState(false);

    console.log('App rendered, currentUser:', currentUser);

    // Check for stored username on initial load
    useEffect(() => {
        const storedUserObj = localStorage.getItem('todo_user');
        const storedUsername = localStorage.getItem('todo_username');
        if (storedUserObj) {
            try {
                setCurrentUser(JSON.parse(storedUserObj));
                return;
            } catch (e) {
                console.error('Failed to parse stored user', e);
            }
        }
        if (storedUsername) {
            setCurrentUser({ username: storedUsername });
        }
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
    };

    const handleUserUpdate = (user) => {
        setCurrentUser(user);
        localStorage.setItem('todo_username', user.username);
        localStorage.setItem('todo_user', JSON.stringify(user));
    };

    const handleLogout = () => {
        // Clear username from local storage and state
        localStorage.removeItem('todo_username');
        localStorage.removeItem('todo_user');
        setCurrentUser(null);
    };

    const handleRegisterSuccess = (message) => {
        alert(message || 'Registration successful! Please login.');
        setShowRegister(false);
    };

    return (
        <div className="flex flex-col w-screen h-screen">
            <div className='flex flex-row items-center gap-3 px-5 py-4 shadow-md'>
                <img src="/cei.png" className='w-10 h-10' />
                <h1 className="text-blue-600 text-2xl font-bold">Todo App</h1>
            </div>
            {currentUser ? (
                <TodoList user={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
            ) : showRegister ? (
                <Register
                    onRegisterSuccess={handleRegisterSuccess}
                    onSwitchToLogin={() => setShowRegister(false)}
                />
            ) : (
                <Login
                    onLogin={handleLogin}
                    onSwitchToRegister={() => setShowRegister(true)}
                />
            )}
        </div>
    );
}

export default App;