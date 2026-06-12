from datetime import date
from flask import Flask, Response, jsonify, request, g
from flask_cors import CORS
from config import Config
from models import db, User
from autenticacao import auth_bp, jwt_required
from rotas_sessao import session_bp
from rotas_relatorios import reports_bp
from rotas_diario import daily_bp
from rotas_sgi_competicao import gi_survey_bp
from relatorios import (
    FORMATS,
    PERIODS,
    build_csv_bytes,
    build_longitudinal_payload,
    build_longitudinal_sessions_payload,
    build_pdf_bytes,
    build_sessions_csv_bytes,
    build_sessions_pdf_bytes,
    date_range_for_period,
    fetch_entries,
    fetch_gi_surveys,
    fetch_sessions,
)
from integracoes import get_weather_by_coords, analyze_session, chat_with_ai


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(session_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(daily_bp)
    app.register_blueprint(gi_survey_bp)

    @app.route("/api/reports/generate", methods=["POST"])
    @jwt_required
    def generate_report():
        payload = request.get_json(silent=True) or {}
        period = str(payload.get("period", "")).strip().lower()
        fmt = str(payload.get("format", "")).strip().lower()

        current_user = User.query.get(g.user_id)
        if not current_user:
            return jsonify({"error": "Usuário não encontrado."}), 404

        athlete_name = current_user.name.strip()
        requested_name = str(payload.get("athleteName", "")).strip()
        if requested_name and requested_name.lower() != athlete_name.lower():
            return jsonify({"error": "Voce só pode gerar o próprio relatorio."}), 403

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

        report_source = str(payload.get("reportSource", "auto")).strip().lower()
        daily_rows = fetch_entries(athlete_name, start, end)
        session_rows = fetch_sessions(athlete_name, start, end)
        gi_survey_rows = fetch_gi_surveys(athlete_name, start, end)
        use_sessions = report_source == "sessions" or (
            report_source == "auto" and (bool(session_rows) or bool(gi_survey_rows))
        )

        safe_name = "".join(c if c.isalnum() or c in " -_" else "_" for c in athlete_name)[:40].strip() or "atleta"

        if fmt == "longitudinal":
            if use_sessions and (session_rows or gi_survey_rows):
                return jsonify(
                    build_longitudinal_sessions_payload(
                        athlete_name, period, start, end, session_rows, gi_survey_rows
                    )
                )
            return jsonify(build_longitudinal_payload(athlete_name, period, start, end, daily_rows))

        if fmt == "spreadsheet":
            if use_sessions and (session_rows or gi_survey_rows):
                csv_bytes = build_sessions_csv_bytes(
                    athlete_name, start, end, session_rows, gi_survey_rows
                )
            else:
                csv_bytes = build_csv_bytes(athlete_name, start, end, daily_rows)
            filename = f"relatorio_{safe_name}_{start}_{end}.csv"
            return Response(
                csv_bytes,
                mimetype="text/csv; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )

        if use_sessions and (session_rows or gi_survey_rows):
            pdf_bytes = build_sessions_pdf_bytes(
                athlete_name, period, start, end, session_rows, gi_survey_rows
            )
        else:
            pdf_bytes = build_pdf_bytes(athlete_name, period, start, end, daily_rows)
        filename = f"relatorio_{safe_name}_{start}_{end}.pdf"
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # Rota para pegar clima por coordenadas
    @app.route("/api/weather", methods=["GET"])
    def get_weather():
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)

        if not lat or not lon:
            return jsonify({"error": "Parâmetros 'lat' e 'lon' são obrigatórios."}), 400

        weather = get_weather_by_coords(lat, lon)

        if not weather:
            return jsonify({"error": "Não foi possível buscar dados de clima."}), 500

        return jsonify(weather)

    # Rota para analisar sessão com AI
    @app.route("/api/analyze-session", methods=["POST"])
    def analyze_session_endpoint():
        session_data = request.get_json(silent=True) or {}

        if not session_data:
            return jsonify({"error": "Dados da sessão são obrigatórios."}), 400

        analysis = analyze_session(session_data)

        return jsonify({"analysis": analysis})

    # Rota para chat com IA
    @app.route("/api/chat", methods=["POST"])
    def chat_endpoint():
        data = request.get_json(silent=True) or {}
        
        message = data.get("message")
        session_data = data.get("sessionData")
        chat_history = data.get("chatHistory", [])
        
        if not message:
            return jsonify({"error": "Mensagem é obrigatória."}), 400
        if not session_data:
            return jsonify({"error": "Dados da sessão são obrigatórios."}), 400
        
        try:
            reply = chat_with_ai(message, session_data, chat_history)
            return jsonify({"reply": reply})
        except Exception as e:
            return jsonify({"error": f"Erro ao processar mensagem: {str(e)}"}), 500

    with app.app_context():
        db.create_all()
        _ensure_session_gi_column()

    return app


def _ensure_session_gi_column():
    from sqlalchemy import inspect, text

    inspector = inspect(db.engine)
    if "sessions" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("sessions")}
    if "gi_responses" not in columns:
        with db.engine.begin() as conn:
            conn.execute(text("ALTER TABLE sessions ADD COLUMN gi_responses TEXT"))
    if "perceived_intensity" not in columns:
        with db.engine.begin() as conn:
            conn.execute(text("ALTER TABLE sessions ADD COLUMN perceived_intensity INTEGER"))
    if "perceived_intensity_post" not in columns:
        with db.engine.begin() as conn:
            conn.execute(text("ALTER TABLE sessions ADD COLUMN perceived_intensity_post INTEGER"))


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
