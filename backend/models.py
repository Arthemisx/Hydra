from datetime import datetime

from extensions import db


class DailyEntry(db.Model):
    # Tabela de registros diarios exibidos/salvos pelo formulario do frontend.
    __tablename__ = "daily_entries"

    id = db.Column(db.Integer, primary_key=True)
    athlete_name = db.Column(db.String(120), nullable=False)
    entry_date = db.Column(db.Date, nullable=False)
    water_intake_ml = db.Column(db.Integer, nullable=False)
    weight_before_kg = db.Column(db.Float, nullable=False)
    weight_after_kg = db.Column(db.Float, nullable=False)
    urine_volume_ml = db.Column(db.Float, nullable=False)
    clothing = db.Column(db.String(120), nullable=False)
    urine_color = db.Column(db.String(50), nullable=False)
    symptoms = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        # Padroniza a resposta JSON no formato esperado pelo frontend.
        return {
            "id": self.id,
            "athleteName": self.athlete_name,
            "entryDate": self.entry_date.isoformat(),
            "waterIntakeMl": self.water_intake_ml,
            "weightBeforeKg": self.weight_before_kg,
            "weightAfterKg": self.weight_after_kg,
            "urineVolumeMl": self.urine_volume_ml,
            "clothing": self.clothing,
            "urineColor": self.urine_color,
            "symptoms": self.symptoms or "",
            "createdAt": self.created_at.isoformat(),
        }
