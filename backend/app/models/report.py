import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Text, JSON
from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farmer_id = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, image/jpeg, image/png, etc.
    file_path = Column(String(500), nullable=False)
    status = Column(String(50), default="uploaded")  # uploaded, processed, failed
    raw_text = Column(Text, nullable=True)
    extracted_data = Column(JSON, nullable=True)  # { "ph": 6.5, "nitrogen": 120, ... }
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
