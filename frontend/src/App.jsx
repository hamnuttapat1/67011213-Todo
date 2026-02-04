// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import TodoList from './components/TodoList.jsx';
import Teams from './components/Teams.jsx';
import TeamTasks from './components/TeamTasks.jsx';

function App() {
    const [currentUser, setCurrentUser] = useState(null); // { id, username, full_name?, profile_image? }
    const [showRegister, setShowRegister] = useState(false);
    const [currentView, setCurrentView] = useState('todo'); // 'todo', 'teams', 'team-tasks'
    const [selectedTeam, setSelectedTeam] = useState(null);

    console.log('App rendered, currentUser:', currentUser, 'currentView:', currentView);

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
        setCurrentView('todo');
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
        setCurrentView('todo');
        setSelectedTeam(null);
    };

    const handleRegisterSuccess = (message) => {
        alert(message || 'Registration successful! Please login.');
        setShowRegister(false);
    };

    const handleSelectTeam = (team) => {
        setSelectedTeam(team);
        setCurrentView('team-tasks');
    };

    const handleBackFromTeams = () => {
        setCurrentView('todo');
    };

    const handleBackFromTeamTasks = () => {
        setCurrentView('teams');
        setSelectedTeam(null);
    };

    return (
        <div className="flex flex-col w-screen h-screen">
            <div className='flex flex-row items-center gap-3 px-5 py-4 shadow-md'>
                <img src="/cei.png" className='w-10 h-10' />
                <h1 className="text-blue-600 text-2xl font-bold">Todo App</h1>
                {currentUser && currentView !== 'todo' && (
                    <div className='ml-auto flex gap-2'>
                        {currentView === 'teams' && (
                            <button
                                onClick={() => setCurrentView('todo')}
                                className='text-blue-600 hover:text-blue-800 font-medium'
                            >
                                ← Back to Personal Tasks
                            </button>
                        )}
                        {currentView === 'team-tasks' && (
                            <button
                                onClick={handleBackFromTeamTasks}
                                className='text-blue-600 hover:text-blue-800 font-medium'
                            >
                                ← Back to My Teams
                            </button>
                        )}
                    </div>
                )}
            </div>
            {currentUser ? (
                <>
                    {currentView === 'todo' && (
                        <div className='flex-1 overflow-auto'>
                            <TodoList
                                user={currentUser}
                                onLogout={handleLogout}
                                onUserUpdate={handleUserUpdate}
                                onViewTeams={() => setCurrentView('teams')}
                            />
                        </div>
                    )}
                    {currentView === 'teams' && (
                        <div className='flex-1 overflow-auto'>
                            <Teams
                                user={currentUser}
                                onSelectTeam={handleSelectTeam}
                                onBack={handleBackFromTeams}
                            />
                        </div>
                    )}
                    {currentView === 'team-tasks' && selectedTeam && (
                        <div className='flex-1 overflow-auto'>
                            <TeamTasks
                                team={selectedTeam}
                                user={currentUser}
                                onBack={handleBackFromTeamTasks}
                            />
                        </div>
                    )}
                </>
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