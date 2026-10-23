# Student Details

A beginner-friendly web app to add, view, search, edit, and delete student records. It uses Node.js + Express and PostgreSQL.

## Folder structure

```text
student details/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Run on your computer

1. Install Node.js LTS and open this folder in VS Code.
2. Open Terminal in VS Code and run `npm install`.
3. Create a PostgreSQL database and set the `DATABASE_URL` environment variable to its connection string.
4. Run `npm start`.
5. Open `http://localhost:5000`.

Example local PowerShell setup for a database connection (replace the example values with your own):
```powershell
$env:DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/student_details"
npm start
```

The app creates the `students` table automatically. Never publish your database password in GitHub.

## Deploy using GitHub + Render

1. Create a GitHub repository named `student-details`.
2. Upload/push all files from this folder to the repository. Keep the `public` folder.
3. In Render, create a **PostgreSQL** database. Copy its **Internal Database URL** for a web service in the same Render region.
4. In Render, choose **New + → Web Service**, connect your GitHub repository, and configure:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. In the web service's **Environment** settings, add:
   - Key: `DATABASE_URL`
   - Value: the Internal Database URL copied from your Render PostgreSQL database
6. Deploy. Open the `onrender.com` URL Render gives you. The site and API are served by the same service.

## Important

- Student data is stored in PostgreSQL, not in the browser, so records persist across page refreshes and redeploys as long as the database remains available.
- Keep the database private and never commit passwords or `.env` files.
- This starter project has no login system yet. Before storing real or sensitive student records, add authentication, role-based access, and appropriate privacy protections.
