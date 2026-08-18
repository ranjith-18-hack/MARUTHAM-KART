"""
Pydantic schemas for Universal Notifications System.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    message: str
    is_read: bool
    created_at: Optional[datetime] = None


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class NotificationCreateRequest(BaseModel):
    user_id: UUID
    title: str
    message: str
