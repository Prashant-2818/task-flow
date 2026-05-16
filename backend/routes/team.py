from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db
from models.user import User
from models.project import ProjectMember
from models.task import Task

api = Namespace('team', description='Team management operations')

@api.route('/')
class TeamList(Resource):
    @api.doc(security='apikey')
    @jwt_required()
    def get(self):
        """List all team members and their stats (Admin only)"""
        claims = get_jwt()
        if claims.get('role') != 'Admin':
            return {"message": "Unauthorized"}, 403
            
        users = User.query.filter_by(role='Member').all()
        result = []
        for u in users:
            # Active projects
            projects = ProjectMember.query.filter_by(user_id=u.id).all()
            project_ids = [p.project_id for p in projects]
            
            # Tasks
            tasks = Task.query.filter_by(assigned_to=u.id).all()
            completed = len([t for t in tasks if t.status == 'Completed'])
            
            result.append({
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "joined_at": u.created_at.isoformat(),
                "active_projects": len(project_ids),
                "total_tasks": len(tasks),
                "completed_tasks": completed
            })
            
        return result, 200
