from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from models import db, DailyEntry

daily_bp = Blueprint("daily", __name__, url_prefix="/api")


@daily_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "athlete-diary-api"})


@daily_bp.route("/entries", methods=["GET"])
def list_entries():
    entries = DailyEntry.query.order_by(DailyEntry.entry_date.desc(), DailyEntry.id.desc()).all()
    return jsonify([entry.to_dict() for entry in entries])


@daily_bp.route("/entries", methods=["POST"])
def create_entry():
    payload = request.get_json(silent=True) or {}

    required_fields = [
        "athleteName",
        "entryDate",
        "waterIntakeMl",
        "weightBeforeKg",
        "weightAfterKg",
        "urineVolumeMl",
        "clothing",
        "urineColor",
    ]
    missing = [field for field in required_fields if field not in payload or payload[field] in ("", None)]
    if missing:
        return jsonify({"error": f"Campos obrigatorios ausentes: {', '.join(missing)}"}), 400

    try:
        entry = DailyEntry(
            athlete_name=str(payload["athleteName"]).strip(),
            entry_date=datetime.strptime(payload["entryDate"], "%Y-%m-%d").date(),
            water_intake_ml=int(payload["waterIntakeMl"]),
            weight_before_kg=float(payload["weightBeforeKg"]),
            weight_after_kg=float(payload["weightAfterKg"]),
            urine_volume_ml=float(payload["urineVolumeMl"]),
            clothing=str(payload["clothing"]).strip(),
            urine_color=str(payload["urineColor"]).strip(),
            symptoms=str(payload.get("symptoms", "")).strip(),
        )
        db.session.add(entry)
        db.session.commit()
        return jsonify(entry.to_dict()), 201
    except ValueError:
        return jsonify({"error": "Formato de dados invalido."}), 400
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": f"Falha ao salvar registro: {exc}"}), 500


@daily_bp.route("/coach/athletes", methods=["GET"])
def list_athletes_for_coach():
    athletes = (
        db.session.query(
            DailyEntry.athlete_name.label("athlete_name"),
            func.max(DailyEntry.entry_date).label("last_entry_date"),
            func.count(DailyEntry.id).label("total_entries"),
        )
        .group_by(DailyEntry.athlete_name)
        .order_by(func.lower(DailyEntry.athlete_name).asc())
        .all()
    )

    if not athletes:
        return jsonify([])

    athlete_names = {row.athlete_name for row in athletes}
    latest_by_name = {}
    for entry in DailyEntry.query.order_by(DailyEntry.entry_date.desc(), DailyEntry.id.desc()).all():
        if entry.athlete_name not in latest_by_name:
            latest_by_name[entry.athlete_name] = entry
        if len(latest_by_name) == len(athlete_names):
            break

    return jsonify(
        [
            {
                "name": athlete.athlete_name,
                "lastEntryDate": athlete.last_entry_date.isoformat() if athlete.last_entry_date else None,
                "totalEntries": int(athlete.total_entries or 0),
                "lastEntry": latest_by_name.get(athlete.athlete_name).to_dict()
                if latest_by_name.get(athlete.athlete_name)
                else None,
            }
            for athlete in athletes
        ]
    )


@daily_bp.route("/coach/athletes/<string:athlete_name>/entries", methods=["GET"])
def list_entries_by_athlete(athlete_name):
    entries = (
        DailyEntry.query.filter(func.lower(DailyEntry.athlete_name) == athlete_name.lower())
        .order_by(DailyEntry.entry_date.desc(), DailyEntry.id.desc())
        .all()
    )
    return jsonify({"athleteName": athlete_name, "entries": [entry.to_dict() for entry in entries]})
