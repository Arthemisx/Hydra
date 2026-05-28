from flask import Blueprint, request, jsonify, g
from models import db, Session, FluidEvent
from autenticacao import jwt_required
from calculos import calculate_session

session_bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")


@session_bp.route("", methods=["POST"])
@jwt_required
def create_session():
    """Cria sessao com dados pre-sessao."""
    data = request.get_json()

    athlete_id = data.get("athlete_id", g.user_id)

    session = Session(
        athlete_id=athlete_id,
        created_by=g.user_id,
        status="pre",
        pre_mass_kg=data.get("pre_mass_kg"),
        temperature_c=data.get("temperature_c"),
        humidity_pct=data.get("humidity_pct"),
        sport=data.get("sport"),
        expected_duration_min=data.get("expected_duration_min"),
        perceived_intensity=data.get("perceived_intensity"),
        urine_color=data.get("urine_color"),
        thirst_level=data.get("thirst_level"),
        symptoms_pre=data.get("symptoms_pre"),
        recent_hydration=data.get("recent_hydration"),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@session_bp.route("", methods=["GET"])
@jwt_required
def list_sessions():
    """Lista sessoes. Atleta ve so as proprias; team ve todas."""
    query = Session.query.order_by(Session.created_at.desc())

    if g.user_role == "athlete":
        query = query.filter_by(athlete_id=g.user_id)
    else:
        athlete_id = request.args.get("athlete_id")
        if athlete_id:
            query = query.filter_by(athlete_id=int(athlete_id))

    sessions = query.all()
    return jsonify([s.to_dict() for s in sessions])


@session_bp.route("/<int:session_id>", methods=["GET"])
@jwt_required
def get_session(session_id):
    """Detalhe de uma sessao."""
    session = Session.query.get_or_404(session_id)

    if g.user_role == "athlete" and session.athlete_id != g.user_id:
        return jsonify({"error": "Acesso negado"}), 403

    return jsonify(session.to_dict())


@session_bp.route("/<int:session_id>/during", methods=["PATCH"])
@jwt_required
def update_during(session_id):
    """Atualiza dados durante a sessao."""
    session = Session.query.get_or_404(session_id)
    data = request.get_json()

    if data.get("actual_duration_min") is not None:
        session.actual_duration_min = data["actual_duration_min"]
    if data.get("urine_volume_ml") is not None:
        session.urine_volume_ml = data["urine_volume_ml"]

    # Recalcula total de fluidos a partir dos eventos
    total_fluid = db.session.query(
        db.func.coalesce(db.func.sum(FluidEvent.volume_ml), 0)
    ).filter_by(session_id=session_id).scalar()
    session.fluid_intake_ml = float(total_fluid)

    session.status = "during"
    db.session.commit()
    return jsonify(session.to_dict())


@session_bp.route("/<int:session_id>/post", methods=["PATCH"])
@jwt_required
def update_post(session_id):
    """Dados pos-sessao. Dispara calculo e finaliza."""
    session = Session.query.get_or_404(session_id)
    data = request.get_json()

    session.post_mass_kg = data.get("post_mass_kg")
    session.soaked_clothing = data.get("soaked_clothing", False)
    session.gi_symptoms = data.get("gi_symptoms")
    session.fatigue_level = data.get("fatigue_level")

    if data.get("actual_duration_min") is not None:
        session.actual_duration_min = data["actual_duration_min"]

    # Recalcula total de fluidos
    total_fluid = db.session.query(
        db.func.coalesce(db.func.sum(FluidEvent.volume_ml), 0)
    ).filter_by(session_id=session_id).scalar()
    session.fluid_intake_ml = float(total_fluid)

    # Calcula resultados
    pre = float(session.pre_mass_kg) if session.pre_mass_kg else 0
    post = float(session.post_mass_kg) if session.post_mass_kg else 0
    fluid = float(session.fluid_intake_ml) if session.fluid_intake_ml else 0
    urine = float(session.urine_volume_ml) if session.urine_volume_ml else 0
    duration = session.actual_duration_min or session.expected_duration_min or 60

    results = calculate_session(pre, post, fluid, urine, duration)

    session.adjusted_loss_kg = results["adjusted_loss_kg"]
    session.sweat_rate_lh = results["sweat_rate_lh"]
    session.mass_variation_pct = results["mass_variation_pct"]
    session.hydration_balance_ml = results["hydration_balance_ml"]
    session.recommended_intake_ml_h = results["recommended_intake_ml_h"]
    session.alert_level = results["alert_level"]
    session.status = "done"

    db.session.commit()
    return jsonify(session.to_dict())


# ── Fluid Events ─────────────────────────────────────────

@session_bp.route("/<int:session_id>/fluid", methods=["POST"])
@jwt_required
def add_fluid_event(session_id):
    """Registra evento de ingestao de fluido."""
    Session.query.get_or_404(session_id)
    data = request.get_json()

    event = FluidEvent(
        session_id=session_id,
        volume_ml=data.get("volume_ml"),
        source=data.get("source", "custom"),
    )
    db.session.add(event)
    db.session.commit()
    return jsonify(event.to_dict()), 201


@session_bp.route("/<int:session_id>/fluid", methods=["GET"])
@jwt_required
def list_fluid_events(session_id):
    """Lista eventos de fluido de uma sessao."""
    events = FluidEvent.query.filter_by(session_id=session_id).order_by(FluidEvent.timestamp).all()
    return jsonify([e.to_dict() for e in events])
