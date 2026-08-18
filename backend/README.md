# MARUTHAM KART FastAPI Backend

This is the production-ready FastAPI backend for MARUTHAM KART, connected to the Supabase PostgreSQL database.

## Requirements
- Python 3.12+

## Directory Structure
```
backend/
  app/
    main.py
    core/
      config.py
      dependencies.py
    database/
      connection.py
  requirements.txt
  .env
  .env.example
  README.md
```

## Local Development Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

The application will start at `http://127.0.0.1:8000`. You can access the API documentation at `http://127.0.0.1:8000/docs`.

## Verification
You can verify the database connection by hitting the health check endpoint:
`http://127.0.0.1:8000/api/v1/health`
