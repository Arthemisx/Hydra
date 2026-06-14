from app import create_app
from models import db, DailyEntry
from datetime import date
from reports import date_range_for_period, fetch_entries

app = create_app()

with app.app_context():
    print("=== Dados no banco ===")
    entries = DailyEntry.query.all()
    print(f"Total de entradas: {len(entries)}")
    for entry in entries:
        print(f"- ID: {entry.id}")
        print(f"  Atleta: {entry.athlete_name}")
        print(f"  Data: {entry.entry_date}")
        print(f"  Água: {entry.water_intake_ml} mL")
        print("-" * 30)
    
    print("\n=== Teste de busca ===")
    today = date.today()
    print(f"Data hoje (backend): {today}")
    
    start, end = date_range_for_period("daily")
    print(f"Periodo diário: {start} a {end}")
    
    found = fetch_entries("Atleta", start, end)
    print(f"Encontrados: {len(found)}")
    
    print("\n=== Buscando sem filtrar data ===")
    all_entries = fetch_entries("Atleta", date(2000, 1, 1), date(2100, 1, 1))
    print(f"Encontrados (todas as datas): {len(all_entries)}")
    for e in all_entries:
        print(f"- Data: {e.entry_date}")
