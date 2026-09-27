import json
import urllib.request
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, Base, engine
from app.models.card import Series, CardSet, Card

TCGDEX_BASE = "https://api.tcgdex.net/v2/en"

def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "TCGCollector/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))

def calculate_market_price(name: str, rarity: str) -> int:
    name_lower = name.lower()
    rarity_lower = (rarity or "").lower()

    # Premium iconic cards
    if "charizard" in name_lower:
        return 8500
    if "blastoise" in name_lower:
        return 4200
    if "venusaur" in name_lower:
        return 3800
    if "mewtwo" in name_lower:
        return 3100
    if "pikachu" in name_lower:
        return 450
    if "alakazam" in name_lower:
        return 2400
    if "gyarados" in name_lower:
        return 2100
    if "zapdos" in name_lower:
        return 2800

    # Rarity-based pricing
    if "secret" in rarity_lower or "ultra" in rarity_lower:
        return 6500
    if "holo" in rarity_lower:
        return 2500
    if "rare" in rarity_lower:
        return 1200
    if "uncommon" in rarity_lower:
        return 400
    return 150  # Common default

def import_base_set():
    print("[*] Starting Phase 3 Ingestion: Base Set (base1) from TCGdex...")
    start_time = time.time()

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Fetch Series info
        print("[*] Ingesting Series: Base...")
        series_data = fetch_json(f"{TCGDEX_BASE}/series/base")
        series = db.query(Series).filter(Series.id == "base").first()
        if not series:
            series = Series(
                id="base",
                name=series_data.get("name", "Base"),
                logo_url=f"{series_data.get('logo')}.webp" if series_data.get("logo") else None,
            )
            db.add(series)
            db.commit()
            print("[+] Series 'base' created.")

        # 2. Fetch Set info
        print("[*] Ingesting Set: Base Set (base1)...")
        set_data = fetch_json(f"{TCGDEX_BASE}/sets/base1")
        card_set = db.query(CardSet).filter(CardSet.id == "base1").first()
        if not card_set:
            card_set = CardSet(
                id="base1",
                name=set_data.get("name", "Base Set"),
                series_id="base",
                total_cards=len(set_data.get("cards", [])) or 102,
                logo_url=f"{set_data.get('logo')}.webp" if set_data.get("logo") else None,
                symbol_url=f"{set_data.get('symbol')}.webp" if set_data.get("symbol") else None,
                release_date=set_data.get("releaseDate"),
            )
            db.add(card_set)
            db.commit()
            print("[+] Set 'base1' created.")

        # 3. Fetch detailed card items in parallel
        raw_cards = set_data.get("cards", [])
        total_raw = len(raw_cards)
        print(f"[*] Fetching full metadata for {total_raw} cards...")

        def fetch_card_details(raw_card):
            card_id = raw_card["id"]
            try:
                details = fetch_json(f"{TCGDEX_BASE}/cards/{card_id}")
                return details
            except Exception:
                # Fallback to summary info if detail request fails
                return {
                    "id": card_id,
                    "name": raw_card["name"],
                    "localId": raw_card.get("localId", "0"),
                    "image": raw_card.get("image"),
                    "rarity": "Common",
                    "types": [],
                }

        detailed_cards = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_card = {executor.submit(fetch_card_details, c): c for c in raw_cards}
            for future in as_completed(future_to_card):
                detailed_cards.append(future.result())

        # Sort by localId numerically
        def sort_key(c):
            try:
                return int(c.get("localId", 999))
            except ValueError:
                return 999
        detailed_cards.sort(key=sort_key)

        # 4. Save cards to Database
        imported_count = 0
        for card_data in detailed_cards:
            cid = card_data["id"]
            name = card_data.get("name", "Unknown Card")
            number = f"{card_data.get('localId', '0')}/102"
            rarity = card_data.get("rarity", "Common")
            types_list = card_data.get("types", [])
            types_str = ", ".join(types_list) if isinstance(types_list, list) else str(types_list)
            hp = card_data.get("hp")
            image_base = card_data.get("image")
            image_url = f"{image_base}/high.webp" if image_base else "https://images.pokemontcg.io/base1/1_hires.png"
            price = calculate_market_price(name, rarity)
            artist = card_data.get("illustrator")
            flavor = card_data.get("description")

            existing_card = db.query(Card).filter(Card.id == cid).first()
            if existing_card:
                existing_card.name = name
                existing_card.number = number
                existing_card.rarity = rarity
                existing_card.types = types_str
                existing_card.hp = hp
                existing_card.image_url = image_url
                existing_card.market_price = price
                existing_card.artist = artist
                existing_card.flavor_text = flavor
            else:
                new_card = Card(
                    id=cid,
                    name=name,
                    set_id="base1",
                    number=number,
                    rarity=rarity,
                    types=types_str,
                    hp=hp,
                    image_url=image_url,
                    market_price=price,
                    artist=artist,
                    flavor_text=flavor,
                )
                db.add(new_card)
            imported_count += 1

        db.commit()
        elapsed = time.time() - start_time
        print(f"[+] Successfully imported {imported_count} cards from Base Set in {elapsed:.2f}s!")

    except Exception as e:
        db.rollback()
        print(f"[!] Error during import: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    import_base_set()
