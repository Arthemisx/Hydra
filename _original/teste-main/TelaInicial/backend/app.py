from datetime import datetime

from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from sqlalchemy import func

from connections import get_mysql_sqlalchemy_uri
from extensions import db
from models import DailyEntry
from reports import (
    FORMATS,
    PERIODS,
    build_csv_bytes,
    build_longitudinal_payload,
    build_pdf_bytes,
    date_range_for_period,
    fetch_entries,
)

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


@app.route("/api/reports/generate", methods=["POST"])
def generate_report():
    payload = request.get_json(silent=True) or {}
    athlete_name = str(payload.get("athleteName", "")).strip()
    period = str(payload.get("period", "")).strip().lower()
    fmt = str(payload.get("format", "")).strip().lower()

    if not athlete_name:
        return jsonify({"error": "Informe o nome do atleta."}), 400
    if period not in PERIODS:
        return jsonify({"error": "Periodo invalido. Use: daily, weekly ou monthly."}), 400
    if fmt not in FORMATS:
        return jsonify({"error": "Formato invalido. Use: pdf, spreadsheet ou longitudinal."}), 400

    try:
        start, end = date_range_for_period(period)
    except ValueError:
        return jsonify({"error": "Periodo invalido."}), 400

    rows = fetch_entries(athlete_name, start, end)
    safe_name = "".join(c if c.isalnum() or c in " -_" else "_" for c in athlete_name)[:40].strip() or "atleta"

    if fmt == "longitudinal":
        return jsonify(build_longitudinal_payload(athlete_name, period, start, end, rows))

    if fmt == "spreadsheet":
        csv_bytes = build_csv_bytes(athlete_name, start, end, rows)
        filename = f"relatorio_{safe_name}_{start}_{end}.csv"
        return Response(
            csv_bytes,
            mimetype="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    pdf_bytes = build_pdf_bytes(athlete_name, period, start, end, rows)
    filename = f"relatorio_{safe_name}_{start}_{end}.pdf"
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


if __name__ == "__main__":
    # Cria as tabelas automaticamente no primeiro run e sobe a API.
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)
