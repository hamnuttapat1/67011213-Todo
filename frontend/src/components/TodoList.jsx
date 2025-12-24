// frontend/src/components/TodoList.jsx
import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api';

function TodoList({ username, onLogout }) {
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
        <div className='w-screen h-screen bg-blue-100 p-10'>
            <div className='max-w-6xl mx-auto'>
                <div className='flex justify-between items-center mb-8'>
                    <h2 className='text-3xl font-bold'>Todo List for: {username}</h2>
                    <button onClick={handleLogout} className='bg-red-500 text-white px-4 py-2 rounded'>Logout</button>
                </div>

                <form onSubmit={handleAddTodo} className='bg-white p-6 rounded-lg shadow-md mb-8 flex gap-3'>
                    <input
                        type="text"
                        placeholder="New Task"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className='flex-1 px-4 py-2 border border-gray-300 rounded'
                    />
                    <input
                        type="datetime-local"
                        value={newDateTime}
                        onChange={(e) => setNewDateTime(e.target.value)}
                        className='px-4 py-2 border border-gray-300 rounded min-w-max '
                        title="Set task deadline"
                    />
                    <button type="submit" className='cursor-pointer bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 font-semibold'>Add Task</button>
                </form>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {['Todo', 'Doing', 'Done'].map(status => (
                        <div key={status} className='bg-white rounded-lg shadow-md p-4'>
                            <h3 className='text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-300'>{status}</h3>
                            <div className='space-y-3'>
                                {groupedTodos[status].length === 0 ? (
                                    <p className='text-gray-400 text-center py-4'>No tasks</p>
                                ) : (
                                    groupedTodos[status].map(todo => (
                                        <div key={todo.id} className='bg-gray-50 p-3 rounded border border-gray-200 hover:border-gray-400'>
                                            <div className='flex justify-between items-start gap-2'>
                                                <div className='flex-1'>
                                                    <p className='font-medium'>{todo.task}</p>
                                                    {todo.target_datetime && (
                                                        <p className='text-sm text-blue-600 mt-1'>
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
                                                        className='flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 cursor-pointer'
                                                    >
                                                        {(todo.status || 'Todo') === 'Doing' ? 'Mark as Done' : 'Next'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteTodo(todo.id)}
                                                    className={`${(todo.status || 'Todo') === 'Done' ? 'w-full' : 'flex-1'} bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 cursor-pointer`}
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