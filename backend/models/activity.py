from . import db
from datetime import datetime

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False) # e.g., 'created', 'updated_status', 'assigned'
    entity_type = db.Column(db.String(50), nullable=False) # e.g., 'Project', 'Task', 'Member'
    entity_id = db.Column(db.Integer, nullable=False)
    
    # Store minimal string reps of state changes
    previous_state = db.Column(db.String(255), nullable=True) 
    new_state = db.Column(db.String(255), nullable=True)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Optional detailed message
    description = db.Column(db.Text, nullable=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('activities', lazy='dynamic'))

    def __repr__(self):
        return f'<ActivityLog {self.action_type} on {self.entity_type} {self.entity_id}>'
