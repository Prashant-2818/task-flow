from . import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='Member') # 'Admin' or 'Member'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    projects_created = db.relationship('Project', back_populates='creator', cascade="all, delete-orphan")
    tasks_assigned = db.relationship('Task', back_populates='assignee', cascade="all, delete-orphan")
    project_memberships = db.relationship('ProjectMember', back_populates='user', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.email}>'
