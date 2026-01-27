// frontend/src/components/TodoList.jsx
import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api';

function TodoList({ user, onLogout, onUserUpdate }) {
    const username = user?.username || user; // accept either object or raw string
    const resolvedProfileImage = (() => {
        const url = user?.profile_image;
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:5001${url}`;
    })();

    const [profileImagePreview, setProfileImagePreview] = useState(resolvedProfileImage);
    const [editFullName, setEditFullName] = useState(user?.full_name || '');
    const [editPassword, setEditPassword] = useState('');
    const [editConfirmPassword, setEditConfirmPassword] = useState('');
    const [editImageFile, setEditImageFile] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [newDateTime, setNewDateTime] = useState('');

    useEffect(() => {
        fetchTodos();
    }, [username]); // Refetch when username changes (e.g., after login)

    // 1. READ: Fetch all todos for the current user
    const fetchTodos = async () => {
        try {
            const response = await fetch(`${API_URL}/todos/${username}`);

            if (!response.ok) {
                console.error('Failed to fetch todos:', response.statusText);
                return;
            }

            const data = await response.json();
            setTodos(data);
        } catch (err) {
            console.error('Error fetching todos:', err);
        }
    };

    // 2. CREATE: Add a new todo
    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            // Convert datetime-local format to MySQL datetime format
            let targetDateTime = null;
            if (newDateTime) {
                targetDateTime = new Date(newDateTime).toISOString().slice(0, 19).replace('T', ' ');
            }

            console.log('Sending task:', { username, task: newTask, target_datetime: targetDateTime, status: 'Todo' });

            const response = await fetch(`${API_URL}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    task: newTask,
                    target_datetime: targetDateTime,
                    status: 'Todo'
                }),
            });

            if (!response.ok) {
                console.error('Failed to add todo:', response.statusText);
                return;
            }

            const newTodo = await response.json();
            console.log('New todo response:', newTodo);
            setTodos([newTodo, ...todos]);
            setNewTask('');
            setNewDateTime('');
        } catch (err) {
            console.error('Error adding todo:', err);
        }
    };

    // 3. UPDATE: Change task status
    const handleChangeStatus = async (id, currentStatus) => {
        const statuses = ['Todo', 'Doing', 'Done'];
        const currentIndex = statuses.indexOf(currentStatus);
        const newStatus = statuses[(currentIndex + 1) % statuses.length];

        console.log(`Updating task ${id} from ${currentStatus} to ${newStatus}`);

        try {
            const response = await fetch(`${API_URL}/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                console.error('Failed to update todo:', response.statusText);
                return;
            }

            setTodos(todos.map(todo =>
                todo.id === id ? { ...todo, status: newStatus } : todo
            ));
            console.log('Task status updated successfully');
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    // 4. DELETE: Remove a todo item
    const handleDeleteTodo = async (id) => {
        try {
            const response = await fetch(`${API_URL}/todos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                console.error('Failed to delete todo:', response.statusText);
                return;
            }

            // Filter out the deleted item from the state
            setTodos(todos.filter(todo => todo.id !== id));
        } catch (err) {
            console.error('Error deleting todo:', err);
        }
    };

    const handleLogout = () => {
        // Clear storage and trigger state change in App.js
        localStorage.removeItem('todo_username');
        onLogout();
    };

    // Group and sort todos by status, then by target_datetime descending
    const groupedTodos = {
        'Todo': [],
        'Doing': [],
        'Done': []
    };

    todos.forEach(todo => {
        const status = todo.status || 'Todo'; // Default to 'Todo' if no status
        if (groupedTodos[status]) {
            groupedTodos[status].push(todo);
        }
    });

    // Sort each group by target_datetime descending
    Object.keys(groupedTodos).forEach(status => {
        groupedTodos[status].sort((a, b) => {
            const dateA = a.target_datetime ? new Date(a.target_datetime) : new Date(0);
            const dateB = b.target_datetime ? new Date(b.target_datetime) : new Date(0);
            return dateB - dateA;
        });
    });

    return (
        <div className='min-h-screen w-full bg-blue-100 overflow-auto'>
            <div className='max-w-6xl mx-auto p-4 sm:p-6 md:p-10'>
                <div className='flex flex-col gap-3 mb-6 md:mb-8'>
                    <div className='flex flex-row justify-between items-center gap-4'>
                        <div className='flex items-center gap-3 min-w-0'>
                            <div className='w-12 h-12 rounded-full bg-blue-200 overflow-hidden flex-shrink-0 border border-blue-300'>
                                {profileImagePreview ? (
                                    <img src={profileImagePreview} alt="Profile" className='w-full h-full object-cover' />
                                ) : (
                                    <div className='w-full h-full flex items-center justify-center text-blue-700 font-semibold'>
                                        {username ? username.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                            <div className='flex flex-col min-w-0'>
                                <h2 className='text-xl sm:text-2xl md:text-3xl font-bold wrap-break-words truncate'>
                                    Todo List for: {username}
                                </h2>
                                {user?.full_name && (
                                    <p className='text-sm text-gray-600 truncate'>{user.full_name}</p>
                                )}
                            </div>
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setEditOpen(!editOpen)}
                                className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 whitespace-nowrap'
                            >
                                {editOpen ? 'Close' : 'Edit Profile'}
                            </button>
                            <button onClick={handleLogout} className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 whitespace-nowrap'>Logout</button>
                        </div>
                    </div>

                    {editOpen && (
                        <div className='bg-white rounded-lg shadow-md p-4 flex flex-col gap-3'>
                            <h3 className='text-lg font-semibold'>Update Profile</h3>
                            <div className='flex items-center gap-3'>
                                <div className='w-14 h-14 rounded-full bg-gray-200 overflow-hidden border'>
                                    {profileImagePreview ? (
                                        <img src={profileImagePreview} alt="Preview" className='w-full h-full object-cover' />
                                    ) : (
                                        <div className='w-full h-full flex items-center justify-center text-gray-500'>
                                            {username ? username.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                </div>
                                <label className='cursor-pointer text-sm text-blue-600 hover:text-blue-700'>
                                    Change Photo
                                    <input
                                        type='file'
                                        accept='image/*'
                                        className='hidden'
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            if (file.size > 5 * 1024 * 1024) {
                                                setEditError('Image size must be less than 5MB');
                                                return;
                                            }
                                            setEditImageFile(file);
                                            setProfileImagePreview(URL.createObjectURL(file));
                                        }}
                                    />
                                </label>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm text-gray-600'>Full Name</label>
                                    <input
                                        type='text'
                                        value={editFullName}
                                        onChange={(e) => setEditFullName(e.target.value)}
                                        className='px-3 py-2 border rounded'
                                    />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm text-gray-600'>New Password (optional)</label>
                                    <input
                                        type='password'
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        className='px-3 py-2 border rounded'
                                        placeholder='Leave blank to keep current'
                                    />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm text-gray-600'>Confirm New Password</label>
                                    <input
                                        type='password'
                                        value={editConfirmPassword}
                                        onChange={(e) => setEditConfirmPassword(e.target.value)}
                                        className='px-3 py-2 border rounded'
                                    />
                                </div>
                            </div>

                            {editError && <p className='text-sm text-red-600'>{editError}</p>}
                            {editSuccess && <p className='text-sm text-green-600'>{editSuccess}</p>}

                            <div className='flex gap-2'>
                                <button
                                    onClick={async () => {
                                        setEditError('');
                                        setEditSuccess('');

                                        if (editPassword && editPassword !== editConfirmPassword) {
                                            setEditError('Passwords do not match');
                                            return;
                                        }

                                        const formData = new FormData();
                                        if (editFullName) formData.append('full_name', editFullName);
                                        if (editPassword) formData.append('password', editPassword);
                                        if (editImageFile) formData.append('profile_image', editImageFile);

                                        setEditLoading(true);
                                        try {
                                            const resp = await fetch(`${API_URL}/profile/${username}`, {
                                                method: 'PUT',
                                                body: formData
                                            });
                                            const data = await resp.json();
                                            if (!resp.ok || !data.success) {
                                                setEditError(data.message || 'Update failed');
                                            } else {
                                                setEditSuccess('Profile updated');
                                                const updatedUser = {
                                                    ...user,
                                                    ...data.user
                                                };
                                                onUserUpdate && onUserUpdate(updatedUser);
                                            }
                                        } catch (err) {
                                            console.error('Profile update error:', err);
                                            setEditError('Network error updating profile');
                                        } finally {
                                            setEditLoading(false);
                                        }
                                    }}
                                    className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400'
                                    disabled={editLoading}
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditOpen(false);
                                        setEditError('');
                                        setEditSuccess('');
                                        setEditPassword('');
                                        setEditConfirmPassword('');
                                        setEditImageFile(null);
                                        setProfileImagePreview(resolvedProfileImage);
                                    }}
                                    className='bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300'
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleAddTodo} className='bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 md:mb-8 flex flex-col sm:flex-row gap-3'>
                    <input
                        type="text"
                        placeholder="New Task"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className='flex-1 px-4 py-2 border border-gray-300 rounded w-full'
                    />
                    <input
                        type="datetime-local"
                        value={newDateTime}
                        onChange={(e) => setNewDateTime(e.target.value)}
                        className='px-4 py-2 border border-gray-300 rounded w-full sm:w-auto'
                        title="Set task deadline"
                    />
                    <button type="submit" className='cursor-pointer bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 font-semibold w-full sm:w-auto'>Add Task</button>
                </form>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'>
                    {['Todo', 'Doing', 'Done'].map(status => (
                        <div key={status} className='bg-white rounded-lg shadow-md p-4'>
                            <h3 className='text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-300'>{status}</h3>
                            <div className='space-y-3'>
                                {groupedTodos[status].length === 0 ? (
                                    <p className='text-gray-400 text-center py-4'>No tasks</p>
                                ) : (
                                    groupedTodos[status].map(todo => (
                                        <div key={todo.id} className='bg-gray-50 p-3 rounded border border-gray-200 hover:border-gray-400 transition-colors'>
                                            <div className='flex justify-between items-start gap-2'>
                                                <div className='flex-1'>
                                                    <p className='font-medium wrap-break-words'>{todo.task}</p>
                                                    {todo.target_datetime && (
                                                        <p className='text-xs sm:text-sm text-blue-600 mt-1'>
                                                            Deadline: {new Date(todo.target_datetime).toLocaleString()}
                                                        </p>
                                                    )}
                                                    <p className='text-xs text-gray-500 mt-1'>
                                                        Updated: {new Date(todo.updated).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='flex gap-2 mt-3'>
                                                {(todo.status || 'Todo') !== 'Done' && (
                                                    <button
                                                        onClick={() => handleChangeStatus(todo.id, todo.status || 'Todo')}
                                                        className='flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 cursor-pointer transition-colors'
                                                    >
                                                        {(todo.status || 'Todo') === 'Doing' ? 'Mark as Done' : 'Next'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteTodo(todo.id)}
                                                    className={`${(todo.status || 'Todo') === 'Done' ? 'w-full' : 'flex-1'} bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 cursor-pointer transition-colors`}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TodoList;