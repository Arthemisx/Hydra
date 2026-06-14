import json

from flask import Blueprint, jsonify, request, g

from autenticacao import jwt_required
from models import GiCompetitionSurvey, db

gi_survey_bp = Blueprint("gi_surveys", __name__, url_prefix="/api/gi-competition-surveys")


@gi_survey_bp.route("", methods=["POST"])
@jwt_required
def create_gi_survey():
    """Salva questionario de sintomas gastrointestinais de competição."""
    data = request.get_json()
    if not data or "responses" not in data:
        return jsonify({"error": "Informe as respostas do questionário."}), 400

    responses = data["responses"]
    if not isinstance(responses, dict):
        return jsonify({"error": "Formato de respostas invalido."}), 400

    survey = GiCompetitionSurvey(
        athlete_id=g.user_id,
        responses=json.dumps(responses, ensure_ascii=False),
    )
    db.session.add(survey)
    db.session.commit()
    return jsonify(survey.to_dict()), 201


@gi_survey_bp.route("", methods=["GET"])
@jwt_required
def list_gi_surveys():
    """Lista questionarios. Atleta ve so os próprios; team vê todos."""
    query = GiCompetitionSurvey.query.order_by(GiCompetitionSurvey.created_at.desc())

    if g.user_role == "athlete":
        query = query.filter_by(athlete_id=g.user_id)
    else:
        athlete_id = request.args.get("athlete_id")
        if athlete_id:
            query = query.filter_by(athlete_id=int(athlete_id))

    surveys = query.all()
    return jsonify([s.to_dict() for s in surveys])
