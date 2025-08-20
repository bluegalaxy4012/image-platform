# 📸 RapidPic Image Platform

RapidPic is a web app for sharing and managing images. Upload pics, add effects, and share them securely. It’s fast, easy to use, and hosted at: **https://rapidpic.marian.homes**

## Features

- Upload and view images with a clean React frontend.
- Log in securely, reset passwords via email, and control access to private images.
- Process images (resize, effects) in the background.
- Expired images and accounts are auto-cleaned.

## Tech Stack

- **Frontend**: Vite, React, TypeScript
- **Backend**: FastAPI, Python, Uvicorn, Celery, Redis
- **Database**: PostgreSQL (via AWS RDS)
- **Deployment**: Docker, AWS EC2, Caddy (for SSL)
- **Auth**: JWT tokens

## How It's Built

RapidPic lets you upload images through a React frontend that talks to a FastAPI backend. The backend uses Celery and Redis to handle image processing (like resizing or effects) in the background. JWT tokens secure login and access, with email-based password resets handled personally via Gmail SMTP. The app runs on AWS EC2 with the PostgreSQL database running on AWS RDS and Caddy to serve my domain and manage HTTPS. Expired images and accounts are cleaned up automatically through Celery scheduled tasks.

## Running It Locally

1. **Clone the repo**:

   ```bash
   git clone https://github.com/bluegalaxy4012/image-platform.git
   cd image-platform
   ```

2. **Set up environment files**:

   - Create `backend/.env` with:

     ```
     DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>:<port>/<dbname>  # Or your PostgreSQL connection string
     CELERY_BROKER_URL=redis://redis:6379/0  # Redis URL for Celery tasks (adjust if using another broker)
     CELERY_RESULT_BACKEND=redis://redis:6379/0  # Redis URL for task results (adjust if different)
     REDIS_RATE_LIMIT_URL=redis://redis:6379/0  # Redis URL for rate limiting (adjust if using another)
     SECRET_KEY=<random_secure_string>  # Random string for JWT signing
     ALGORITHM=<your_algorithm>  # JWT algorithm (for example HS256 or RS256)
     ACCESS_TOKEN_EXPIRE_MINUTES=15  # Token expiration in minutes
     GMAIL_USER=<your_gmail_email>  # Gmail address for sending password reset emails
     GMAIL_PASSWORD=<your_gmail_app_password>  # Gmail app-specific password
     FRONTEND_URL=<your_frontend_url>  # Frontend URL (for example http://localhost:5173 or hosted URL)
     ```

   - Create `frontend/.env` with:

     ```
     VITE_BACKEND_URL=<your_backend_url>  # Backend URL (for example http://localhost:8000 or hosted URL)
     VITE_FRONTEND_URL=<your_frontend_url>  # Frontend URL (for example http://localhost:5173 or hosted URL)
     ```

3. **Run backend with Docker**:

   - Ensure Docker and Docker Compose are installed and running.

   - From the `image-platform` directory, run:

     ```bash
     docker compose up --build
     ```

4. **Run frontend and access the app**:

   - If not already using a served frontend, go to the `frontend` directory and start the dev server:

     ```bash
     cd frontend
     npm install
     npm run dev
     ```

   - Open the frontend URL (for example `http://localhost:5173` for local dev, or your url) in your browser.

**Note**: Make sure your Redis and PostgreSQL URLs are accessible. If you do use a different port for the backend (instead of 8000), remember to update the `.env` files, `docker-compose.yml` and `Dockerfile`, replacing 8000 with your port. If you want to use a different port for the local dev frontend (instead of 5173), replace it with yours in the `.env` files and in `frontend/vite.config.ts`.
