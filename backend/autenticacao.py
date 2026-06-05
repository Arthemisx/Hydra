from functools import wraps
from flask import Blueprint, request, jsonify, g
import bcrypt
import jwt
from config import Config
from models import db, User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def encode_token(user_id, role):
    token = jwt.encode(
        {"user_id": user_id, "role": role},
        Config.JWT_SECRET,
        algorithm="HS256",
    )
    return token if isinstance(token, str) else token.decode("utf-8")


def decode_token(token):
    return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])


def jwt_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Token ausente"}), 401
        try:
            payload = decode_token(header.split(" ")[1])
            g.user_id = payload["user_id"]
            g.user_role = payload["role"]
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalido"}), 401
        return f(*args, **kwargs)
    return wrapper


def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if g.user_role != role:
                return jsonify({"error": "Acesso negado"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "athlete")

    if not name or not email or not password:
        return jsonify({"error": "name, email e password sao obrigatorios"}), 400

    if role not in ("athlete", "team"):
        return jsonify({"error": "role deve ser 'athlete' ou 'team'"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email ja cadastrado"}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role,
        sport=data.get("sport"),
    )
    db.session.add(user)
    db.session.commit()

    token = encode_token(user.id, user.role)
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email e password sao obrigatorios"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "Credenciais invalidas"}), 401

    token = encode_token(user.id, user.role)
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.route("/me", methods=["GET"])
@jwt_required
def me():
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({"error": "Usuario nao encontrado"}), 404
    return jsonify(user.to_dict())
