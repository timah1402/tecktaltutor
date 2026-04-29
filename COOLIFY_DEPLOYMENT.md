# TecktalTutor Coolify Deployment Guide

This guide explains how to deploy the TecktalTutor project on Coolify by separating the Backend (FastAPI) and Frontend (Next.js) into two different resources. This ensures scalability, cleaner domains, and isolated logs.

## Prerequisites
- A Coolify instance connected to your GitHub account or repository.
- A domain for the frontend (e.g., `tutor.tecktal.com`).
- A domain for the backend API (e.g., `api.tutor.tecktal.com`).

---

## Part 1: Deploying the Backend (FastAPI)

1. **Add Resource**: In Coolify, create a new **Public Repository** or **Private Repository** application.
2. **Repository Configuration**: Point it to the `TecktalTutor` repository.
3. **Build Pack**: Choose **Docker**.
4. **Build Configuration**:
   - **Base Directory**: `/` (root of the repository)
   - **Dockerfile path**: `/Dockerfile.backend`
   - **Port**: `8001`
5. **Domains**: Set the domain to your backend domain (e.g., `https://api.tutor.tecktal.com`).
6. **Environment Variables**: Add the following critical variables:
   - `LLM_API_KEY`: Your OpenAI/Anthropic key
   - `LLM_MODEL`: e.g., `gpt-4o`
   - `EMBEDDING_API_KEY`: Your embedding provider key
   - `EMBEDDING_MODEL`: e.g., `text-embedding-3-large`
   - *(Optional)* Add any other keys for Search (Perplexity) or TTS.
7. **Storage (Volumes)**: If you want persistent history and logs, configure the following persistent volumes in Coolify:
   - Mount `/app/data/user`
   - Mount `/app/data/knowledge_bases`
8. **Deploy**: Click Deploy.

---

## Part 2: Deploying the Frontend (Next.js)

1. **Add Resource**: Create another application from the same repository.
2. **Build Pack**: Choose **Docker**.
3. **Build Configuration**:
   - **Base Directory**: `/web1`
   - **Dockerfile path**: `/web1/Dockerfile`
   - **Port**: `3782`
4. **Domains**: Set the domain to your frontend domain (e.g., `https://tutor.tecktal.com`).
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE`: Set this to your **backend domain** (e.g., `https://api.tutor.tecktal.com`). 
   *(Note: The frontend Dockerfile has a script that will inject this URL at runtime, so you don't need to rebuild the Next.js image if the API URL changes!)*
6. **Deploy**: Click Deploy.

---

## Verification
- Once both are running, visit your frontend domain. The UI should load.
- Ask the AI a question to verify that the frontend can successfully communicate with the backend via the `NEXT_PUBLIC_API_BASE` URL.
