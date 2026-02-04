// frontend/src/components/Teams.jsx
import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

const API_URL = 'http://localhost:5001/api';

function Teams({ user, onSelectTeam, onBack }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDescription, setNewTeamDescription] = useState('');
    const [creatingTeam, setCreatingTeam] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showTeamDetails, setShowTeamDetails] = useState(false);

    useEffect(() => {
        fetchUserTeams();
    }, [user.id]);

    const fetchUserTeams = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${API_URL}/users/${user.id}/teams`);

            if (!response.ok) {
                throw new Error('Failed to fetch teams');
            }

            const data = await response.json();
            setTeams(data.teams || []);
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError(err.message || 'Failed to load teams');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();

        if (!newTeamName.trim()) {
            setError('Team name is required');
            return;
        }

        try {
            setCreatingTeam(true);
            setError('');

            const response = await fetch(`${API_URL}/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_name: newTeamName,
                    team_description: newTeamDescription || null,
                    created_by_id: user.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create team');
            }

            // Reset form and refresh teams
            setNewTeamName('');
            setNewTeamDescription('');
            setShowCreateTeam(false);
            await fetchUserTeams();
        } catch (err) {
            console.error('Error creating team:', err);
            setError(err.message || 'Failed to create team');
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to delete this team?')) {
            return;
        }

        try {
            setError('');
            const response = await fetch(`${API_URL}/teams/${teamId}?requested_by_id=${user.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete team');
            }

            // Refresh teams
            await fetchUserTeams();
        } catch (err) {
            console.error('Error deleting team:', err);
            setError(err.message || 'Failed to delete team');
        }
    };

    const handleViewTeamDetails = async (team) => {
        try {
            setError('');
            const response = await fetch(`${API_URL}/teams/${team.id}`);

            if (!response.ok) {
                throw new Error('Failed to fetch team details');
            }

            const data = await response.json();
            setSelectedTeam(data.team);
            setShowTeamDetails(true);
        } catch (err) {
            console.error('Error fetching team details:', err);
            setError(err.message || 'Failed to load team details');
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen w-full bg-blue-100 flex items-center justify-center'>
                <p className='text-gray-600'>Loading teams...</p>
            </div>
        );
    }

    return (
        <div className='min-h-screen w-full bg-blue-100'>
            <div className='max-w-6xl mx-auto p-4 sm:p-6 md:p-10'>
                {/* Header */}
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-3xl font-bold text-blue-800'>My Teams</h1>
                    <button
                        onClick={onBack}
                        className='bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
                    >
                        Back to Todo
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

                {/* Create Team Form */}
                {!showCreateTeam ? (
                    <button
                        onClick={() => setShowCreateTeam(true)}
                        className='flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 mb-6 font-semibold'
                    >
                        <FiPlus size={20} />
                        Create New Team
                    </button>
                ) : (
                    <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-2xl font-semibold'>Create New Team</h2>
                            <button
                                onClick={() => setShowCreateTeam(false)}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTeam} className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Team Name</label>
                                <input
                                    type='text'
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder='Enter team name'
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    required
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Description (optional)</label>
                                <textarea
                                    value={newTeamDescription}
                                    onChange={(e) => setNewTeamDescription(e.target.value)}
                                    placeholder='Enter team description'
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    rows='3'
                                />
                            </div>

                            <div className='flex gap-2'>
                                <button
                                    type='submit'
                                    disabled={creatingTeam}
                                    className='bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-semibold'
                                >
                                    {creatingTeam ? 'Creating...' : 'Create Team'}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowCreateTeam(false);
                                        setNewTeamName('');
                                        setNewTeamDescription('');
                                    }}
                                    className='bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400'
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Teams List */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {teams.length === 0 ? (
                        <div className='col-span-full text-center py-8'>
                            <p className='text-gray-600 text-lg'>No teams yet. Create one to get started!</p>
                        </div>
                    ) : (
                        teams.map(team => (
                            <div key={team.id} className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
                                <div className='flex justify-between items-start mb-3'>
                                    <h3 className='text-xl font-semibold text-gray-800'>{team.team_name}</h3>
                                    {team.is_admin ? (
                                        <span className='bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold'>
                                            Admin
                                        </span>
                                    ) : (
                                        <span className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold'>
                                            Member
                                        </span>
                                    )}
                                </div>

                                {team.team_description && (
                                    <p className='text-gray-600 text-sm mb-3'>{team.team_description}</p>
                                )}

                                <div className='text-gray-500 text-sm mb-4'>
                                    <p>👥 {team.member_count} member{team.member_count !== 1 ? 's' : ''}</p>
                                    <p>Created: {new Date(team.created_at).toLocaleDateString()}</p>
                                </div>

                                <div className='flex gap-2 items-center'>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            onSelectTeam(team);
                                        }}
                                        className='flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium'
                                    >
                                        View Tasks
                                    </button>

                                    <button
                                        type='button'
                                        onClick={() => handleViewTeamDetails(team)}
                                        className='bg-blue-200 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-300'
                                        title='View team details'
                                    >
                                        <FiEdit2 size={18} />
                                    </button>

                                    <button
                                        type='button'
                                        onClick={() => handleDeleteTeam(team.id)}
                                        className={`px-3 py-2 rounded-lg ${team.is_admin ? 'bg-red-200 text-red-700 hover:bg-red-300' : 'hidden'}`}
                                        title='Delete team'
                                        style={{ display: team.is_admin ? 'block' : 'none' }}
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Team Details Modal */}
                {showTeamDetails && selectedTeam && (
                    <TeamDetailsModal
                        team={selectedTeam}
                        currentUserId={user.id}
                        isAdmin={teams.find(t => t.id === selectedTeam.id)?.is_admin}
                        onClose={() => {
                            setShowTeamDetails(false);
                            setSelectedTeam(null);
                        }}
                        onMemberAdded={fetchUserTeams}
                        onMemberRemoved={fetchUserTeams}
                    />
                )}
            </div>
        </div>
    );
}

// Team Details Modal Component
function TeamDetailsModal({ team, currentUserId, isAdmin, onClose, onMemberAdded, onMemberRemoved }) {
    const [members, setMembers] = useState(team.members || []);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberUsername, setNewMemberUsername] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const [error, setError] = useState('');

    const handleAddMember = async (e) => {
        e.preventDefault();

        if (!newMemberUsername.trim()) {
            setError('Username is required');
            return;
        }

        try {
            setAddingMember(true);
            setError('');

            // First, get user ID from username
            const response = await fetch(`${API_URL}/users/search?username=${newMemberUsername}`);
            if (!response.ok) {
                throw new Error('User not found');
            }

            const userData = await response.json();
            if (!userData.user) {
                throw new Error('User not found');
            }

            // Then add to team
            const addResponse = await fetch(`${API_URL}/teams/${team.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id_to_add: userData.user.id,
                    requested_by_id: currentUserId
                })
            });

            const addData = await addResponse.json();

            if (!addResponse.ok) {
                throw new Error(addData.message || 'Failed to add member');
            }

            setNewMemberUsername('');
            setShowAddMember(false);
            onMemberAdded();
        } catch (err) {
            console.error('Error adding member:', err);
            setError(err.message || 'Failed to add member');
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Remove this member from the team?')) {
            return;
        }

        try {
            setError('');
            const response = await fetch(`${API_URL}/teams/${team.id}/members/${memberId}?requested_by_id=${currentUserId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to remove member');
            }

            onMemberRemoved();
        } catch (err) {
            console.error('Error removing member:', err);
            setError(err.message || 'Failed to remove member');
        }
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-auto'>
                <div className='p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white'>
                    <h2 className='text-2xl font-semibold'>{team.team_name}</h2>
                    <button
                        onClick={onClose}
                        className='text-gray-500 hover:text-gray-700'
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <div className='p-6 space-y-4'>
                    {error && (
                        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm'>
                            {error}
                        </div>
                    )}

                    <div>
                        <h3 className='text-lg font-semibold mb-3'>Team Members ({members.length})</h3>
                        <div className='space-y-2'>
                            {members.map(member => (
                                <div key={member.id} className='flex justify-between items-center bg-gray-50 p-3 rounded'>
                                    <div className='flex items-center gap-2'>
                                        {member.profile_image && (
                                            <img
                                                src={member.profile_image.startsWith('http') ? member.profile_image : `http://localhost:5001${member.profile_image}`}
                                                alt={member.username}
                                                className='w-8 h-8 rounded-full object-cover'
                                            />
                                        )}
                                        <div>
                                            <p className='font-medium'>{member.full_name}</p>
                                            <p className='text-sm text-gray-600'>@{member.username}</p>
                                        </div>
                                    </div>

                                    <button
                                        type='button'
                                        onClick={() => handleRemoveMember(member.id)}
                                        className={`${isAdmin && member.id !== currentUserId ? 'text-red-500 hover:text-red-700 visible' : 'invisible'}`}
                                        title='Remove member'
                                        style={{ display: isAdmin && member.id !== currentUserId ? 'block' : 'none' }}
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isAdmin ? (
                        <>
                            {!showAddMember ? (
                                <button
                                    onClick={() => setShowAddMember(true)}
                                    className='w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium'
                                >
                                    <FiPlus size={18} />
                                    Add Member
                                </button>
                            ) : (
                                <form onSubmit={handleAddMember} className='space-y-2'>
                                    <input
                                        type='text'
                                        value={newMemberUsername}
                                        onChange={(e) => setNewMemberUsername(e.target.value)}
                                        placeholder='Enter username'
                                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                    <div className='flex gap-2'>
                                        <button
                                            type='submit'
                                            disabled={addingMember}
                                            className='flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-medium'
                                        >
                                            {addingMember ? 'Adding...' : 'Add'}
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setShowAddMember(false);
                                                setNewMemberUsername('');
                                                setError('');
                                            }}
                                            className='flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400'
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default Teams;
