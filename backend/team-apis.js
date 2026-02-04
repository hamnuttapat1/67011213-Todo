// backend/team-apis.js
// Team Management and Task Management APIs

// ============================================
// TEAM MANAGEMENT APIs
// ============================================

/**
 * 1. CREATE TEAM
 * POST /api/teams
 * Body: { team_name, team_description?, created_by_id }
 * - Creates a new team with the requesting user as admin
 * - Automatically adds creator to team_members
 */
function createTeam(app, db) {
    app.post('/api/teams', (req, res) => {
        try {
            const { team_name, team_description, created_by_id } = req.body;

            if (!team_name || !created_by_id) {
                return res.status(400).json({ message: 'team_name and created_by_id are required' });
            }

            // Create the team with user as admin
            const insertSql = 'INSERT INTO teams (team_name, team_description, admin_id) VALUES (?, ?, ?)';
            db.query(insertSql, [team_name, team_description || null, created_by_id], (err, result) => {
                if (err) {
                    console.error('Error creating team:', err);
                    return res.status(500).json({ message: 'Error creating team' });
                }

                const teamId = result.insertId;

                // Add creator as team member
                const memberSql = 'INSERT INTO user_team_members (user_id, team_id) VALUES (?, ?)';
                db.query(memberSql, [created_by_id, teamId], (memberErr) => {
                    if (memberErr) {
                        console.error('Error adding creator to team:', memberErr);
                        return res.status(500).json({ message: 'Error adding creator to team' });
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Team created successfully',
                        team: {
                            id: teamId,
                            team_name,
                            team_description,
                            admin_id: created_by_id,
                            created_at: new Date()
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Team creation error:', error);
            res.status(500).json({ message: 'Server error during team creation' });
        }
    });
}

/**
 * 2. GET USER'S TEAMS
 * GET /api/users/:user_id/teams
 * - Returns all teams the user is a member of
 * - Includes admin status for each team
 */
function getUserTeams(app, db) {
    app.get('/api/users/:user_id/teams', (req, res) => {
        try {
            const { user_id } = req.params;

            const sql = `
                SELECT 
                    t.id,
                    t.team_name,
                    t.team_description,
                    t.admin_id,
                    t.created_at,
                    (t.admin_id = ?) AS is_admin,
                    COUNT(utm.id) AS member_count
                FROM teams t
                INNER JOIN user_team_members utm ON t.id = utm.team_id
                WHERE utm.user_id = ?
                GROUP BY t.id
                ORDER BY t.created_at DESC
            `;

            db.query(sql, [user_id, user_id], (err, results) => {
                if (err) {
                    console.error('Error fetching user teams:', err);
                    return res.status(500).json({ message: 'Error fetching teams' });
                }

                res.json({
                    success: true,
                    teams: results
                });
            });
        } catch (error) {
            console.error('Error fetching teams:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

/**
 * 3. GET TEAM DETAILS
 * GET /api/teams/:team_id
 * - Returns team info including members
 */
function getTeamDetails(app, db) {
    app.get('/api/teams/:team_id', (req, res) => {
        try {
            const { team_id } = req.params;

            const teamSql = 'SELECT id, team_name, team_description, admin_id, created_at FROM teams WHERE id = ?';
            db.query(teamSql, [team_id], (err, teamResults) => {
                if (err || teamResults.length === 0) {
                    return res.status(404).json({ message: 'Team not found' });
                }

                const team = teamResults[0];

                // Fetch team members
                const memberSql = `
                    SELECT u.id, u.username, u.full_name, u.profile_image, utm.joined_at
                    FROM users u
                    INNER JOIN user_team_members utm ON u.id = utm.user_id
                    WHERE utm.team_id = ?
                    ORDER BY utm.joined_at ASC
                `;

                db.query(memberSql, [team_id], (memberErr, members) => {
                    if (memberErr) {
                        console.error('Error fetching team members:', memberErr);
                        return res.status(500).json({ message: 'Error fetching team members' });
                    }

                    res.json({
                        success: true,
                        team: {
                            ...team,
                            members
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Error fetching team details:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

/**
 * 4. ADD TEAM MEMBER
 * POST /api/teams/:team_id/members
 * Body: { user_id_to_add, requested_by_id }
 * - Only team admin can add members
 * - Checks if user is admin before adding
 */
function addTeamMember(app, db) {
    app.post('/api/teams/:team_id/members', (req, res) => {
        try {
            const { team_id } = req.params;
            const { user_id_to_add, requested_by_id } = req.body;

            if (!user_id_to_add || !requested_by_id) {
                return res.status(400).json({ message: 'user_id_to_add and requested_by_id are required' });
            }

            // Check if requester is team admin
            const adminCheckSql = 'SELECT id FROM teams WHERE id = ? AND admin_id = ?';
            db.query(adminCheckSql, [team_id, requested_by_id], (err, adminResults) => {
                if (err) {
                    console.error('Error checking admin status:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                if (adminResults.length === 0) {
                    return res.status(403).json({ message: 'Only team admin can add members' });
                }

                // Check if user already in team
                const existingSql = 'SELECT id FROM user_team_members WHERE user_id = ? AND team_id = ?';
                db.query(existingSql, [user_id_to_add, team_id], (existErr, existResults) => {
                    if (existErr) {
                        console.error('Error checking membership:', existErr);
                        return res.status(500).json({ message: 'Database error' });
                    }

                    if (existResults.length > 0) {
                        return res.status(400).json({ message: 'User already a member of this team' });
                    }

                    // Add user to team
                    const addMemberSql = 'INSERT INTO user_team_members (user_id, team_id) VALUES (?, ?)';
                    db.query(addMemberSql, [user_id_to_add, team_id], (addErr, result) => {
                        if (addErr) {
                            console.error('Error adding team member:', addErr);
                            return res.status(500).json({ message: 'Error adding team member' });
                        }

                        res.status(201).json({
                            success: true,
                            message: 'Member added successfully'
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Error adding team member:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

/**
 * 5. REMOVE TEAM MEMBER
 * DELETE /api/teams/:team_id/members/:user_id
 * Query: { requested_by_id }
 * - Only team admin can remove members
 * - Admin cannot remove themselves unless team has other admins
 */
function removeTeamMember(app, db) {
    app.delete('/api/teams/:team_id/members/:user_id', (req, res) => {
        try {
            const { team_id, user_id } = req.params;
            const { requested_by_id } = req.query;

            if (!requested_by_id) {
                return res.status(400).json({ message: 'requested_by_id is required' });
            }

            // Check if requester is team admin
            const adminCheckSql = 'SELECT admin_id FROM teams WHERE id = ?';
            db.query(adminCheckSql, [team_id], (err, teamResults) => {
                if (err || teamResults.length === 0) {
                    return res.status(404).json({ message: 'Team not found' });
                }

                const isAdmin = parseInt(teamResults[0].admin_id) === parseInt(requested_by_id);
                if (!isAdmin) {
                    return res.status(403).json({ message: 'Only team admin can remove members' });
                }

                // Remove member from team
                const removeSql = 'DELETE FROM user_team_members WHERE user_id = ? AND team_id = ?';
                db.query(removeSql, [user_id, team_id], (removeErr, result) => {
                    if (removeErr) {
                        console.error('Error removing team member:', removeErr);
                        return res.status(500).json({ message: 'Error removing team member' });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'Member not found in team' });
                    }

                    res.json({
                        success: true,
                        message: 'Member removed successfully'
                    });
                });
            });
        } catch (error) {
            console.error('Error removing team member:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

/**
 * 6. DELETE TEAM
 * DELETE /api/teams/:team_id
 * Query: { requested_by_id }
 * - Only team admin can delete team
 */
function deleteTeam(app, db) {
    app.delete('/api/teams/:team_id', (req, res) => {
        try {
            const { team_id } = req.params;
            const { requested_by_id } = req.query;

            if (!requested_by_id) {
                return res.status(400).json({ message: 'requested_by_id is required' });
            }

            // Check if requester is team admin
            const adminCheckSql = 'SELECT admin_id FROM teams WHERE id = ?';
            db.query(adminCheckSql, [team_id], (err, teamResults) => {
                if (err || teamResults.length === 0) {
                    return res.status(404).json({ message: 'Team not found' });
                }

                const isAdmin = parseInt(teamResults[0].admin_id) === parseInt(requested_by_id);
                if (!isAdmin) {
                    return res.status(403).json({ message: 'Only team admin can delete team' });
                }

                // Delete team (cascades to members and tasks)
                const deleteSql = 'DELETE FROM teams WHERE id = ?';
                db.query(deleteSql, [team_id], (deleteErr) => {
                    if (deleteErr) {
                        console.error('Error deleting team:', deleteErr);
                        return res.status(500).json({ message: 'Error deleting team' });
                    }

                    res.json({
                        success: true,
                        message: 'Team deleted successfully'
                    });
                });
            });
        } catch (error) {
            console.error('Error deleting team:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

// ============================================
// TASK MANAGEMENT APIs
// ============================================

/**
 * 1. CREATE TASK
 * POST /api/teams/:team_id/tasks
 * Body: { task_name, description?, assigned_to, created_by_id, target_datetime? }
 * - Only team admin can create tasks
 * - Task assigned to a team member
 * - assigned_to must be a member of the team
 */
function createTask(app, db) {
    app.post('/api/teams/:team_id/tasks', (req, res) => {
        try {
            const { team_id } = req.params;
            const { task_name, description, assigned_to, created_by_id, target_datetime } = req.body;

            if (!task_name || !assigned_to || !created_by_id) {
                return res.status(400).json({ message: 'task_name, assigned_to, and created_by_id are required' });
            }

            // Check if creator is team admin
            const adminCheckSql = 'SELECT id FROM teams WHERE id = ? AND admin_id = ?';
            db.query(adminCheckSql, [team_id, created_by_id], (err, adminResults) => {
                if (err) {
                    console.error('Error checking admin status:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                if (adminResults.length === 0) {
                    return res.status(403).json({ message: 'Only team admin can create tasks' });
                }

                // Check if assigned_to is a team member
                const memberCheckSql = 'SELECT id FROM user_team_members WHERE user_id = ? AND team_id = ?';
                db.query(memberCheckSql, [assigned_to, team_id], (memberErr, memberResults) => {
                    if (memberErr) {
                        console.error('Error checking team membership:', memberErr);
                        return res.status(500).json({ message: 'Database error' });
                    }

                    if (memberResults.length === 0) {
                        return res.status(400).json({ message: 'assigned_to must be a team member' });
                    }

                    // Create task
                    const insertSql = `
                        INSERT INTO tasks (team_id, task_name, description, assigned_to, created_by, target_datetime)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    db.query(insertSql, [team_id, task_name, description || null, assigned_to, created_by_id, target_datetime || null], (insertErr, result) => {
                        if (insertErr) {
                            console.error('Error creating task:', insertErr);
                            return res.status(500).json({ message: 'Error creating task' });
                        }

                        res.status(201).json({
                            success: true,
                            message: 'Task created successfully',
                            task: {
                                id: result.insertId,
                                team_id,
                                task_name,
                                description,
                                assigned_to,
                                created_by: created_by_id,
                                status: 'Todo',
                                target_datetime,
                                created_at: new Date()
                            }
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

/**
 * 2. GET TEAM TASKS
 * GET /api/teams/:team_id/tasks
 * - All team members can view all tasks in their team
 */
function getTeamTasks(app, db) {
    app.get('/api/teams/:team_id/tasks', (req, res) => {
        try {
            const { team_id } = req.params;

            const sql = `
                SELECT 
                    t.id,
                    t.team_id,
                    t.task_name,
                    t.description,
                    t.assigned_to,
                    u.username AS assigned_to_username,
                    u.full_name AS assigned_to_fullname,
                    t.created_by,
                    uc.username AS created_by_username,
                    t.status,
                    t.target_datetime,
                    t.created_at,
                    t.updated_at
                FROM tasks t
                INNER JOIN users u ON t.assigned_to = u.id
                INNER JOIN users uc ON t.created_by = uc.id
                WHERE t.team_id = ?
                ORDER BY t.created_at DESC
            `;

            db.query(sql, [team_id], (err, results) => {
                if (err) {
                    console.error('Error fetching team tasks:', err);
                    return res.status(500).json({ message: 'Error fetching tasks' });
                }

                res.json({
                    success: true,
                    tasks: results
                });
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

/**
 * 3. UPDATE TASK STATUS
 * PUT /api/tasks/:task_id/status
 * Body: { new_status, requested_by_id }
 * - Only team admin and assigned user can change status
 * - Status must be one of: 'Todo', 'In Progress', 'Done'
 */
function updateTaskStatus(app, db) {
    app.put('/api/tasks/:task_id/status', (req, res) => {
        try {
            const { task_id } = req.params;
            const { new_status, requested_by_id } = req.body;

            if (!new_status || !requested_by_id) {
                return res.status(400).json({ message: 'new_status and requested_by_id are required' });
            }

            const validStatuses = ['Todo', 'In Progress', 'Done'];
            if (!validStatuses.includes(new_status)) {
                return res.status(400).json({ message: 'Invalid status. Must be: Todo, In Progress, or Done' });
            }

            // Get task details
            const taskSql = 'SELECT id, team_id, assigned_to, created_by FROM tasks WHERE id = ?';
            db.query(taskSql, [task_id], (err, taskResults) => {
                if (err || taskResults.length === 0) {
                    return res.status(404).json({ message: 'Task not found' });
                }

                const task = taskResults[0];

                // Get team admin
                const adminSql = 'SELECT admin_id FROM teams WHERE id = ?';
                db.query(adminSql, [task.team_id], (adminErr, adminResults) => {
                    if (adminErr || adminResults.length === 0) {
                        return res.status(500).json({ message: 'Error verifying permissions' });
                    }

                    const teamAdmin = adminResults[0].admin_id;
                    const isAdmin = parseInt(teamAdmin) === parseInt(requested_by_id);
                    const isAssigned = parseInt(task.assigned_to) === parseInt(requested_by_id);

                    if (!isAdmin && !isAssigned) {
                        return res.status(403).json({ message: 'Only team admin and assigned user can change task status' });
                    }

                    // Update task status
                    const updateSql = 'UPDATE tasks SET status = ? WHERE id = ?';
                    db.query(updateSql, [new_status, task_id], (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating task status:', updateErr);
                            return res.status(500).json({ message: 'Error updating task status' });
                        }

                        res.json({
                            success: true,
                            message: 'Task status updated successfully'
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Error updating task status:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

/**
 * 4. UPDATE TASK
 * PUT /api/tasks/:task_id
 * Body: { task_name?, description?, assigned_to?, target_datetime?, requested_by_id }
 * - Only team admin can update task details
 */
function updateTask(app, db) {
    app.put('/api/tasks/:task_id', (req, res) => {
        try {
            const { task_id } = req.params;
            const { task_name, description, assigned_to, target_datetime, requested_by_id } = req.body;

            if (!requested_by_id) {
                return res.status(400).json({ message: 'requested_by_id is required' });
            }

            // Get task details
            const taskSql = 'SELECT team_id FROM tasks WHERE id = ?';
            db.query(taskSql, [task_id], (err, taskResults) => {
                if (err || taskResults.length === 0) {
                    return res.status(404).json({ message: 'Task not found' });
                }

                const teamId = taskResults[0].team_id;

                // Check if requester is team admin
                const adminCheckSql = 'SELECT id FROM teams WHERE id = ? AND admin_id = ?';
                db.query(adminCheckSql, [teamId, requested_by_id], (adminErr, adminResults) => {
                    if (adminErr) {
                        console.error('Error checking admin status:', adminErr);
                        return res.status(500).json({ message: 'Database error' });
                    }

                    if (adminResults.length === 0) {
                        return res.status(403).json({ message: 'Only team admin can update tasks' });
                    }

                    // If changing assigned_to, verify they're a team member
                    if (assigned_to) {
                        const memberCheckSql = 'SELECT id FROM user_team_members WHERE user_id = ? AND team_id = ?';
                        db.query(memberCheckSql, [assigned_to, teamId], (memberErr, memberResults) => {
                            if (memberErr) {
                                console.error('Error checking team membership:', memberErr);
                                return res.status(500).json({ message: 'Database error' });
                            }

                            if (memberResults.length === 0) {
                                return res.status(400).json({ message: 'assigned_to must be a team member' });
                            }

                            performUpdate();
                        });
                    } else {
                        performUpdate();
                    }

                    function performUpdate() {
                        const updateFields = [];
                        const updateValues = [];

                        if (task_name !== undefined) {
                            updateFields.push('task_name = ?');
                            updateValues.push(task_name);
                        }
                        if (description !== undefined) {
                            updateFields.push('description = ?');
                            updateValues.push(description);
                        }
                        if (assigned_to !== undefined) {
                            updateFields.push('assigned_to = ?');
                            updateValues.push(assigned_to);
                        }
                        if (target_datetime !== undefined) {
                            updateFields.push('target_datetime = ?');
                            updateValues.push(target_datetime);
                        }

                        if (updateFields.length === 0) {
                            return res.status(400).json({ message: 'No fields to update' });
                        }

                        updateValues.push(task_id);
                        const updateSql = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`;

                        db.query(updateSql, updateValues, (updateErr) => {
                            if (updateErr) {
                                console.error('Error updating task:', updateErr);
                                return res.status(500).json({ message: 'Error updating task' });
                            }

                            res.json({
                                success: true,
                                message: 'Task updated successfully'
                            });
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

/**
 * 5. DELETE TASK
 * DELETE /api/tasks/:task_id
 * Query: { requested_by_id }
 * - Only team admin can delete tasks
 */
function deleteTask(app, db) {
    app.delete('/api/tasks/:task_id', (req, res) => {
        try {
            const { task_id } = req.params;
            const { requested_by_id } = req.query;

            if (!requested_by_id) {
                return res.status(400).json({ message: 'requested_by_id is required' });
            }

            // Get task and team
            const taskSql = 'SELECT team_id FROM tasks WHERE id = ?';
            db.query(taskSql, [task_id], (err, taskResults) => {
                if (err || taskResults.length === 0) {
                    return res.status(404).json({ message: 'Task not found' });
                }

                const teamId = taskResults[0].team_id;

                // Check if requester is team admin
                const adminCheckSql = 'SELECT id FROM teams WHERE id = ? AND admin_id = ?';
                db.query(adminCheckSql, [teamId, requested_by_id], (adminErr, adminResults) => {
                    if (adminErr) {
                        console.error('Error checking admin status:', adminErr);
                        return res.status(500).json({ message: 'Database error' });
                    }

                    if (adminResults.length === 0) {
                        return res.status(403).json({ message: 'Only team admin can delete tasks' });
                    }

                    // Delete task
                    const deleteSql = 'DELETE FROM tasks WHERE id = ?';
                    db.query(deleteSql, [task_id], (deleteErr) => {
                        if (deleteErr) {
                            console.error('Error deleting task:', deleteErr);
                            return res.status(500).json({ message: 'Error deleting task' });
                        }

                        res.json({
                            success: true,
                            message: 'Task deleted successfully'
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
}

// Export all route setup functions
module.exports = {
    createTeam,
    getUserTeams,
    getTeamDetails,
    addTeamMember,
    removeTeamMember,
    deleteTeam,
    createTask,
    getTeamTasks,
    updateTaskStatus,
    updateTask,
    deleteTask
};
