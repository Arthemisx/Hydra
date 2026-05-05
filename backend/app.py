from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import func

from connections import get_mysql_sqlalchemy_uri
from extensions import db
from models import DailyEntry

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = get_mysql_sqlalchemy_uri()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)


@app.route("/api/health", methods=["GET"])
def health():
    # Endpoint simples para testar se a API esta no ar.
    return jsonify({"status": "ok", "service": "athlete-diary-api"})


@app.route("/api/entries", methods=["GET"])
def list_entries():
    # Lista registros mais recentes para os mais antigos.
    entries = DailyEntry.query.order_by(DailyEntry.entry_date.desc(), DailyEntry.id.desc()).all()
    return jsonify([entry.to_dict() for entry in entries])


@app.route("/api/entries", methods=["POST"])
def create_entry():
    # Recebe os dados do formulario e tenta salvar no banco.
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
        # Retorna erro 400 se algum campo obrigatorio nao foi enviado.
        return jsonify({"error": f"Campos obrigatorios ausentes: {', '.join(missing)}"}), 400

    try:
        # Converte tipos e persiste o registro.
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
        # Erro de formato (ex.: texto onde deveria ser numero).
        return jsonify({"error": "Formato de dados invalido."}), 400
    except Exception as exc:
        # Falha inesperada: desfaz a transacao para nao sujar a sessao.
        db.session.rollback()
        return jsonify({"error": f"Falha ao salvar registro: {exc}"}), 500


@app.route("/api/coach/athletes", methods=["GET"])
def list_athletes_for_coach():
    # Lista atletas unicos em ordem alfabetica com resumo de registros.
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


@app.route("/api/coach/athletes/<string:athlete_name>/entries", methods=["GET"])
def list_entries_by_athlete(athlete_name):
    # Retorna historico diario de um atleta especifico.
    entries = (
        DailyEntry.query.filter(func.lower(DailyEntry.athlete_name) == athlete_name.lower())
        .order_by(DailyEntry.entry_date.desc(), DailyEntry.id.desc())
        .all()
    )

    return jsonify({"athleteName": athlete_name, "entries": [entry.to_dict() for entry in entries]})


if __name__ == "__main__":
    # Cria as tabelas automaticamente no primeiro run e sobe a API.
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)
