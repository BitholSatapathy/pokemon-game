import json
from sqlalchemy.orm import Session
from app.models.card import Series, CardSet, Card
from app.models.pack import Pack

def expand_cards_and_packs(db: Session):
    """Seed additional expansion sets, iconic booster packs, and legendary cards."""
    # 1. Ensure Series exist
    series_list = [
        {"id": "gym", "name": "Gym Series", "logo_url": "https://assets.tcgdex.net/en/gym/gym1/logo.png"},
        {"id": "neo", "name": "Neo Genesis Series", "logo_url": "https://assets.tcgdex.net/en/neo/neo1/logo.png"},
        {"id": "celestial", "name": "Celestial Horizons Apex", "logo_url": "https://assets.tcgdex.net/en/swsh/swsh7/logo.png"},
    ]
    for s in series_list:
        if not db.query(Series).filter(Series.id == s["id"]).first():
            db.add(Series(**s))
    db.commit()

    # 2. Ensure Sets exist
    sets_list = [
        {
            "id": "gym1",
            "name": "Gym Heroes",
            "series_id": "gym",
            "total_cards": 132,
            "logo_url": "https://assets.tcgdex.net/en/gym/gym1/logo.png",
            "symbol_url": "https://assets.tcgdex.net/en/gym/gym1/symbol.png",
            "release_date": "2000-08-14"
        },
        {
            "id": "neo1",
            "name": "Neo Genesis",
            "series_id": "neo",
            "total_cards": 111,
            "logo_url": "https://assets.tcgdex.net/en/neo/neo1/logo.png",
            "symbol_url": "https://assets.tcgdex.net/en/neo/neo1/symbol.png",
            "release_date": "2000-12-16"
        },
        {
            "id": "celestial1",
            "name": "Celestial Horizons Apex",
            "series_id": "celestial",
            "total_cards": 50,
            "logo_url": "https://assets.tcgdex.net/en/swsh/swsh7/logo.png",
            "symbol_url": "https://assets.tcgdex.net/en/swsh/swsh7/symbol.png",
            "release_date": "2026-01-01"
        },
    ]
    for st in sets_list:
        if not db.query(CardSet).filter(CardSet.id == st["id"]).first():
            db.add(CardSet(**st))
    db.commit()

    # 3. Ensure Packs exist
    default_slots = json.dumps([
        "common", "common", "common", "uncommon", "uncommon",
        "uncommon", "reverse", "reverse", "rare", "special"
    ])
    packs_list = [
        {
            "id": "pack_gym_heroes",
            "name": "Gym Heroes Booster",
            "set_id": "gym1",
            "price_coins": 1800,
            "cards_per_pack": 10,
            "cover_image": "https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/gymheroes1.jpg",
            "description": "Harness the power of Kanto Gym Leaders! Blaine's Charizard, Sabrina's Gengar, and Misty's Gyarados await.",
            "is_featured": True,
            "slots_config": default_slots,
        },
        {
            "id": "pack_neo_genesis",
            "name": "Neo Genesis 1st Edition",
            "set_id": "neo1",
            "price_coins": 2200,
            "cards_per_pack": 10,
            "cover_image": "https://raw.githubusercontent.com/jwkeena/pokemon-booster-pack-simulator/master/images/packart/neogenesis1.jpg",
            "description": "Enter the Johto frontier! Legendary Lugia, Typhlosion, Pichu, and secret golden relics.",
            "is_featured": False,
            "slots_config": default_slots,
        },
        {
            "id": "pack_celestial_apex",
            "name": "Celestial Horizons Apex",
            "set_id": "celestial1",
            "price_coins": 3500,
            "cards_per_pack": 10,
            "cover_image": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400",
            "description": "The cosmic master collection: Moonbreon, Rayquaza VMAX, Giratina Origin, and radiant deities.",
            "is_featured": True,
            "slots_config": default_slots,
        },
        {
            "id": "pack_mythic_vault",
            "name": "Secret Mythic Vault",
            "set_id": "celestial1",
            "price_coins": 5000,
            "cards_per_pack": 5,
            "cover_image": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=400",
            "description": "Guaranteed High-Tier Pulls! 5 exclusive Ultra Rares & Secret Rares in every gold-sealed pack.",
            "is_featured": True,
            "slots_config": default_slots,
        },
    ]
    for p in packs_list:
        existing = db.query(Pack).filter(Pack.id == p["id"]).first()
        if not existing:
            db.add(Pack(**p))
    db.commit()

    # 4. Seed New Iconic Cards
    new_cards = [
        # Neo Genesis Cards
        {
            "id": "neo1-9",
            "name": "Lugia",
            "set_id": "neo1",
            "number": "9",
            "rarity": "Rare Holo",
            "types": "Psychic",
            "hp": 90,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/9/high.webp",
            "market_price": 28500,
            "flavor_text": "The legendary guardian of the seas. Its psychic aeroblast tears across the atmosphere.",
            "artist": "Hironobu Yoshida"
        },
        {
            "id": "neo1-7",
            "name": "Ho-Oh",
            "set_id": "neo1",
            "number": "7",
            "rarity": "Rare Holo",
            "types": "Fire",
            "hp": 90,
            "image_url": "https://assets.tcgdex.net/en/neo/neo3/7/high.webp",
            "market_price": 22000,
            "flavor_text": "A mythical bird that flies continuously on iridescent wings leaves a trail of rainbow embers.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "neo1-17",
            "name": "Typhlosion",
            "set_id": "neo1",
            "number": "17",
            "rarity": "Rare Holo",
            "types": "Fire",
            "hp": 100,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/17/high.webp",
            "market_price": 14000,
            "flavor_text": "If its rage peaks, it becomes so hot that anything that touches it will instantly go up in flames.",
            "artist": "Shin-ichi Yoshida"
        },
        {
            "id": "neo1-5",
            "name": "Feraligatr",
            "set_id": "neo1",
            "number": "5",
            "rarity": "Rare Holo",
            "types": "Water",
            "hp": 120,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/5/high.webp",
            "market_price": 11500,
            "flavor_text": "When it bites with its massive and powerful jaws, it shakes its head and savagely tears up its victim.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "neo1-11",
            "name": "Meganium",
            "set_id": "neo1",
            "number": "11",
            "rarity": "Rare Holo",
            "types": "Grass",
            "hp": 100,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/11/high.webp",
            "market_price": 9500,
            "flavor_text": "The aroma that rises from its petals contains a substance that calms aggressive feelings.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "neo1-15",
            "name": "Steelix",
            "set_id": "neo1",
            "number": "15",
            "rarity": "Rare Holo",
            "types": "Fighting",
            "hp": 110,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/15/high.webp",
            "market_price": 8200,
            "flavor_text": "Its body has been compressed deep under the ground. As a result, it is even harder than a diamond.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "neo1-12",
            "name": "Pichu",
            "set_id": "neo1",
            "number": "12",
            "rarity": "Rare Holo",
            "types": "Lightning",
            "hp": 30,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/12/high.webp",
            "market_price": 16000,
            "flavor_text": "Despite its small size, it can zap even adult humans. However, if it does so, it may surprise itself.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "neo1-51",
            "name": "Togepi",
            "set_id": "neo1",
            "number": "51",
            "rarity": "Common",
            "types": "Normal",
            "hp": 40,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/51/high.webp",
            "market_price": 850,
            "flavor_text": "A proverb claims that happiness will come to anyone who can make a sleeping Togepi stand up.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "neo1-57",
            "name": "Cyndaquil",
            "set_id": "neo1",
            "number": "57",
            "rarity": "Common",
            "types": "Fire",
            "hp": 50,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/57/high.webp",
            "market_price": 450,
            "flavor_text": "It is timid, and always curls itself up into a ball. If attacked, it flares up its back for protection.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "neo1-80",
            "name": "Totodile",
            "set_id": "neo1",
            "number": "80",
            "rarity": "Common",
            "types": "Water",
            "hp": 50,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/80/high.webp",
            "market_price": 450,
            "flavor_text": "Its well-developed jaws are powerful and capable of crushing anything.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "neo1-53",
            "name": "Chikorita",
            "set_id": "neo1",
            "number": "53",
            "rarity": "Common",
            "types": "Grass",
            "hp": 50,
            "image_url": "https://assets.tcgdex.net/en/neo/neo1/53/high.webp",
            "market_price": 450,
            "flavor_text": "A sweet aroma gently wafts from the leaf on its head. It is docile and loves to soak up the sun's rays.",
            "artist": "Ken Sugimori"
        },

        # Gym Heroes Cards
        {
            "id": "gym1-2",
            "name": "Blaine's Charizard",
            "set_id": "gym1",
            "number": "2",
            "rarity": "Rare Holo",
            "types": "Fire",
            "hp": 100,
            "image_url": "https://assets.tcgdex.net/en/gym/gym2/2/high.webp",
            "market_price": 34000,
            "flavor_text": "Trained by Cinnabar Island's quiz master. Unstoppable Roaring Flames.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "gym1-14",
            "name": "Sabrina's Gengar",
            "set_id": "gym1",
            "number": "14",
            "rarity": "Rare Holo",
            "types": "Psychic",
            "hp": 80,
            "image_url": "https://assets.tcgdex.net/en/gym/gym2/14/high.webp",
            "market_price": 26000,
            "flavor_text": "Summoned from the spectral realm. Its Night Spirits evade physical strikes.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "gym1-8",
            "name": "Misty's Gyarados",
            "set_id": "gym1",
            "number": "8",
            "rarity": "Rare Holo",
            "types": "Water",
            "hp": 100,
            "image_url": "https://assets.tcgdex.net/en/gym/gym1/8/high.webp",
            "market_price": 18500,
            "flavor_text": "Cerulean Gym's raging dragon. Rebellion and Hydro Crusher devastate foes.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "gym1-3",
            "name": "Erika's Venusaur",
            "set_id": "gym1",
            "number": "3",
            "rarity": "Rare Holo",
            "types": "Grass",
            "hp": 90,
            "image_url": "https://assets.tcgdex.net/en/gym/gym1/3/high.webp",
            "market_price": 15000,
            "flavor_text": "Celadon Gym's serene guardian. Wide Solarbeam cleanses toxic battlefields.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "gym1-10",
            "name": "Lt. Surge's Raichu",
            "set_id": "gym1",
            "number": "10",
            "rarity": "Rare Holo",
            "types": "Lightning",
            "hp": 80,
            "image_url": "https://assets.tcgdex.net/en/gym/gym2/8/high.webp",
            "market_price": 12500,
            "flavor_text": "Vermilion Gym's military power surge. High Voltage Shockwave strikes with lightning fury.",
            "artist": "Ken Sugimori"
        },
        {
            "id": "gym1-11",
            "name": "Rocket's Mewtwo",
            "set_id": "gym1",
            "number": "11",
            "rarity": "Rare Holo",
            "types": "Psychic",
            "hp": 70,
            "image_url": "https://assets.tcgdex.net/en/gym/gym2/11/high.webp",
            "market_price": 31000,
            "flavor_text": "Genetically synthesized apex bioweapon. Juxtaposition breaks opponents' minds.",
            "artist": "Shin-ichi Yoshida"
        },
        {
            "id": "gym1-21",
            "name": "Brock's Onix",
            "set_id": "gym1",
            "number": "21",
            "rarity": "Uncommon",
            "types": "Fighting",
            "hp": 90,
            "image_url": "https://assets.tcgdex.net/en/gym/gym1/21/high.webp",
            "market_price": 1400,
            "flavor_text": "Pewter Gym's stone bedrock snake. Tunneling Defense and Rock Throw.",
            "artist": "Ken Sugimori"
        },

        # Celestial Horizons Apex Masterpiece Cards
        {
            "id": "celestial-moonbreon",
            "name": "Umbreon VMAX (Moonbreon Alternate Art)",
            "set_id": "celestial1",
            "number": "215",
            "rarity": "Secret Rare",
            "types": "Dark",
            "hp": 310,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp",
            "market_price": 68000,
            "flavor_text": "The mythical Moonbreon reaching up to embrace the cosmic full moon. The crown jewel of modern collecting.",
            "artist": "KEIICHIRO ITO"
        },
        {
            "id": "celestial-rayquaza",
            "name": "Rayquaza VMAX (Alt Art Secret Rare)",
            "set_id": "celestial1",
            "number": "218",
            "rarity": "Secret Rare",
            "types": "Dragon",
            "hp": 320,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh7/218/high.webp",
            "market_price": 54000,
            "flavor_text": "Soaring through planetary orbits while consuming ozone meteorites. Max Burst annihilates any active defense.",
            "artist": "Anesaki Dynamic"
        },
        {
            "id": "celestial-giratina",
            "name": "Giratina V (Lost Origin Alt Art)",
            "set_id": "celestial1",
            "number": "186",
            "rarity": "Secret Rare",
            "types": "Dragon",
            "hp": 220,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh11/186/high.webp",
            "market_price": 48000,
            "flavor_text": "Ruler of the Distortion World where spacetime twists. Abyss Seeking shreds dimensional barriers.",
            "artist": "Shinji Kanda"
        },
        {
            "id": "celestial-arceus",
            "name": "Arceus VSTAR (Gold Secret Rare)",
            "set_id": "celestial1",
            "number": "184",
            "rarity": "Secret Rare",
            "types": "Normal",
            "hp": 280,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh9/184/high.webp",
            "market_price": 38000,
            "flavor_text": "The Original One born before the universe existed. Starbirth shapes galaxies and material reality.",
            "artist": "AKIRA EGAWA"
        },
        {
            "id": "celestial-mew-vmax",
            "name": "Mew VMAX (Fusion Strike Alt Art)",
            "set_id": "celestial1",
            "number": "269",
            "rarity": "Secret Rare",
            "types": "Psychic",
            "hp": 310,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh8/269/high.webp",
            "market_price": 36000,
            "flavor_text": "Floating playfully above neon skyscrapers. Cross Fusion Strike channels the attacks of all benched allies.",
            "artist": "naoki saitou"
        },
        {
            "id": "celestial-gengar-vmax",
            "name": "Gengar VMAX (Alt Art Secret Rare)",
            "set_id": "celestial1",
            "number": "271",
            "rarity": "Secret Rare",
            "types": "Dark",
            "hp": 320,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh8/271/high.webp",
            "market_price": 42000,
            "flavor_text": "A gargantuan maw devouring the entire festival skyline. Fear and Panic strikes terror into stacked benches.",
            "artist": "Sowsow"
        },
        {
            "id": "celestial-charizard-radiant",
            "name": "Radiant Charizard",
            "set_id": "celestial1",
            "number": "11",
            "rarity": "Rare Holo",
            "types": "Fire",
            "hp": 160,
            "image_url": "https://assets.tcgdex.net/en/pgo/pgo/11/high.webp",
            "market_price": 28000,
            "flavor_text": "Glistening with radiant emerald highlights. Combustion Blast burns hot enough to melt boulders.",
            "artist": "Kouki Saitou"
        },
        {
            "id": "celestial-lucario-vstar",
            "name": "Lucario VSTAR",
            "set_id": "celestial1",
            "number": "144",
            "rarity": "Rare Holo",
            "types": "Fighting",
            "hp": 270,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh9/144/high.webp",
            "market_price": 16500,
            "flavor_text": "Focusing spiritual aura into a cataclysmic strike. Aura Star turns defeats into decisive triumph.",
            "artist": "5ban Graphics"
        },
        {
            "id": "celestial-blastoise-radiant",
            "name": "Radiant Blastoise",
            "set_id": "celestial1",
            "number": "18",
            "rarity": "Rare Holo",
            "types": "Water",
            "hp": 150,
            "image_url": "https://assets.tcgdex.net/en/pgo/pgo/18/high.webp",
            "market_price": 18000,
            "flavor_text": "Pump Shot blasts pressurized torrents capable of punching through reinforced steel bunker doors.",
            "artist": "Masakazu Fukuda"
        },
        {
            "id": "celestial-venusaur-radiant",
            "name": "Radiant Venusaur",
            "set_id": "celestial1",
            "number": "4",
            "rarity": "Rare Holo",
            "types": "Grass",
            "hp": 150,
            "image_url": "https://assets.tcgdex.net/en/pgo/pgo/4/high.webp",
            "market_price": 16000,
            "flavor_text": "Pollen Hazard inflicts multi-status affliction while its giant flower absorbs radiant solar energy.",
            "artist": "Mitsuhiro Arita"
        },
        {
            "id": "celestial-dragonite-v",
            "name": "Dragonite V (Special Art)",
            "set_id": "celestial1",
            "number": "192",
            "rarity": "Rare Holo",
            "types": "Dragon",
            "hp": 230,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh7/192/high.webp",
            "market_price": 21000,
            "flavor_text": "Gliding peacefully above the cloud sea alongside flying flocks. Shred ignores all protection effects.",
            "artist": "Atsushi Furusawa"
        },
        {
            "id": "celestial-tyranitar-v",
            "name": "Tyranitar V (Alt Art)",
            "set_id": "celestial1",
            "number": "155",
            "rarity": "Rare Holo",
            "types": "Dark",
            "hp": 230,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh5/155/high.webp",
            "market_price": 19500,
            "flavor_text": "Resting after feasting upon an entire mountain of boulders. Single Strike Crush crushes rival stadiums.",
            "artist": "AYUMI ODASHIMA"
        },
        {
            "id": "celestial-espeon-vmax",
            "name": "Espeon VMAX (Alt Art Secret Rare)",
            "set_id": "celestial1",
            "number": "270",
            "rarity": "Secret Rare",
            "types": "Psychic",
            "hp": 310,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh8/270/high.webp",
            "market_price": 31000,
            "flavor_text": "Sleeping peacefully atop a cozy sunlit rooftop. Solar Revelation protects against all opponent effects.",
            "artist": "kouki saitou"
        },
        {
            "id": "celestial-pikachu-vmax",
            "name": "Pikachu VMAX (Rainbow Rare)",
            "set_id": "celestial1",
            "number": "188",
            "rarity": "Secret Rare",
            "types": "Lightning",
            "hp": 310,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh4/188/high.webp",
            "market_price": 39000,
            "flavor_text": "The gargantuan 'Chonkachu' radiating iridescent prismatic lightning bolts. G-Max Volt Tackle shocks for 270 damage.",
            "artist": "aky CG Works"
        },
        {
            "id": "celestial-mimikyu-vmax",
            "name": "Mimikyu VMAX (Character Rare)",
            "set_id": "celestial1",
            "number": "68",
            "rarity": "Rare Holo",
            "types": "Psychic",
            "hp": 300,
            "image_url": "https://assets.tcgdex.net/en/swsh/swsh9/TG17/high.webp",
            "market_price": 14000,
            "flavor_text": "Hiding timidly under its patched Pikachu rag. Max Shadow summons playful spectral chaos.",
            "artist": "sui"
        },
        {
            "id": "celestial-eevee-radiant",
            "name": "Radiant Eevee",
            "set_id": "celestial1",
            "number": "55",
            "rarity": "Rare Holo",
            "types": "Normal",
            "hp": 90,
            "image_url": "https://assets.tcgdex.net/en/pgo/pgo/55/high.webp",
            "market_price": 12500,
            "flavor_text": "Twinkles with iridescent sparkles across its fluffy mane. Twinkle Gathering searches for evolution stones.",
            "artist": "Souichirou Gunjima"
        },
    ]

    added_count = 0
    for c in new_cards:
        existing = db.query(Card).filter(Card.id == c["id"]).first()
        if not existing:
            db.add(Card(**c))
            added_count += 1
    db.commit()
    print(f"Card Expander: Added {added_count} new cards across {len(sets_list)} sets!")
