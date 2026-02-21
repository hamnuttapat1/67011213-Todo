🚀 Features

Group boards: Create/join a group and collaborate on shared tasks.
Three columns (Kanban‑style):

Todo → Doing → Done
Drag or action to move tasks between columns.


CRUD tasks: Create, edit, delete tasks within a group.
Responsive UI with Tailwind CSS.
REST API with Node.js + Express.
MySQL for relational data and group ownership/membership.
Docker for quick, repeatable environment setup.


🛠 Tech Stack
Frontend: React, Vite, Tailwind CSS
Backend: Node.js, Express.js
Database: MySQL
Tools: Docker & Docker Compose, Git/GitHub, Linux (CLI)

📂 Project Structure
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
├── docker-compose.yml
├── package.json
└── README.md


⚙️ Prerequisites

Node.js (LTS recommended)
Docker Desktop / Docker Engine
npm


▶️ How to Run

From the project root

1) Start MySQL via Docker Compose
Shelldocker compose up -dShow more lines
2) Start the Backend
Shellcd backendnode server.jsShow more lines
3) Start the Frontend
Shellcd frontendnpm install   # first time onlynpm run devShow more lines
Open the app at http://localhost:5173 (default Vite port).

🔐 Environment Variables (examples)
Create a .env in backend/ as needed:
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=todo_app
CORS_ORIGIN=http://localhost:5173

If your docker-compose.yml defines MySQL service names (e.g., db), set DB_HOST=db.

🧱 Database Model (suggested)
Groups & tasks with status:

groups: id, name, created_at
users (optional if you add auth later): id, name, email, password_hash
group_members (optional): group_id, user_id, role
tasks: id, group_id, title, description, status, created_at, updated_at

status is one of: todo | doing | done

🔌 API Overview (examples)

Adjust names/paths to match your code. These are conventional routes for a group board.

Groups
Plain Texthttp isn’t fully supported. Syntax highlighting is based on Plain Text.GET    /api/groups                 # list groups (optionally by user)POST   /api/groups                 # create a groupGET    /api/groups/:groupId        # get group detailDELETE /api/groups/:groupId        # delete a groupShow more lines
Tasks (scoped to group)
Plain Texthttp isn’t fully supported. Syntax highlighting is based on Plain Text.GET    /api/groups/:groupId/tasks              # list tasks in the groupPOST   /api/groups/:groupId/tasks              # create task (status defaults to "todo")GET    /api/groups/:groupId/tasks/:taskId      # get taskPUT    /api/groups/:groupId/tasks/:taskId      # update title/description/statusDELETE /api/groups/:groupId/tasks/:taskId      # delete taskShow more lines
Move task between columns
Plain Texthttp isn’t fully supported. Syntax highlighting is based on Plain Text.PATCH  /api/groups/:groupId/tasks/:taskId/status# body: { "status": "todo" | "doing" | "done" }Show more lines

💡 UI Behavior (quick notes)

Default column for new tasks: Todo
Tasks can be moved: Todo → Doing → Done (and back if needed)
Each group has its own board and task list


🧪 Development Tips

Use Thunder Client / Postman to test the API quickly.
Seed some groups/tasks for local dev if helpful.
Consider adding CORS config to allow the Vite dev server origin.


📈 Future Enhancements

Authentication & member roles (Owner/Admin/Member)
Drag‑and‑drop between columns
Due dates, tags, and filters
Activity log / audit trail
Deployment with Docker on Render/Railway/AWS


📜 License
No license at the moment (all rights reserved).
Add MIT if you want others to use this project freely.
