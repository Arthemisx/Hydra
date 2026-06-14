from app import create_app
from models import db, DailyEntry
from datetime import date

app = create_app()

with app.app_context():
    today = date.today()
    entries = DailyEntry.query.all()
    
    for entry in entries:
        print(f"Atualizando entrada {entry.id} de {entry.entry_date} para {today}")
        entry.entry_date = today
    
    db.session.commit()
    print("Datas atualizadas com sucesso!")
