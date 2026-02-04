// frontend/src/components/TeamTasks.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const API_URL = 'http://localhost:5001/api';

function TeamTasks({ team, user, onBack }) {
    const [tasks, setTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [creatingTask, setCreatingTask] = useState(false);
    const isTeamAdmin = team.admin_id === user.id;

    useEffect(() => {
        fetchTeamData();
    }, [team.id]);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch team details (members)
            const teamResponse = await fetch(`${API_URL}/teams/${team.id}`);
            if (!teamResponse.ok) {
                throw new Error('Failed to fetch team details');
            }
            const teamData = await teamResponse.json();
            setTeamMembers(teamData.team.members || []);

            // Fetch team tasks
            const tasksResponse = await fetch(`${API_URL}/teams/${team.id}/tasks`);
            if (!tasksResponse.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const tasksData = await tasksResponse.json();
            setTasks(tasksData.tasks || []);
        } catch (err) {
            console.error('Error fetching team data:', err);
            setError(err.message || 'Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();

        if (!newTaskName.trim()) {
            setError('Task name is required');
            return;
        }

        if (!newTaskAssignedTo) {
            setError('Please assign the task to a team member');
            return;
        }

        try {
            setCreatingTask(true);
            setError('');

            let targetDateTime = null;
            if (newTaskDeadline) {
                targetDateTime = new Date(newTaskDeadline).toISOString().slice(0, 19).replace('T', ' ');
            }

            const response = await fetch(`${API_URL}/teams/${team.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_name: newTaskName,
                    description: newTaskDescription || null,
                    assigned_to: parseInt(newTaskAssignedTo),
                    created_by_id: user.id,
                    target_datetime: targetDateTime
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create task');
            }

            // Reset form and refresh tasks
            setNewTaskName('');
            setNewTaskDescription('');
            setNewTaskAssignedTo('');
            setNewTaskDeadline('');
            setShowCreateTask(false);
            await fetchTeamData();
        } catch (err) {
            console.error('Error creating task:', err);
            setError(err.message || 'Failed to create task');
        } finally {
            setCreatingTask(false);
        }
    };

    const handleChangeTaskStatus = async (taskId, currentStatus) => {
        const statuses = ['Todo', 'In Progress', 'Done'];
        const currentIndex = statuses.indexOf(currentStatus);
        const newStatus = statuses[(currentIndex + 1) % statuses.length];

        try {
            setError('');
            const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_status: newStatus,
                    requested_by_id: user.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update task status');
            }

            // Update local state
            setTasks(tasks.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
            ));
        } catch (err) {
            console.error('Error updating task status:', err);
            setError(err.message || 'Failed to update task status');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            setError('');
            const response = await fetch(`${API_URL}/tasks/${taskId}?requested_by_id=${user.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete task');
            }

            // Update local state
            setTasks(tasks.filter(task => task.id !== taskId));
        } catch (err) {
            console.error('Error deleting task:', err);
            setError(err.message || 'Failed to delete task');
        }
    };

    // Group tasks by status
    const groupedTasks = {
        'Todo': [],
        'In Progress': [],
        'Done': []
    };

    tasks.forEach(task => {
        const status = task.status || 'Todo';
        if (groupedTasks[status]) {
            groupedTasks[status].push(task);
        }
    });

    // Sort each group by created_at (newest first)
    Object.keys(groupedTasks).forEach(status => {
        groupedTasks[status].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });

    if (loading) {
        return (
            <div className='min-h-screen w-full bg-blue-100 flex items-center justify-center'>
                <p className='text-gray-600'>Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className='min-h-screen w-full bg-blue-100 overflow-auto'>
            <div className='max-w-6xl mx-auto p-4 sm:p-6 md:p-10'>
                {/* Header */}
                <div className='flex justify-between items-center mb-6'>
                    <div>
                        <h1 className='text-3xl font-bold text-blue-800'>{team.team_name} - Tasks</h1>
                        {team.team_description && (
                            <p className='text-gray-600 mt-1'>{team.team_description}</p>
                        )}
                    </div>
                    <button
                        onClick={onBack}
                        className='bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
                    >
                        Back to Teams
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                        {error}
                        <button
                            onClick={() => setError('')}
                            className='ml-2 text-red-700 hover:text-red-900'
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Create Task Button/Form */}
                {isTeamAdmin && (
                    <>
                        {!showCreateTask ? (
                            <button
                                onClick={() => setShowCreateTask(true)}
                                className='flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 mb-6 font-semibold'
                            >
                                <FiPlus size={20} />
                                Create New Task
                            </button>
                        ) : (
                            <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                                <div className='flex justify-between items-center mb-4'>
                                    <h2 className='text-2xl font-semibold'>Create New Task</h2>
                                    <button
                                        onClick={() => setShowCreateTask(false)}
                                        className='text-gray-500 hover:text-gray-700'
                                    >
                                        <FiX size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateTask} className='space-y-4'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>Task Name</label>
                                        <input
                                            type='text'
                                            value={newTaskName}
                                            onChange={(e) => setNewTaskName(e.target.value)}
                                            placeholder='Enter task name'
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>Description (optional)</label>
                                        <textarea
                                            value={newTaskDescription}
                                            onChange={(e) => setNewTaskDescription(e.target.value)}
                                            placeholder='Enter task description'
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            rows='3'
                                        />
                                    </div>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>Assign To</label>
                                            <select
                                                value={newTaskAssignedTo}
                                                onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                required
                                            >
                                                <option value=''>Select a team member</option>
                                                {teamMembers.map(member => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.full_name} (@{member.username})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>Deadline (optional)</label>
                                            <input
                                                type='datetime-local'
                                                value={newTaskDeadline}
                                                onChange={(e) => setNewTaskDeadline(e.target.value)}
                                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            />
                                        </div>
                                    </div>

                                    <div className='flex gap-2'>
                                        <button
                                            type='submit'
                                            disabled={creatingTask}
                                            className='bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-semibold'
                                        >
                                            {creatingTask ? 'Creating...' : 'Create Task'}
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setShowCreateTask(false);
                                                setNewTaskName('');
                                                setNewTaskDescription('');
                                                setNewTaskAssignedTo('');
                                                setNewTaskDeadline('');
                                            }}
                                            className='bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400'
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                )}

                {/* Tasks Kanban Board */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'>
                    {['Todo', 'In Progress', 'Done'].map(status => (
                        <div key={status} className='bg-white rounded-lg shadow-md p-4'>
                            <h3 className='text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-300'>{status}</h3>
                            <div className='space-y-3'>
                                {groupedTasks[status].length === 0 ? (
                                    <p className='text-gray-400 text-center py-4'>No tasks</p>
                                ) : (
                                    groupedTasks[status].map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            user={user}
                                            isTeamAdmin={isTeamAdmin}
                                            onStatusChange={handleChangeTaskStatus}
                                            onDelete={handleDeleteTask}
                                        />
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

// Task Card Component
function TaskCard({ task, user, isTeamAdmin, onStatusChange, onDelete }) {
    const canChangeStatus = isTeamAdmin || task.assigned_to === user.id;

    return (
        <div className='bg-gray-50 p-4 rounded border border-gray-200 hover:border-gray-400 transition-colors'>
            <div className='flex justify-between items-start gap-2 mb-2'>
                <h4 className='font-semibold text-gray-800 flex-1'>{task.task_name}</h4>
                {isTeamAdmin && (
                    <button
                        onClick={() => onDelete(task.id)}
                        className='text-red-500 hover:text-red-700 flex-shrink-0'
                        title='Delete task'
                    >
                        <FiTrash2 size={18} />
                    </button>
                )}
            </div>

            {task.description && (
                <p className='text-sm text-gray-600 mb-2'>{task.description}</p>
            )}

            <div className='space-y-1 mb-3 text-xs text-gray-500'>
                <p><strong>Assigned to:</strong> {task.assigned_to_fullname} (@{task.assigned_to_username})</p>
                <p><strong>Created by:</strong> {task.created_by_username}</p>
                {task.target_datetime && (
                    <p><strong>Deadline:</strong> {new Date(task.target_datetime).toLocaleString()}</p>
                )}
                <p><strong>Created:</strong> {new Date(task.created_at).toLocaleString()}</p>
            </div>

            {canChangeStatus && task.status !== 'Done' && (
                <button
                    onClick={() => onStatusChange(task.id, task.status)}
                    className='w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 font-medium'
                >
                    Move to {getNextStatus(task.status)}
                </button>
            )}

            {task.status === 'Done' && (
                <button
                    onClick={() => onDelete(task.id)}
                    className='w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 font-medium'
                >
                    Delete Task
                </button>
            )}
        </div>
    );
}

function getNextStatus(currentStatus) {
    const statuses = ['Todo', 'In Progress', 'Done'];
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses[(currentIndex + 1) % statuses.length];
}

export default TeamTasks;
