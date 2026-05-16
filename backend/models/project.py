from . import db
from datetime import datetime

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Active') # Active, Completed, On Hold
    deadline = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', back_populates='projects_created')
    tasks = db.relationship('Task', back_populates='project', cascade="all, delete-orphan")
    members = db.relationship('ProjectMember', back_populates='project', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Project {self.name}>'

class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='Member') # Project-specific role
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', back_populates='members')
    user = db.relationship('User', back_populates='project_memberships')

    # Ensure a user can only be added once per project
    __table_args__ = (
        db.UniqueConstraint('project_id', 'user_id', name='unique_project_user'),
    )
