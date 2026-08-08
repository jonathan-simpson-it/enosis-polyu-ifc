"""add CASCADE delete to wco_declarations FK

Revision ID: def45678ghi
Revises: abc12345xyz
Create Date: 2026-07-17 20:50:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = 'def45678ghi'
down_revision: Union[str, None] = 'abc12345xyz'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('wco_declarations_declaration_id_fkey', 'wco_declarations', type_='foreignkey')
    op.create_foreign_key(
        'wco_declarations_declaration_id_fkey',
        'wco_declarations', 'declarations',
        ['declaration_id'], ['id'],
        ondelete='CASCADE',
    )


def downgrade() -> None:
    op.drop_constraint('wco_declarations_declaration_id_fkey', 'wco_declarations', type_='foreignkey')
    op.create_foreign_key(
        'wco_declarations_declaration_id_fkey',
        'wco_declarations', 'declarations',
        ['declaration_id'], ['id'],
    )
