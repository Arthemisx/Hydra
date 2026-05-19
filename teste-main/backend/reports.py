import csv
import unicodedata
from datetime import date, timedelta
from io import StringIO

from fpdf import FPDF
from sqlalchemy import func

from models import db, DailyEntry, Session, User

PERIODS = {"daily", "weekly", "monthly"}
FORMATS = {"pdf", "spreadsheet", "longitudinal"}

PERIOD_LABELS = {
    "daily": "Diario",
    "weekly": "Semanal",
    "monthly": "Mensal",
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
    athlete_name: str, period: str, start: date, end: date, sessions: list[Session]
) -> dict:
    rows = [_session_row(s) for s in sessions]
    if not rows:
        summary = {"sessionCount": 0, "avgFluidMl": None, "avgSweatRateLh": None}
    else:
        n = len(rows)
        fluids = [r["fluidIntakeMl"] for r in rows if r["fluidIntakeMl"]]
        sweats = [r["sweatRateLh"] for r in rows if r["sweatRateLh"] is not None]
        summary = {
            "sessionCount": n,
            "avgFluidMl": round(sum(fluids) / len(fluids), 1) if fluids else None,
            "avgSweatRateLh": round(sum(sweats) / len(sweats), 2) if sweats else None,
        }
    return {
        "athleteName": athlete_name,
        "period": period,
        "periodLabel": PERIOD_LABELS.get(period, period),
        "dateFrom": start.isoformat(),
        "dateTo": end.isoformat(),
        "reportType": "sessions",
        "sessions": rows,
        "summary": summary,
    }


def build_sessions_csv_bytes(athlete_name: str, start: date, end: date, sessions: list[Session]) -> bytes:
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
    text = buf.getvalue()
    return ("\ufeff" + text).encode("utf-8-sig")


def build_sessions_pdf_bytes(
    athlete_name: str, period: str, start: date, end: date, sessions: list[Session]
) -> bytes:
    title = f"Relatorio Sessoes {PERIOD_LABELS.get(period, period)} — {_ascii_safe(athlete_name)}"
    subtitle = f"Periodo: {start.isoformat()} a {end.isoformat()}"

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, _ascii_safe(title), ln=True)
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 8, _ascii_safe(subtitle), ln=True)
    pdf.ln(4)

    if not sessions:
        pdf.set_font("Helvetica", "I", 11)
        pdf.multi_cell(0, 8, "Nenhuma sessao no periodo selecionado.")
    else:
        pdf.set_font("Helvetica", "B", 8)
        col_w = [22, 18, 18, 18, 20, 18, 22, 22, 24]
        headers = ["Data", "Status", "P pre", "P pos", "Fluidos", "Min", "Suor L/h", "Alerta", "Esporte"]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 7, h, border=1)
        pdf.ln()
        pdf.set_font("Helvetica", size=7)
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
            for i, cell in enumerate(row):
                pdf.cell(col_w[i], 6, cell, border=1)
            pdf.ln()

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
