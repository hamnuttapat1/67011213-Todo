// server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const fileUpload = require('express-fileupload');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const {
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
} = require('./team-apis');

const app = express();
const port = 5001;
const SALT_ROUNDS = 10;
const GOOGLE_CLIENT_ID = "734483986460-4de02vp23cflpjnnr9t349p6mqgu7avm.apps.googleusercontent.com";
const RECAPTCHA_SECRET_KEY = "6LeyGlgsAAAAAERWVaQU9jMLLL1CpRLLP5ZHZXJ8";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware setup
app.use(cors()); // Allow cross-origin requests from React frontend
app.use(express.json()); // Enable reading JSON data from request body
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// --- MySQL Connection Setup ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // CHANGE THIS to your MySQL username
    password: 'CEiAdmin0', // CHANGE THIS to your MySQL password
    database: 'ceidb' // Ensure this matches your database name
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database.');
});

// ------------------------------------
// API: Authentication
// ------------------------------------

// 1. REGISTER: Create new user account
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, username, password } = req.body;

        // Validation
        if (!full_name || !username || !password) {
            return res.status(400).json({ message: 'Full name, username, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if username already exists
        const checkUserSql = 'SELECT id FROM users WHERE username = ?';
        db.query(checkUserSql, [username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            // Hash password with salt
            const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

            // Handle profile image upload
            let profile_image = null;
            if (req.files && req.files.profile_image) {
                const file = req.files.profile_image;
                const fileName = `${Date.now()}_${file.name}`;
                const uploadPath = path.join(__dirname, 'uploads', fileName);

                await file.mv(uploadPath);
                profile_image = `/uploads/${fileName}`;
            }

            // Insert new user
            const insertSql = 'INSERT INTO users (full_name, username, password_hash, profile_image) VALUES (?, ?, ?, ?)';
            db.query(insertSql, [full_name, username, password_hash, profile_image], (insertErr, result) => {
                if (insertErr) {
                    console.error('Error creating user:', insertErr);
                    return res.status(500).json({ message: 'Error creating user' });
                }

                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    user: { id: result.insertId, username, full_name, profile_image }
                });
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// 2. LOGIN: Authenticate with username and password
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, captcha } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Verify CAPTCHA
        if (!captcha) {
            return res.status(400).json({ message: 'CAPTCHA is required' });
        }

        try {
            const captchaResponse = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify`,
                null,
                {
                    params: {
                        secret: RECAPTCHA_SECRET_KEY,
                        response: captcha
                    }
                }
            );

            if (!captchaResponse.data.success) {
                return res.status(400).json({ message: 'CAPTCHA verification failed' });
            }
        } catch (captchaError) {
            console.error('CAPTCHA verification error:', captchaError);
            return res.status(500).json({ message: 'CAPTCHA verification error' });
        }

        // Find user
        const sql = 'SELECT id, full_name, username, password_hash, profile_image FROM users WHERE username = ?';
        db.query(sql, [username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            const user = results[0];

            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            // Update last login
            db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    profile_image: user.profile_image
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// 3. GOOGLE LOGIN: Authenticate with Google OAuth
app.post('/api/google-login', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const google_id = payload['sub'];
        const email = payload['email'];
        const full_name = payload['name'];
        const profile_image = payload['picture'];

        // Check if user exists with this Google ID
        const checkSql = 'SELECT id, username, full_name, profile_image FROM users WHERE google_id = ?';
        db.query(checkSql, [google_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length > 0) {
                // User exists, update their info
                const user = results[0];
                // Preserve locally uploaded avatar (stored as /uploads/...). Only overwrite if none or existing is a Google URL.
                const shouldUpdateImage = !user.profile_image || user.profile_image.startsWith('http');
                const updateFields = ['full_name = ?'];
                const updateValues = [full_name];
                if (shouldUpdateImage) {
                    updateFields.push('profile_image = ?');
                    updateValues.push(profile_image);
                }
                updateFields.push('last_login = NOW()');
                const updateSql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
                updateValues.push(user.id);

                db.query(updateSql, updateValues, (updateErr) => {
                    if (updateErr) console.error('Error updating user:', updateErr);

                    // Return the actual profile_image from database (preserved if locally uploaded)
                    return res.json({
                        success: true,
                        message: 'Login successful',
                        user: {
                            id: user.id,
                            username: user.username,
                            full_name: full_name,
                            profile_image: user.profile_image  // Return database value, not Google value
                        }
                    });
                });
            } else {
                // Create new user from Google account
                const username = email.split('@')[0]; // Use email prefix as username
                const insertSql = 'INSERT INTO users (full_name, username, google_id, profile_image) VALUES (?, ?, ?, ?)';

                db.query(insertSql, [full_name, username, google_id, profile_image], (insertErr, result) => {
                    if (insertErr) {
                        console.error('Error creating Google user:', insertErr);
                        return res.status(500).json({ message: 'Error creating user account' });
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Account created and login successful',
                        user: {
                            id: result.insertId,
                            username: username,
                            full_name: full_name,
                            profile_image: profile_image
                        }
                    });
                });
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Error during Google authentication' });
    }
});

// 4. UPDATE PROFILE: full_name, password, profile image
app.put('/api/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { full_name, password } = req.body;

        // Fetch existing user
        db.query('SELECT id, username FROM users WHERE username = ?', [username], async (findErr, rows) => {
            if (findErr) {
                console.error('Database error:', findErr);
                return res.status(500).json({ message: 'Database error' });
            }
            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const updates = [];
            const values = [];

            if (full_name) {
                updates.push('full_name = ?');
                values.push(full_name);
            }

            if (password) {
                if (password.length < 6) {
                    return res.status(400).json({ message: 'Password must be at least 6 characters' });
                }
                const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
                updates.push('password_hash = ?');
                values.push(password_hash);
            }

            // Handle optional profile image
            if (req.files && req.files.profile_image) {
                const file = req.files.profile_image;
                const fileName = `${Date.now()}_${file.name}`;
                const uploadPath = path.join(__dirname, 'uploads', fileName);
                await file.mv(uploadPath);
                const profile_image = `/uploads/${fileName}`;
                updates.push('profile_image = ?');
                values.push(profile_image);
            }

            if (updates.length === 0) {
                return res.status(400).json({ message: 'No changes provided' });
            }

            values.push(username);
            const updateSql = `UPDATE users SET ${updates.join(', ')}, last_login = NOW() WHERE username = ?`;

            db.query(updateSql, values, (updateErr) => {
                if (updateErr) {
                    console.error('Error updating profile:', updateErr);
                    return res.status(500).json({ message: 'Error updating profile' });
                }

                // Return updated user
                db.query('SELECT id, username, full_name, profile_image FROM users WHERE username = ?', [username], (selErr, resultRows) => {
                    if (selErr || resultRows.length === 0) {
                        console.error('Error fetching updated user:', selErr);
                        return res.status(500).json({ message: 'Error fetching updated user' });
                    }
                    const user = resultRows[0];
                    res.json({ success: true, user, message: 'Profile updated successfully' });
                });
            });
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error during profile update' });
    }
});

// 5. SEARCH USERS: Find user by username
app.get('/api/users/search', (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const sql = 'SELECT id, username, full_name, profile_image FROM users WHERE username = ?';
        db.query(sql, [username], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                success: true,
                user: results[0]
            });
        });
    } catch (error) {
        console.error('Search user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ------------------------------------
// API: Todo List (CRUD Operations)
// ------------------------------------

// 1. READ: Get all todos for a specific user
app.get('/api/todos/:username', (req, res) => {
    const { username } = req.params;
    const sql = 'SELECT id, task, status, target_datetime, updated FROM todo WHERE username = ? ORDER BY id DESC';
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. CREATE: Add a new todo item
app.post('/api/todos', (req, res) => {
    const { username, task, target_datetime, status } = req.body;
    if (!username || !task) {
        return res.status(400).send({ message: 'Username and task are required' });
    }
    const sql = 'INSERT INTO todo (username, task, status, target_datetime) VALUES (?, ?, ?, ?)';
    const todoStatus = status || 'Todo';
    db.query(sql, [username, task, todoStatus, target_datetime || null], (err, result) => {
        if (err) return res.status(500).send(err);
        // Return the created item details including the new ID
        res.status(201).send({ id: result.insertId, username, task, status: todoStatus, target_datetime, updated: new Date() });
    });
});

// 3. UPDATE: Update todo status and/or other fields
app.put('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const { status, target_datetime, done } = req.body;

    let updateFields = [];
    let updateValues = [];

    if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
    }
    if (target_datetime !== undefined) {
        updateFields.push('target_datetime = ?');
        updateValues.push(target_datetime);
    }
    if (done !== undefined) {
        updateFields.push('done = ?');
        updateValues.push(done);
    }

    if (updateFields.length === 0) {
        return res.status(400).send({ message: 'No fields to update' });
    }

    updateValues.push(id);
    const sql = `UPDATE todo SET ${updateFields.join(', ')} WHERE id = ?`;

    db.query(sql, updateValues, (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Todo not found' });
        }
        res.send({ message: 'Todo updated successfully' });
    });
});

// 4. DELETE: Remove a todo item
app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM todo WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Todo not found' });
        }
        res.send({ message: 'Todo deleted successfully' });
    });
});

// ------------------------------------
// API: Team Management
// ------------------------------------

// 1. Create a new team
createTeam(app, db);

// 2. Get all teams for a user
getUserTeams(app, db);

// 3. Get team details with members
getTeamDetails(app, db);

// 4. Add a member to a team
addTeamMember(app, db);

// 5. Remove a member from a team
removeTeamMember(app, db);

// 6. Delete a team
deleteTeam(app, db);

// ------------------------------------
// API: Task Management (Team-based)
// ------------------------------------

// 1. Create a task for a team
createTask(app, db);

// 2. Get all tasks for a team
getTeamTasks(app, db);

// 3. Update task status (admin or assignee only)
updateTaskStatus(app, db);

// 4. Update task details (admin only)
updateTask(app, db);

// 5. Delete a task (admin only)
deleteTask(app, db);

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});