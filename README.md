# MongoDB Injection Demo — ISSC Course

**Detailed README (for submission & demonstration)**

> Demo project for the *Information Systems Security Course (ISSC)* showcasing NoSQL / MongoDB injection vulnerabilities and their mitigations. This repository intentionally includes both **vulnerable** and **secure** routes so you can observe attacks and verify fixes.

---

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech stack & tools](#tech-stack--tools)
4. [Repository structure](#repository-structure)
5. [Installation & setup](#installation--setup)

   * Backend
   * Frontend
6. [Environment variables (.env.example)](#environment-variables-envexample)
7. [Running the demo](#running-the-demo)

   * Start backend
   * Start frontend
   * Enabling vulnerable routes
8. [How to perform the demonstration (step-by-step)](#how-to-perform-the-demonstration-step-by-step)

   * 1. Operator Injection: safe vs vulnerable login
   * 2. Aggregation pipeline demo  
   * 3. `$where` / eval demo (disabled by default)

---

## Overview

This project is a controlled, educational demonstration of **MongoDB Injection** (NoSQL injection) vectors and corresponding mitigations. It contains two express route groups:

* **/vuln** — intentionally vulnerable endpoints for live demonstration (only enable locally). These illustrate operator injection, projection abuse, unsafe RegExp usage and executing user-supplied aggregation pipelines.
* **/secure** — hardened endpoints showing validated input, sanitized queries, safe projections and limited aggregation.

Use this repo to reproduce attacks, show their impact, and then demonstrate how secure code prevents exploitation.

---

## Features

* Vulnerable routes that show practical NoSQL attack techniques (operator injection, projection leaks, regex DoS, unsafe aggregation, `$where`).
* Secure counterparts that demonstrate input validation, sanitization, whitelisted projections, regex escaping, and safe aggregation validation.
* Simple React frontend with two login flows (vulnerable vs secure) used during the demo.
* Middleware to sanitize user-supplied objects and utilities for string sanitization.
* `ALLOW_VULN` and `ALLOW_EVAL_VULN` environment flags to safely gate vulnerable behaviors.

---

## Tech stack & tools

* Node.js (>= 16 recommended)
* npm or yarn
* Express.js
* Mongoose (MongoDB)
* React (frontend)
* MongoDB (local or Atlas)
* Postman / curl for testing

---

## Prerequisites

Install the following before running the demo:

* Node.js ([https://nodejs.org/](https://nodejs.org/)) — v16+
* npm (comes with Node) or yarn
* MongoDB: either a local `mongod` instance or MongoDB Atlas connection string

Verify installs:

```bash
node -v
npm -v
# or
yarn -v
# If using local MongoDB
mongod --version
```

---

## Repository structure (high level)

```
/ (repo root)
├─ backend/ (express server files)
│  ├─ server.js
│  ├─ routes/
│  │  ├─ vuln.js
│  │  └─ secure.js
│  ├─ models/User.js
│  └─ utils/
│     ├─ sanitize.js
│     └─ mongoSanitize.js
├─ frontend/ (react app)
│  └─ src/components/Login.jsx
├─ README.md
└─ .env.example
```



---

## Installation & setup

Follow these steps to get the project running locally.

### 1) Clone repository

```bash
git clone <your-repo-url>.git
cd <repo-folder>
```

### 2) Backend setup

```bash
cd backend
npm install
# or
# yarn install
```

Create a `.env` file in `backend/` (see `.env.example` below).

### 3) Frontend setup

Open a new terminal and install frontend deps:

```bash
cd frontend
npm install
# or
# yarn
```

---

## Environment variables (.env.example)

Create `backend/.env` with values similar to:

```
PORT=8080
MONGO_URI=mongodb://127.0.0.1:27017/mongo_inject_demo
ALLOW_VULN=0            # set to 1 only for local demo to enable vulnerable routes
ALLOW_EVAL_VULN=0       # set to 1 ONLY when you intend to demo $where/eval (dangerous)
```

**Important:** Keep `ALLOW_VULN` and `ALLOW_EVAL_VULN` set to `0` on shared/production machines. Only enable on an isolated local environment.

---

## Running the demo

Open two terminals (backend and frontend).

### Start backend

```bash
cd backend
# ensure .env present
npm run start
# or
node server.js
```

You should see: `MongoDB connected` and `server running http://localhost:8080` in logs.

### Start frontend

```bash
cd frontend
npm run dev    # or npm start depending on setup
```

Open the frontend in your browser (e.g., [http://localhost:5173](http://localhost:5173) or [http://localhost:3000](http://localhost:3000)).

### Enabling vulnerable routes

Vulnerable routes are disabled by default. To enable them for demo only:

1. Stop the backend server.
2. In `backend/.env` set:

```
ALLOW_VULN=1
# If you need to demo $where or eval style injection (risky):
ALLOW_EVAL_VULN=1
```

3. Restart the backend server.

A console warning will appear when vuln routes are mounted.

---

## How to perform the demonstration (step-by-step)

Each step includes what to do, what to expect, and which file(s) to show in slides.

### 1) Operator Injection: Vulnerable vs Secure login

* **Goal:** Show how operator injection can bypass authentication on the vulnerable route and is blocked by secure route validation.
* **Vulnerable route:** `POST /vuln/login-operator-injection` — accepts JSON body and uses it directly in the query.
* **Secure route:** `POST /secure/login-secure` — validates input with Joi, sanitizes strings, and compares hashed password.

**Steps:**

1. Use the frontend Login page which has two buttons: *Vulnerable Login* and *Secure Login*.
2. Use `Fill demo creds` (e.g., `alice` / `password123`) — show successful secure login (if user exists).
3. Use `Fill operator` to set `username` to the operator payload: `{"$ne":""}` and click *Vulnerable Login* — the vulnerable route may treat the payload as an operator and return a match even without knowing a password.
4. Click *Secure Login* with the same operator payload and show it fails (validation prevents it or the string is sanitized).

**VULNERABLE**

1. Payload/Input:

`{"username":{"$ne":null},"password":{"$ne":null}}
`
Curl: 

`curl -X POST http://localhost:8080/vuln/login-operator-injection \
  -H "Content-Type: application/json" \
  -d '{"username":{"$ne":null},"password":{"$ne":null}}'
`

2. Result/Output:
   
   <img width="1222" height="816" alt="image" src="https://github.com/user-attachments/assets/ed1bcfdf-d3d9-40b6-bfda-2346e123a541" />

**SECURE**

1. Payload:
   
 `{"username":{"$ne":null},"password":{"$ne":null}}`

 Curl:
 
 `curl -X POST http://localhost:8080/secure/login-secure \
  -H "Content-Type: application/json" \
  -d '{"username":{"$ne":null},"password":{"$ne":null}}`

2. Result/Output:
<img width="1211" height="705" alt="image" src="https://github.com/user-attachments/assets/c2336b1b-2383-4349-9994-614439933879" />

---


### 2) Aggregation pipeline demo

* **Goal:** Show dangers of executing user-supplied aggregation pipelines blindly and how to validate stage/keys.

**Vulnerable endpoint:** `POST /vuln/aggregate-vuln` — accepts full pipeline array and executes it against the collection.

**Secure endpoint:** `POST /secure/aggregate-secure` — validates pipeline stages, allowed ops, and whitelisted project fields.

**Steps:**

1. Demonstrate an Aggregation pipeline  (e.g., [{"$match": {"role":"user"}}, {"$project": {"username":1}}]) on the vulnerable endpoint and show it returns results.

**Vulnerability**

Payload (malicious) :
`{
  "pipeline": [
    { "$match": { "$expr": { "$eq": ["$role", "admin"] } } },
    { "$project": { "username": 1, "email": 1, "password": 1 } }
  ]
}`


Curl / Postman :
`curl -X POST http://localhost:8080/vuln/aggregate-vuln \
  -H "Content-Type: application/json" \
  -d '{"pipeline":[{"$match":{"$expr":{"$eq":["$role","admin"]}}},{"$project":{"username":1,"email":1,"password":1}}]}'`

  
Result/Output :
![WhatsApp Image 2025-11-09 at 18 11 33_83aea583](https://github.com/user-attachments/assets/4f66a91c-d281-48c2-ac57-7fe5a81a3f17)



***Secure**
 Curl / Postman
 
 `curl -X POST http://localhost:8080/secure/aggregate-secure \
  -H "Content-Type: application/json" \
  -d '{"pipeline":[{"$match":{"$expr":{"$eq":["$role","admin"]}}}]}'
`

Result/Output :
<img width="1219" height="825" alt="image" src="https://github.com/user-attachments/assets/8e7bcf4d-2880-473f-b6ee-34d433592f54" />





