import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()


def get_mysql_sqlalchemy_uri() -> str:
    """Monta a URI do MySQL a partir do .env e valida conexao com SELECT 1."""
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT", "3306")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME")

    missing = [
        name
        for name, val in [
            ("DB_HOST", db_host),
            ("DB_USER", db_user),
            ("DB_PASSWORD", db_password),
            ("DB_NAME", db_name),
        ]
        if not val
    ]
    if missing:
        raise RuntimeError(
            "Configure o MySQL em backend/.env (obrigatorio): " + ", ".join(missing)
        )

    user_q = quote_plus(str(db_user))
    pass_q = quote_plus(str(db_password))
    uri = f"mysql+pymysql://{user_q}:{pass_q}@{db_host}:{db_port}/{db_name}"

    try:
        engine = create_engine(uri)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise RuntimeError(
            f"Nao foi possivel conectar ao MySQL com as credenciais do .env: {exc}"
        ) from exc

    return uri
