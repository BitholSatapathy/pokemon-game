from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PackResponse(BaseModel):
    id: str
    name: str
    set_id: str
    price_coins: int
    cards_per_pack: int
    cover_image: str
    description: Optional[str] = None
    is_featured: bool

    class Config:
        from_attributes = True

class PlayerPackResponse(BaseModel):
    id: int
    pack_id: str
    quantity: int
    obtained_at: datetime
    pack: PackResponse

    class Config:
        from_attributes = True

class PurchaseResponse(BaseModel):
    success: bool
    message: str
    pack: PackResponse
    remaining_coins: int
    pack_quantity: int

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    type: str
    amount: int
    currency: str
    reference_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
