# Job Application Tracker

> 🚀 **Live App:** https://job-tracker-dg.vercel.app
>
> 📡 **API Docs:** https://job-tracker-api-et9x.onrender.com/docs
>
> *(Free tier backend — first request may take up to 30 seconds to wake up)*

A full-stack web application to manage and visualise your job search pipeline. Built with FastAPI, PostgreSQL, and React — featuring JWT authentication, a real-time dashboard with charts, and full CRUD for tracking every application from first contact to offer.

---

## Features

- **Secure auth** — register and log in with JWT tokens and bcrypt password hashing
- **Application pipeline** — track status across Applied, Phone Screen, Interview, Offer, and Rejected
- **Live dashboard** — stat cards showing response rate, interview rate, and offer rate
- **Charts** — weekly application volume (bar chart) and pipeline breakdown (donut chart)
- **Detail page** — click any application to view full details, edit inline, or delete
- **Custom UI** — sharp dark design system with monospace typography, consistent contrast hierarchy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL + SQLAlchemy ORM |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Frontend | React + Vite |
| Styling | TailwindCSS |
| Charts | Recharts |
| Testing | pytest (10 tests) |
| CI | GitHub Actions |
| Containerisation | Docker + Docker Compose |
| Backend deployment | Render |
| Frontend deployment | Vercel |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/applications/` | Required | List all applications |
| POST | `/applications/` | Required | Create application |
| GET | `/applications/{id}` | Required | Get single application |
| PUT | `/applications/{id}` | Required | Update application |
| DELETE | `/applications/{id}` | Required | Delete application |
| GET | `/applications/stats/summary` | Required | Dashboard stats |

Full interactive docs: https://job-tracker-api-et9x.onrender.com/docs

---

## Running Locally

```bash
git clone https://github.com/DivyanshuGaba/job-tracker.git
cd job-tracker
```

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
DATABASE_URL=postgresql://localhost/job_tracker
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

```bash
psql postgres -c "CREATE DATABASE job_tracker;"
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

**Or with Docker:**
```bash
docker compose up --build
```

**Run tests:**
```bash
cd backend
pytest
```

---

## Project Structure

```
job-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # PostgreSQL connection
│   │   ├── auth.py              # JWT + bcrypt
│   │   └── routers/
│   │       ├── auth.py          # Register + login
│   │       └── applications.py  # CRUD + stats
│   └── tests/                   # 10 pytest unit tests
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   └── ApplicationDetail.jsx
│       └── api/
│           └── client.js        # Axios + JWT injection
├── docker-compose.yml
└── .github/workflows/tests.yml  # CI pipeline
```

---

## Roadmap

- [x] JWT authentication (register + login)
- [x] Full CRUD REST API
- [x] PostgreSQL database with SQLAlchemy ORM
- [x] Dashboard with stat cards and charts
- [x] Application detail page with inline edit
- [x] Custom themed delete confirmation dialog
- [x] Filter by status
- [x] 10 pytest unit tests
- [x] Docker + GitHub Actions CI
- [x] Backend deployed on Render
- [x] Frontend deployed on Vercel
- [ ] Email reminders for follow-ups
- [ ] Interview notes and timeline history
- [ ] Export to CSV