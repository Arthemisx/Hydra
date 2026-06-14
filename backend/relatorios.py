import csv
import json
import unicodedata
from datetime import date, timedelta
from io import StringIO

from fpdf import FPDF
from sqlalchemy import func

from models import db, DailyEntry, GiCompetitionSurvey, Session, User

PERIODS = {"daily", "weekly", "monthly", "3months", "6months", "yearly"}
FORMATS = {"pdf", "spreadsheet", "longitudinal"}

PERIOD_LABELS = {
    "daily": "Diario",
    "weekly": "Última semana",
    "monthly": "Último mês",
    "3months": "Últimos três meses",
    "6months": "Últimos 6 meses",
    "yearly": "Último ano",
}


def date_range_for_period(period: str, ref: date | None = None) -> tuple[date, date]:
    ref = ref or date.today()
    p = period.lower()
    if p == "daily":
        return ref, ref
    if p == "weekly":
        return ref - timedelta(days=6), ref
    if p == "monthly":
        return ref.replace(day=1), ref
    if p == "3months":
        three_months_ago = ref - timedelta(days=90)
        return three_months_ago, ref
    if p == "6months":
        six_months_ago = ref - timedelta(days=180)
        return six_months_ago, ref
    if p == "yearly":
        one_year_ago = ref - timedelta(days=365)
        return one_year_ago, ref
    raise ValueError("periodo invalido")


def fetch_entries(athlete_name: str, start: date, end: date) -> list[DailyEntry]:
    return (
        DailyEntry.query.filter(
            func.lower(DailyEntry.athlete_name) == athlete_name.lower(),
            DailyEntry.entry_date >= start,
            DailyEntry.entry_date <= end,
        )
        .order_by(DailyEntry.entry_date.asc(), DailyEntry.id.asc())
        .all()
    )


def fetch_sessions(athlete_name: str, start: date, end: date) -> list[Session]:
    user = User.query.filter(
        func.lower(User.name) == athlete_name.lower(),
        User.role == "athlete",
    ).first()
    if not user:
        return []
    return (
        Session.query.filter(
            Session.athlete_id == user.id,
            func.date(Session.created_at) >= start,
            func.date(Session.created_at) <= end,
        )
        .order_by(Session.created_at.asc())
        .all()
    )


def fetch_gi_surveys(athlete_name: str, start: date, end: date) -> list[GiCompetitionSurvey]:
    user = User.query.filter(
        func.lower(User.name) == athlete_name.lower(),
        User.role == "athlete",
    ).first()
    if not user:
        return []
    return (
        GiCompetitionSurvey.query.filter(
            GiCompetitionSurvey.athlete_id == user.id,
            func.date(GiCompetitionSurvey.created_at) >= start,
            func.date(GiCompetitionSurvey.created_at) <= end,
        )
        .order_by(GiCompetitionSurvey.created_at.asc())
        .all()
    )


def _format_gi_summary(responses: dict) -> str:
    parts: list[str] = []
    has = responses.get("q12_has_symptoms")
    if has:
        parts.append(f"Sintomas: {has}")
    freq = responses.get("q13_frequency")
    if freq:
        freq_labels = {
            "treino": "treino",
            "competicao": "competicao",
            "ambos": "treino e competicao",
        }
        parts.append(f"Frequencia: {freq_labels.get(freq, freq)}")

    def _yes_no(key: str, label: str) -> None:
        val = responses.get(key)
        if val:
            parts.append(f"{label}: {val}")

    _yes_no("q14_before_training", "Antes treino")
    _yes_no("q17_during_training", "Durante treino")
    _yes_no("q20_after_training", "Apos treino")
    _yes_no("q23_before_competition", "Antes competicao")
    _yes_no("q26_during_competition", "Durante competicao")
    _yes_no("q29_after_competition", "Apos competicao")

    return " | ".join(parts) if parts else "Sem respostas registradas"


def _gi_survey_row(survey: GiCompetitionSurvey) -> dict:
    responses = json.loads(survey.responses) if survey.responses else {}
    return {
        "id": survey.id,
        "entryDate": survey.created_at.date().isoformat() if survey.created_at else "",
        "hasSymptoms": responses.get("q12_has_symptoms"),
        "frequency": responses.get("q13_frequency"),
        "summary": _format_gi_summary(responses),
        "responses": responses,
    }


def _session_row(s: Session) -> dict:
    return {
        "id": s.id,
        "entryDate": s.created_at.date().isoformat() if s.created_at else "",
        "status": s.status,
        "preMassKg": float(s.pre_mass_kg) if s.pre_mass_kg else None,
        "postMassKg": float(s.post_mass_kg) if s.post_mass_kg else None,
        "fluidIntakeMl": float(s.fluid_intake_ml) if s.fluid_intake_ml else 0,
        "actualDurationMin": s.actual_duration_min,
        "sweatRateLh": float(s.sweat_rate_lh) if s.sweat_rate_lh else None,
        "alertLevel": s.alert_level,
        "sport": s.sport,
    }


def build_longitudinal_sessions_payload(
    athlete_name: str,
    period: str,
    start: date,
    end: date,
    sessions: list[Session],
    gi_surveys: list[GiCompetitionSurvey] | None = None,
) -> dict:
    rows = [_session_row(s) for s in sessions]
    gi_rows = [_gi_survey_row(s) for s in (gi_surveys or [])]
    if not rows:
        summary = {"sessionCount": 0, "avgFluidMl": None, "avgSweatRateLh": None, "giSurveyCount": len(gi_rows)}
    else:
        n = len(rows)
        fluids = [r["fluidIntakeMl"] for r in rows if r["fluidIntakeMl"]]
        sweats = [r["sweatRateLh"] for r in rows if r["sweatRateLh"] is not None]
        summary = {
            "sessionCount": n,
            "avgFluidMl": round(sum(fluids) / len(fluids), 1) if fluids else None,
            "avgSweatRateLh": round(sum(sweats) / len(sweats), 2) if sweats else None,
            "giSurveyCount": len(gi_rows),
        }
    return {
        "athleteName": athlete_name,
        "period": period,
        "periodLabel": PERIOD_LABELS.get(period, period),
        "dateFrom": start.isoformat(),
        "dateTo": end.isoformat(),
        "reportType": "sessions",
        "sessions": rows,
        "giSurveys": gi_rows,
        "summary": summary,
    }


def build_sessions_csv_bytes(
    athlete_name: str,
    start: date,
    end: date,
    sessions: list[Session],
    gi_surveys: list[GiCompetitionSurvey] | None = None,
) -> bytes:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "Data",
            "Status",
            "Peso pre kg",
            "Peso pos kg",
            "Fluidos mL",
            "Duracao min",
            "Taxa suor L/h",
            "Alerta",
            "Esporte",
        ]
    )
    for s in sessions:
        r = _session_row(s)
        w.writerow(
            [
                r["entryDate"],
                r["status"],
                r["preMassKg"] or "",
                r["postMassKg"] or "",
                r["fluidIntakeMl"],
                r["actualDurationMin"] or "",
                r["sweatRateLh"] or "",
                r["alertLevel"] or "",
                r["sport"] or "",
            ]
        )

    if gi_surveys:
        w.writerow([])
        w.writerow(["--- Questionarios SGI de Competicao ---"])
        w.writerow(["Data", "Sintomas", "Frequencia", "Resumo"])
        for survey in gi_surveys:
            r = _gi_survey_row(survey)
            w.writerow(
                [
                    r["entryDate"],
                    r["hasSymptoms"] or "",
                    r["frequency"] or "",
                    r["summary"],
                ]
            )

    text = buf.getvalue()
    return ("\ufeff" + text).encode("utf-8-sig")


def build_sessions_pdf_bytes(
    athlete_name: str,
    period: str,
    start: date,
    end: date,
    sessions: list[Session],
    gi_surveys: list[GiCompetitionSurvey] | None = None,
) -> bytes:
    title = f"Relatorio - Sessoes (" + PERIOD_LABELS.get(period, period) + ")"
    subtitle = f"Periodo: {start.isoformat()} a {end.isoformat()}"

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(0, 51, 102)
    pdf.cell(0, 12, _ascii_safe(title), ln=True, align="C")
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, _ascii_safe(athlete_name), ln=True, align="C")
    pdf.set_font("Helvetica", size=11)
    pdf.set_text_color(102, 102, 102)
    pdf.cell(0, 8, _ascii_safe(subtitle), ln=True, align="C")
    pdf.ln(8)

    if not sessions and not gi_surveys:
        pdf.set_font("Helvetica", "I", 12)
        pdf.set_text_color(0, 0, 0)
        pdf.multi_cell(0, 8, "Nenhuma sessao ou questionario SGI no periodo selecionado.")
    else:
        if sessions:
            pdf.set_font("Helvetica", "B", 14)
            pdf.set_text_color(0, 0, 0)
            pdf.cell(0, 10, "Sessoes de treino", ln=True)
            pdf.ln(4)
            # Header row
            pdf.set_fill_color(0, 51, 102)
            pdf.set_text_color(255, 255, 255)
            pdf.set_font("Helvetica", "B", 9)
            col_w = [22, 18, 18, 18, 20, 18, 22, 22, 24]
            headers = ["Data", "Status", "P pre", "P pos", "Fluidos", "Min", "Suor L/h", "Alerta", "Esporte"]
            for i, h in enumerate(headers):
                pdf.cell(col_w[i], 8, h, border=0, fill=True)
            pdf.ln()
            # Data rows
            pdf.set_text_color(0, 0, 0)
            pdf.set_font("Helvetica", size=8)
            for s in sessions:
                r = _session_row(s)
                row = [
                    r["entryDate"],
                    _ascii_safe(str(r["status"] or ""))[:10],
                    str(r["preMassKg"] or ""),
                    str(r["postMassKg"] or ""),
                    str(r["fluidIntakeMl"]),
                    str(r["actualDurationMin"] or ""),
                    str(r["sweatRateLh"] or ""),
                    _ascii_safe(str(r["alertLevel"] or ""))[:10],
                    _ascii_safe(str(r["sport"] or ""))[:12],
                ]
                # Status colors
                alert_level = r["alertLevel"]
                fill = False
                fill_color = (255, 255, 255)
                text_color = (0, 0, 0)
                if alert_level == "PERIGO":
                    fill = True
                    fill_color = (255, 51, 51)
                    text_color = (255, 255, 255)
                elif alert_level == "CUIDADO":
                    fill = True
                    fill_color = (255, 204, 0)
                elif r["status"] == "done":
                    fill = True
                    fill_color = (153, 255, 153)
                elif r["status"] == "pre":
                    fill = True
                    fill_color = (153, 204, 255)
                # Draw cells
                for i, cell in enumerate(row):
                    if i == 7:  # Alerta
                        pdf.set_fill_color(*fill_color)
                        pdf.set_text_color(*text_color)
                        pdf.cell(col_w[i], 7, cell, border=0, fill=fill)
                        pdf.set_fill_color(255, 255, 255)
                        pdf.set_text_color(0, 0, 0)
                    elif i == 1:  # Status
                        if r["status"] == "done":
                            pdf.set_fill_color(153, 255, 153)
                            pdf.cell(col_w[i], 7, cell, border=0, fill=True)
                        elif r["status"] == "pre":
                            pdf.set_fill_color(153, 204, 255)
                            pdf.cell(col_w[i], 7, cell, border=0, fill=True)
                        else:
                            pdf.cell(col_w[i], 7, cell, border=0)
                    else:
                        pdf.cell(col_w[i], 7, cell, border=0)
                pdf.ln()

        if gi_surveys:
            pdf.ln(8)
            pdf.set_font("Helvetica", "B", 14)
            pdf.set_text_color(0, 0, 0)
            pdf.cell(0, 10, "Questionarios SGI de Competicao", ln=True)
            pdf.ln(4)
            # GI Header
            pdf.set_fill_color(0, 51, 102)
            pdf.set_text_color(255, 255, 255)
            pdf.set_font("Helvetica", "B", 9)
            gi_col_w = [24, 18, 24, 124]
            gi_headers = ["Data", "Sintomas", "Frequencia", "Resumo"]
            for i, h in enumerate(gi_headers):
                pdf.cell(gi_col_w[i], 8, h, border=0, fill=True)
            pdf.ln()
            # GI Rows
            pdf.set_text_color(0, 0, 0)
            pdf.set_font("Helvetica", size=8)
            for survey in gi_surveys:
                r = _gi_survey_row(survey)
                row = [
                    r["entryDate"],
                    _ascii_safe(str(r["hasSymptoms"] or ""))[:8],
                    _ascii_safe(str(r["frequency"] or ""))[:12],
                    _ascii_safe(r["summary"])[:80],
                ]
                # Symptoms color
                has_symptoms = r["hasSymptoms"]
                for i, cell in enumerate(row):
                    if i == 1:
                        if has_symptoms == "sim":
                            pdf.set_fill_color(255, 102, 102)
                            pdf.set_text_color(255, 255, 255)
                            pdf.cell(gi_col_w[i], 7, cell, border=0, fill=True)
                            pdf.set_text_color(0, 0, 0)
                            pdf.set_fill_color(255, 255, 255)
                        else:
                            pdf.cell(gi_col_w[i], 7, cell, border=0)
                    else:
                        pdf.cell(gi_col_w[i], 7, cell, border=0)
                pdf.ln()
        # Footer
        pdf.ln(6)
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(102, 102, 102)
        pdf.cell(0, 6, "* L/h = Litros por hora", ln=True)

    raw = pdf.output(dest="S")
    return raw if isinstance(raw, (bytes, bytearray)) else raw.encode("latin-1")


def _ascii_safe(text: str) -> str:
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")


def build_longitudinal_payload(
    athlete_name: str, period: str, start: date, end: date, entries: list[DailyEntry]
) -> dict:
    rows = [e.to_dict() for e in entries]
    if not rows:
        summary = {
            "entryCount": 0,
            "avgWaterIntakeMl": None,
            "avgWeightAfterKg": None,
        }
    else:
        n = len(rows)
        summary = {
            "entryCount": n,
            "avgWaterIntakeMl": round(sum(r["waterIntakeMl"] for r in rows) / n, 1),
            "avgWeightAfterKg": round(sum(r["weightAfterKg"] for r in rows) / n, 2),
        }
    return {
        "athleteName": athlete_name,
        "period": period,
        "periodLabel": PERIOD_LABELS.get(period, period),
        "dateFrom": start.isoformat(),
        "dateTo": end.isoformat(),
        "entries": rows,
        "summary": summary,
    }


def build_csv_bytes(athlete_name: str, start: date, end: date, entries: list[DailyEntry]) -> bytes:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "Data",
            "Atleta",
            "Agua mL",
            "Peso antes kg",
            "Peso depois kg",
            "Volume urina mL",
            "Vestimenta",
            "Cor urina",
            "Sintomas",
        ]
    )
    for e in entries:
        d = e.to_dict()
        w.writerow(
            [
                d["entryDate"],
                d["athleteName"],
                d["waterIntakeMl"],
                d["weightBeforeKg"],
                d["weightAfterKg"],
                d["urineVolumeMl"],
                d["clothing"],
                d["urineColor"],
                d["symptoms"],
            ]
        )
    text = buf.getvalue()
    return ("\ufeff" + text).encode("utf-8-sig")


def build_pdf_bytes(
    athlete_name: str, period: str, start: date, end: date, entries: list[DailyEntry]
) -> bytes:
    title = f"Relatorio {PERIOD_LABELS.get(period, period)} — {_ascii_safe(athlete_name)}"
    subtitle = f"Periodo: {start.isoformat()} a {end.isoformat()}"

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, _ascii_safe(title), ln=True)
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 8, _ascii_safe(subtitle), ln=True)
    pdf.ln(4)

    if not entries:
        pdf.set_font("Helvetica", "I", 11)
        pdf.multi_cell(0, 8, "Nenhum registro no periodo selecionado.")
    else:
        pdf.set_font("Helvetica", "B", 8)
        col_w = [24, 16, 18, 18, 18, 22, 28, 42]
        headers = ["Data", "Agua", "P antes", "P depois", "Urina", "Cor", "Sintomas", "Vestir"]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 7, h, border=1)
        pdf.ln()
        pdf.set_font("Helvetica", size=7)
        for e in entries:
            d = e.to_dict()
            row = [
                d["entryDate"],
                str(d["waterIntakeMl"]),
                str(d["weightBeforeKg"]),
                str(d["weightAfterKg"]),
                str(d["urineVolumeMl"]),
                _ascii_safe(d["urineColor"])[:12],
                _ascii_safe(d["symptoms"])[:14],
                _ascii_safe(d["clothing"])[:14],
            ]
            for i, cell in enumerate(row):
                pdf.cell(col_w[i], 6, cell, border=1)
            pdf.ln()

    raw = pdf.output(dest="S")
    return raw if isinstance(raw, (bytes, bytearray)) else raw.encode("latin-1")
