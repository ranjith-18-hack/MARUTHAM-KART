import asyncio
import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_database_session
from app.core.events import register_subscriber, remove_subscriber
from app.models.models import Notification, User
from app.schemas.notification import (
    NotificationCreateRequest,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/stream",
    summary="Notifications: Real-time Server-Sent Events (SSE) stream",
)
async def stream_notifications(
    current_user: User = Depends(get_current_user),
):
    """
    Subscribes the client to live SSE domain notifications for instant UI updates.
    """
    queue = register_subscriber(str(current_user.id))

    async def event_generator():
        try:
            # Send initial connection handshake
            yield f"data: {json.dumps({'type': 'CONNECTED', 'user_id': str(current_user.id)})}\n\n"
            while True:
                try:
                    # Wait for next event with a 15-second heartbeat
                    data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive comment
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            remove_subscriber(str(current_user.id), queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )



@router.get(
    "",
    response_model=NotificationListResponse,
    summary="Notifications: list notifications for the logged-in user",
)
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database_session),
):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)

    total = q.count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).count()

    notifications = q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    items = [
        NotificationResponse(
            id=n.id,
            user_id=n.user_id,
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            created_at=n.created_at,
        )
        for n in notifications
    ]

    return NotificationListResponse(
        items=items,
        total=total,
        unread_count=unread_count,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Notifications: get count of unread notifications",
)
def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database_session),
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).count()
    return UnreadCountResponse(unread_count=count)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Notifications: mark single notification as read",
)
def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database_session),
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        user_id=notif.user_id,
        title=notif.title,
        message=notif.message,
        is_read=notif.is_read,
        created_at=notif.created_at,
    )


@router.post(
    "/read-all",
    summary="Notifications: mark all user notifications as read",
)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database_session),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}


@router.post(
    "",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Notifications: create notification for a user",
)
def create_notification(
    body: NotificationCreateRequest,
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database_session),
):
    target_user = db.query(User).filter(User.id == body.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    notif = Notification(
        user_id=body.user_id,
        title=body.title,
        message=body.message,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        user_id=notif.user_id,
        title=notif.title,
        message=notif.message,
        is_read=notif.is_read,
        created_at=notif.created_at,
    )
