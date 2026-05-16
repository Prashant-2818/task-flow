from . import db
from datetime import datetime

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(50), nullable=False, default='Medium') # Low, Medium, High, Critical
    status = db.Column(db.String(50), nullable=False, default='Todo') # Todo, In Progress, Review, Completed
    due_date = db.Column(db.DateTime, nullable=True)
    
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', back_populates='tasks')
    assignee = db.relationship('User', back_populates='tasks_assigned')

    def __repr__(self):
        return f'<Task {self.title}>'
