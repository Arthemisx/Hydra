from datetime import date
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from config import Config
from models import db
from auth import auth_bp
from routes_session import session_bp
from routes_reports import reports_bp
from routes_daily import daily_bp
from reports import (
    FORMATS,
    PERIODS,
    build_csv_bytes,
    build_longitudinal_payload,
    build_pdf_bytes,
    date_range_for_period,
    fetch_entries,
)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(session_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(daily_bp)

    @app.route("/api/reports/generate", methods=["POST"])
    def generate_report():
        payload = request.get_json(silent=True) or {}
        athlete_name = str(payload.get("athleteName", "")).strip()
        period = str(payload.get("period", "")).strip().lower()
        fmt = str(payload.get("format", "")).strip().lower()

        if not athlete_name:
            return jsonify({"error": "Informe o nome do atleta."}), 400
        if period not in PERIODS:
            return jsonify({"error": "Período inválido. Use: dia, semana ou mês."}), 400
        if fmt not in FORMATS:
            return jsonify({"error": "Formato inválido. Use: pdf ou planilha."}), 400

        try:
            start, end = date_range_for_period(period)
        except ValueError:
            return jsonify({"error": "Período invalido."}), 400

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

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
