"""Funcoes puras de calculo de hidratacao. Sem acesso ao banco."""


def calculate_session(pre_mass_kg, post_mass_kg, fluid_intake_ml,
                      urine_volume_ml, duration_min):
    """
    Calcula todos os indicadores de hidratacao de uma sessao.

    Retorna dict com:
        adjusted_loss_kg, sweat_rate_lh, mass_variation_pct,
        hydration_balance_ml, recommended_intake_ml_h, alert_level
    """
    fluid_intake_kg = fluid_intake_ml / 1000
    urine_kg = urine_volume_ml / 1000

    # Perda de massa ajustada (kg)
    adjusted_loss = (pre_mass_kg - post_mass_kg) + fluid_intake_kg - urine_kg

    # Taxa de sudorese (L/h)
    duration_h = duration_min / 60 if duration_min > 0 else 1
    sweat_rate = adjusted_loss / duration_h

    # Variacao percentual de massa corporal
    variation_pct = (adjusted_loss / pre_mass_kg) * 100 if pre_mass_kg > 0 else 0

    # Balanco hidrico (mL)
    balance_ml = fluid_intake_ml - (adjusted_loss * 1000)

    # Recomendacao: repor 80% da perda por hora
    recommended = sweat_rate * 1000 * 0.8

    # Nivel de alerta
    alert = "normal"
    if variation_pct > 2:
        alert = "danger"
    elif variation_pct > 1:
        alert = "caution"
    elif balance_ml > 0 and abs(balance_ml) > fluid_intake_ml * 0.5:
        alert = "caution"  # possivel super-hidratacao

    return {
        "adjusted_loss_kg": round(adjusted_loss, 3),
        "sweat_rate_lh": round(sweat_rate, 3),
        "mass_variation_pct": round(variation_pct, 2),
        "hydration_balance_ml": round(balance_ml, 1),
        "recommended_intake_ml_h": round(recommended, 1),
        "alert_level": alert,
    }
