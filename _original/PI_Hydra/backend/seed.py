"""Cria tabelas e insere dados demo."""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, User
import bcrypt


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()
        print("Tabelas criadas.")

        if User.query.first():
            print("Banco ja tem dados — seed ignorado.")
            return

        # Usuario equipe (nutricionista)
        team_hash = bcrypt.hashpw("team123".encode(), bcrypt.gensalt()).decode()
        team = User(
            name="Dra. Maria Nutricionista",
            email="maria@saocamilo.br",
            password_hash=team_hash,
            role="team",
        )

        # Atletas demo
        ath1_hash = bcrypt.hashpw("atleta123".encode(), bcrypt.gensalt()).decode()
        ath1 = User(
            name="Carlos Silva",
            email="carlos@email.com",
            password_hash=ath1_hash,
            role="athlete",
            sport="Corrida",
        )

        ath2_hash = bcrypt.hashpw("atleta123".encode(), bcrypt.gensalt()).decode()
        ath2 = User(
            name="Ana Souza",
            email="ana@email.com",
            password_hash=ath2_hash,
            role="athlete",
            sport="Natacao",
        )

        db.session.add_all([team, ath1, ath2])
        db.session.commit()
        print("Usuarios demo criados:")
        print("  team  -> maria@saocamilo.br / team123")
        print("  atleta -> carlos@email.com / atleta123")
        print("  atleta -> ana@email.com / atleta123")


if __name__ == "__main__":
    seed()
