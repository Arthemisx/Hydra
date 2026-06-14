from flask import Blueprint, jsonify
from models import Session, User
from auth import jwt_required, role_required

reports_bp = Blueprint("reports", __name__, url_prefix="/api")


@reports_bp.route("/athletes", methods=["GET"])
@jwt_required
@role_required("team")
def list_athletes():
    """Lista todos os atletas (somente para equipe)."""
    athletes = User.query.filter_by(role="athlete").order_by(User.name).all()
    return jsonify([a.to_dict() for a in athletes])


@reports_bp.route("/athletes/<int:athlete_id>/history", methods=["GET"])
@jwt_required
@role_required("team")
def athlete_history(athlete_id):
    """Historico de sessoes de um atleta (somente para equipe)."""
    athlete = User.query.get_or_404(athlete_id)
    sessions = (
        Session.query
        .filter_by(athlete_id=athlete_id)
        .order_by(Session.created_at.desc())
        .all()
    )
    return jsonify({
        "athlete": athlete.to_dict(),
        "sessions": [s.to_dict() for s in sessions],
    })
