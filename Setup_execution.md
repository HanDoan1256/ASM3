## 1. Prerequisites

- Python with a virtual-environment module.
- Node.js and npm.
- PostgreSQL/Supabase for a shared relational deployment, or SQLite for local fallback development and tests.
- A database schema compatible with the SQLAlchemy models when using PostgreSQL.

The repository does not pin a Python or Node.js runtime version. The verified environment used Python 3.12.5 and Node/npm with the package versions in `frontend/package.json`.

## 2. Environment Configuration

### Backend

Backend settings are read in `backend/app/core/config.py`:

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_EXPIRES_MINUTES=480
```

If `DATABASE_URL` is not set, the application defaults to `sqlite:///./app.db`. When using SQLite, the application creates SQLAlchemy tables at startup. The default JWT secret is for development only and must be replaced for deployment.

### Frontend

Copy `frontend/.env.example` to `frontend/.env` when a custom API URL is needed:

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api
```

The frontend falls back to the same local URL when `VITE_API_URL` is not set.

## 3. Installation

### Clone Repository

```bash
git clone <repository-url>
cd ASM3
```

Replace `<repository-url>` with the repository URL available to your team.

### Backend Setup — macOS/Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### Backend Setup — Windows PowerShell

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

On Windows, create `.env` by copying the contents of `.env.example` if `cp` is unavailable.

## 4. Database Setup

For local SQLite development, run the backend with no `DATABASE_URL`; `Base.metadata.create_all()` creates the mapped tables at application startup. Reference service options can be populated with:

```bash
cd backend
source .venv/bin/activate
python seed_data.py
```

`seed_data.py` manages service options only. Staff, fleet, and branch records must be provisioned separately for staff workflows.

Alembic is configured and the migration chain is present in `backend/alembic/versions/`. The current migration files are incremental changes to an existing schema rather than a complete fresh-database bootstrap. Review the target database before running:

```bash
cd backend
python -m alembic upgrade head
```

Do not use the Alembic command as a substitute for provisioning a complete initial PostgreSQL/Supabase schema unless that schema already exists.

## 5. Running the Application

### Start Backend

In one terminal:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

The backend is normally available at `http://127.0.0.1:8000`.

### Start Frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`.

## 6. Automated Testing

Backend tests are configured by `backend/pytest.ini` and live in `backend/tests/`. The test fixture creates an isolated temporary SQLite database and seeds a service option, staff account, vehicle, and driver; it does not use the developer's local `backend/app.db` or a real PostgreSQL/Supabase database.

Run the tests from `backend/`:

```bash
source .venv/bin/activate
pytest -v --tb=short
```

Verified result on the audited repository state:

```text
9 passed in 8.57s
```

The tests cover registration/login and password hashing, customer-ID spoof prevention, order lifecycle, staff authorization, fleet allocation access, address ownership, tracking ownership, payment amount validation, duplicate-payment rejection, report generation, and deleted-account login prevention.

## 7. Frontend Build Verification

From `frontend/`:

```bash
npm run build
```

Verified result on the audited repository state: the TypeScript build and Vite production build completed successfully. Vite reports a bundle-size warning because the main JavaScript chunk is larger than 500 KB.
