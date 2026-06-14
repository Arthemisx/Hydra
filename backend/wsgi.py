"""Ponto de entrada WSGI para servidores de producao (gunicorn)."""

from app import create_app

app = create_app()
