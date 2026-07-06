"""SQLite database connection and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables in the database."""
    from src.models import Base  # noqa: F811

    Base.metadata.create_all(bind=engine)
