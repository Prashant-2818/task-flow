from models import db
from models.activity import ActivityLog

def log_activity(user_id, action_type, entity_type, entity_id, previous_state=None, new_state=None, description=None):
    """
    Helper function to create an activity log entry.
    """
    log = ActivityLog(
        user_id=user_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        previous_state=str(previous_state) if previous_state is not None else None,
        new_state=str(new_state) if new_state is not None else None,
        description=description
    )
    db.session.add(log)
    # The caller is responsible for db.session.commit()
    return log
