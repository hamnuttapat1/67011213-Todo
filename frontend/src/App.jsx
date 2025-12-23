// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import TodoList from './components/TodoList.jsx';

function App() {
    const [currentUser, setCurrentUser] = useState(null);

    // Check for stored username on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('todo_username');
        if (storedUser) {
            setCurrentUser(storedUser);
        }
    }, []);

    const handleLogin = (username) => {
        setCurrentUser(username);
    };

    const handleLogout = () => {
        // Clear username from local storage and state
        localStorage.removeItem('todo_username');
        setCurrentUser(null);
    };

    return (
        <div className="flex flex-col items-center w-screen h-screen bg-amber-400">
            <h1 className="text-green-600 text-4xl font-bold mt-8">Todo App</h1>
            {/* Conditional rendering based on login status */}
            {currentUser ? (
                <TodoList username={currentUser} onLogout={handleLogout} />
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;