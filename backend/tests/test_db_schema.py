import pytest
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.connection import SessionLocal, Base
from app.models.models import Department, User, Employee

@pytest.fixture(scope="module")
def db():
    # Set up a database session for testing
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_db_connection(db: Session):
    # Verify basic connection can execute a query
    result = db.execute(text("SELECT 1")).fetchone()
    assert result[0] == 1

def test_create_and_query_relations(db: Session):
    # 1. Create a temporary department
    dept_name = f"Test Department {uuid.uuid4().hex[:6]}"
    test_dept = Department(name=dept_name)
    db.add(test_dept)
    db.commit()
    db.refresh(test_dept)
    
    assert test_dept.id is not None
    assert test_dept.name == dept_name

    # 2. Create a temporary user for employee
    user_email = f"test.employee.{uuid.uuid4().hex[:6]}@marutham.com"
    test_user = User(
        email=user_email,
        phone=f"+91 99999 {uuid.uuid4().hex[:5]}",
        name="Test Employee User",
        password_hash="hashed_pin_123",
        role="godown_officer",
        status="Active"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    assert test_user.id is not None

    # 3. Create an employee referencing the user and department
    emp_code = f"MK-EMP-TEST-{uuid.uuid4().hex[:4]}"
    test_employee = Employee(
        id=test_user.id,
        employee_code=emp_code,
        department_id=test_dept.id,
        role="Godown Officer",
        location="Chennai Head Office"
    )
    db.add(test_employee)
    db.commit()
    db.refresh(test_employee)

    # 4. Verify relationships
    queried_emp = db.query(Employee).filter_by(employee_code=emp_code).first()
    assert queried_emp is not None
    assert queried_emp.department.name == dept_name
    assert queried_emp.user.email == user_email
    
    # 5. Clean up testing records in reverse order
    db.delete(queried_emp)
    db.delete(test_user)
    db.delete(test_dept)
    db.commit()

    # Verify cleanup succeeded
    assert db.query(Department).filter_by(name=dept_name).first() is None
    assert db.query(User).filter_by(email=user_email).first() is None
    assert db.query(Employee).filter_by(employee_code=emp_code).first() is None
