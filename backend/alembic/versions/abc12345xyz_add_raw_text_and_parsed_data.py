"""add raw_text and parsed_data columns to declarations

Revision ID: abc12345xyz
Revises: d33aba82a0e8
Create Date: 2026-07-17 19:52:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'abc12345xyz'
down_revision: Union[str, None] = 'd33aba82a0e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('declarations', sa.Column('raw_text', sa.Text(), nullable=True))
    op.add_column('declarations', sa.Column('parsed_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('declarations', 'parsed_data')
    op.drop_column('declarations', 'raw_text')
