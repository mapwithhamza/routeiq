import asyncio
from sqlalchemy import text
from database import engine

async def fix():
    # PostgreSQL cannot run ALTER TYPE ADD VALUE inside a transaction block.
    # We must use isolation_level="AUTOCOMMIT"
    autocommit_engine = engine.execution_options(isolation_level="AUTOCOMMIT")
    async with autocommit_engine.connect() as conn:
        print("Adding 'normal' to deliverypriority...")
        try:
            await conn.execute(text("ALTER TYPE deliverypriority ADD VALUE IF NOT EXISTS 'normal';"))
            print("Successfully added 'normal'")
        except Exception as e:
            print(f"Failed to add 'normal': {e}")
            
        print("Adding 'urgent' to deliverypriority...")
        try:
            await conn.execute(text("ALTER TYPE deliverypriority ADD VALUE IF NOT EXISTS 'urgent';"))
            print("Successfully added 'urgent'")
        except Exception as e:
            print(f"Failed to add 'urgent': {e}")
            
    await autocommit_engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix())
