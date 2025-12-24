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
        <div className="flex flex-col w-screen h-screen">
            <div className='flex flex-row items-center gap-3  px-5 py-4 shadow-md'>
                <img src="/cei.png" className='w-10 h-10' />
                <h1 className="text-blue-600 text-2xl font-bold">Todo App</h1>
            </div>
            {currentUser ? (
                <TodoList username={currentUser} onLogout={handleLogout} />
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;