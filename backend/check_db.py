from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.database_url)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT
            conname,
            pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'invoice'::regclass
    """))

    print("\n--- CHECK CONSTRAINTS CHO BẢNG INVOICE ---")
    for row in result:
        print(f"Constraint Name: {row[0]}")
        print(f"Definition: {row[1]}\n")