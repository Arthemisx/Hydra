from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    sport = db.Column(db.String(80))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "sport": self.sport,
            "created_at": self.created_at.isoformat(),
        }


class DailyEntry(db.Model):
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
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
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


class Session(db.Model):
    __tablename__ = "sessions"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(20), default="pre")

    pre_mass_kg = db.Column(db.Numeric(5, 2))
    temperature_c = db.Column(db.Numeric(4, 1))
    humidity_pct = db.Column(db.Numeric(4, 1))
    sport = db.Column(db.String(80))
    expected_duration_min = db.Column(db.Integer)
    perceived_intensity = db.Column(db.String(20))
    urine_color = db.Column(db.Integer)
    thirst_level = db.Column(db.Integer)
    symptoms_pre = db.Column(db.Text)
    recent_hydration = db.Column(db.Text)

    fluid_intake_ml = db.Column(db.Numeric(7, 1), default=0)
    urine_volume_ml = db.Column(db.Numeric(7, 1), default=0)
    actual_duration_min = db.Column(db.Integer)

    post_mass_kg = db.Column(db.Numeric(5, 2))
    soaked_clothing = db.Column(db.Boolean, default=False)
    gi_symptoms = db.Column(db.Text)
    fatigue_level = db.Column(db.Integer)

    adjusted_loss_kg = db.Column(db.Numeric(5, 3))
    sweat_rate_lh = db.Column(db.Numeric(5, 3))
    mass_variation_pct = db.Column(db.Numeric(5, 2))
    hydration_balance_ml = db.Column(db.Numeric(7, 1))
    recommended_intake_ml_h = db.Column(db.Numeric(6, 1))
    alert_level = db.Column(db.String(20))

    athlete = db.relationship("User", foreign_keys=[athlete_id])
    creator = db.relationship("User", foreign_keys=[created_by])
    fluid_events = db.relationship("FluidEvent", backref="session", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "pre_mass_kg": float(self.pre_mass_kg) if self.pre_mass_kg else None,
            "temperature_c": float(self.temperature_c) if self.temperature_c else None,
            "humidity_pct": float(self.humidity_pct) if self.humidity_pct else None,
            "sport": self.sport,
            "expected_duration_min": self.expected_duration_min,
            "perceived_intensity": self.perceived_intensity,
            "urine_color": self.urine_color,
            "thirst_level": self.thirst_level,
            "symptoms_pre": self.symptoms_pre,
            "recent_hydration": self.recent_hydration,
            "fluid_intake_ml": float(self.fluid_intake_ml) if self.fluid_intake_ml else 0,
            "urine_volume_ml": float(self.urine_volume_ml) if self.urine_volume_ml else 0,
            "actual_duration_min": self.actual_duration_min,
            "post_mass_kg": float(self.post_mass_kg) if self.post_mass_kg else None,
            "soaked_clothing": self.soaked_clothing,
            "gi_symptoms": self.gi_symptoms,
            "fatigue_level": self.fatigue_level,
            "adjusted_loss_kg": float(self.adjusted_loss_kg) if self.adjusted_loss_kg else None,
            "sweat_rate_lh": float(self.sweat_rate_lh) if self.sweat_rate_lh else None,
            "mass_variation_pct": float(self.mass_variation_pct) if self.mass_variation_pct else None,
            "hydration_balance_ml": float(self.hydration_balance_ml) if self.hydration_balance_ml else None,
            "recommended_intake_ml_h": float(self.recommended_intake_ml_h) if self.recommended_intake_ml_h else None,
            "alert_level": self.alert_level,
            "athlete": self.athlete.to_dict() if self.athlete else None,
        }


class FluidEvent(db.Model):
    __tablename__ = "fluid_events"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    volume_ml = db.Column(db.Numeric(6, 1), nullable=False)
    source = db.Column(db.String(40))

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat(),
            "volume_ml": float(self.volume_ml),
            "source": self.source,
        }
