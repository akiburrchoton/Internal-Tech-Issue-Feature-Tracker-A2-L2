# DevPulse Issue Tracker API

A modular Node.js backend built with Express, TypeScript, and PostgreSQL (Supabase). This application features stateless JWT authentication, a strict role-based authorization hierarchy, and high-performance batched database queries that eliminate the need for heavy SQL `JOIN` statements.

---

## 🛠️ Tech Stack & Architecture

* **Runtime & Language:** Node.js, TypeScript (`ts-node-dev` for hot-reloading)
* **Framework:** Express.js
* **Database Driver:** `pg` (Connection Pooling optimized for Supabase)
* **Security:** `jsonwebtoken` for identity handling, `bcryptjs` for secure password hashing
* **Design Pattern:** Controller-Service-Repository architecture (Modular pattern)

---

## 📁 Project Structure

```text
├── src/
│   ├── types.d.ts            # Global Express Request extensions for JWT payloads
│   ├── app.ts                # Application entry point & server setup
│   ├── config.ts             # Application configurations & environment validations
│   ├── db.ts                 # Database pool initialization & automatic table creation
│   ├── authMiddleware.ts     # Stateless JWT authentication guard middleware
│   ├── router.ts             # Authentication routing layer
│   ├── userController.ts     # Authentication HTTP request controllers
│   ├── userService.ts        # Database access layer for user accounts
│   ├── issueRouter.ts        # Issues routing sub-system
│   ├── issueController.ts    # Issues HTTP request controllers
│   └── issueService.ts       # Database access layer for issue tracking
├── .env                      # Local environment secrets (Git ignored)
├── .gitignore                # Application file ignore tracking definitions
├── package.json              # Application manifest & scripts config
└── tsconfig.json             # TypeScript compiler rules
```

---

## 🔐 Roles and Permissions


| Role | Allowed Actions |
| :--- | :--- |
| **contributor** | • Register and log in<br>• Create new issues<br>• View all issues |
| **maintainer** | • All contributor permissions<br>• Update any issue field / Change workflow status<br>• Delete any issue |

---

## 🚀 Getting Started

### 1. Installation
Clone your repository, navigate to the project directory, and download dependencies:
```bash
npm install
```

### 2. Environment Setup
Create an `.env` file in the root folder of your project (the `.gitignore` file will keep this safe from GitHub):
```env
PORT=3000
DATABASE_URL=your_supabase_postgresql_connection_string
JWT_SECRET=your_secure_64_character_hex_string
```
> 💡 *To generate an ultra-secure secret string instantly, execute this in your terminal:*  
> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 3. Running the Project
```bash
# Start development server with live reload
npm run dev

# Compile TypeScript code into production JavaScript
npm run build

# Run compiled production build
npm start
```

---

## 📡 API Documentation

### 1. User Registration (Signup)
* **Endpoint:** `POST /api/auth/signup`
* **Access:** Public
* **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

### 2. User Authentication (Login)
* **Endpoint:** `POST /api/auth/login`
* **Access:** Public
* **Request Body:**
```json
{
  "email": "john.doe@devpulse.com",
  "password": "securePassword123"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@devpulse.com",
      "role": "contributor",
      "created_at": "2026-01-20T09:00:00Z",
      "updated_at": "2026-01-20T09:00:00Z"
    }
  }
}
```

### 3. Create Issue
* **Endpoint:** `POST /api/issues`
* **Access:** Authenticated Users (`contributor`, `maintainer`)
* **Headers Required:** `Authorization: <JWT_TOKEN>`
* **Request Body:**
```json
{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
  "type": "bug"
}
```

### 4. Get All Issues
* **Endpoint:** `GET /api/issues`
* **Access:** Public
* **Query Parameters:**
  * `sort`: `newest` (Default) or `oldest`
  * `type`: `bug` or `feature_request`
  * `status`: `open`, `in_progress`, or `resolved`
* **Example Usage:** `GET /api/issues?sort=newest&type=bug&status=open`
* **Architecture Note:** Relational reporter data is automatically hydrated using a fast batch lookup (`WHERE id IN (...)`) instead of blocking database engine resources with traditional table joins.

---

## 🧪 Postman Setup Guide

1. **Get Token:** Fire a `POST` request to `/api/auth/login`. Copy the long string inside the `token` response field.
2. **Inject Token:** When sending a `POST` request to `/api/issues`, navigate to the **Headers** tab in Postman. Add a key named `Authorization` and paste the raw token string directly as the value.
