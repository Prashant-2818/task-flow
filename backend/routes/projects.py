from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db
from models.project import Project, ProjectMember
from models.user import User
from services.activity_logger import log_activity

api = Namespace('projects', description='Project management operations')

project_model = api.model('Project', {
    'name': fields.String(required=True, description='Project name'),
    'description': fields.String(description='Project description'),
    'status': fields.String(description='Project status (Active, Completed, On Hold)'),
    'deadline': fields.String(description='Project deadline (ISO format)')
})

project_member_model = api.model('ProjectMember', {
    'user_id': fields.Integer(required=True, description='User ID to add'),
    'role': fields.String(description='Role in the project', default='Member')
})

@api.route('/')
class ProjectList(Resource):
    @api.doc(security='apikey')
    @jwt_required()
    def get(self):
        """List all projects for the current user"""
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        if claims.get('role') == 'Admin':
            projects = Project.query.all()
        else:
            # Members can only see projects they are assigned to
            member_projects = [pm.project for pm in ProjectMember.query.filter_by(user_id=user_id).all()]
            projects = member_projects
            
        return [{
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "deadline": p.deadline.isoformat() if p.deadline else None,
            "created_by": p.created_by,
            "created_at": p.created_at.isoformat()
        } for p in projects], 200

    @api.doc(security='apikey')
    @api.expect(project_model)
    @jwt_required()
    def post(self):
        """Create a new project"""
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        if claims.get('role') != 'Admin':
            return {"message": "Unauthorized: Only Admins can create projects"}, 403
            
        data = request.json
        from datetime import datetime
        
        deadline = None
        if 'deadline' in data and data['deadline']:
            try:
                deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
            except ValueError:
                pass

        new_project = Project(
            name=data['name'],
            description=data.get('description'),
            status=data.get('status', 'Active'),
            deadline=deadline,
            created_by=user_id
        )
        
        db.session.add(new_project)
        db.session.flush() # get ID
        
        # Add members
        member_ids = data.get('member_ids', [])
        for m_id in member_ids:
            db.session.add(ProjectMember(project_id=new_project.id, user_id=m_id, role='Member'))
            
        log_activity(
            user_id=user_id,
            action_type='created',
            entity_type='Project',
            entity_id=new_project.id,
            description=f"Created project: {new_project.name}"
        )
        
        db.session.commit()
        
        return {"message": "Project created successfully", "id": new_project.id}, 201

@api.route('/<int:id>')
@api.response(404, 'Project not found')
class ProjectItem(Resource):
    @api.doc(security='apikey')
    @jwt_required()
    def get(self, id):
        """Get a project by ID"""
        project = Project.query.get(id)
        if not project:
            return {"message": "Project not found"}, 404
            
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        if claims.get('role') != 'Admin':
            is_member = ProjectMember.query.filter_by(project_id=id, user_id=user_id).first()
            if not is_member:
                return {"message": "Unauthorized"}, 403
                    
        members = []
        for pm in project.members:
            members.append({
                "user_id": pm.user.id,
                "name": pm.user.name,
                "email": pm.user.email,
                "role": pm.role
            })
            
        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "deadline": project.deadline.isoformat() if project.deadline else None,
            "created_by": project.created_by,
            "created_at": project.created_at.isoformat(),
            "members": members
        }, 200

    @api.doc(security='apikey')
    @api.expect(project_model)
    @jwt_required()
    def put(self, id):
        """Update a project"""
        project = Project.query.get(id)
        if not project:
            return {"message": "Project not found"}, 404
            
        claims = get_jwt()
        if claims.get('role') != 'Admin':
            return {"message": "Unauthorized: Only Admins can edit projects"}, 403
            
        user_id = int(get_jwt_identity())
        data = request.json
        
        old_status = project.status
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        project.status = data.get('status', project.status)
        
        if 'deadline' in data and data['deadline']:
            from datetime import datetime
            try:
                project.deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
            except ValueError:
                pass
                
        # Sync members
        if 'member_ids' in data:
            current_members = ProjectMember.query.filter_by(project_id=project.id).all()
            current_ids = {pm.user_id for pm in current_members}
            new_ids = set(data['member_ids'])
            
            # Remove omitted
            for pm in current_members:
                if pm.user_id not in new_ids:
                    db.session.delete(pm)
                    
            # Add new
            for m_id in new_ids:
                if m_id not in current_ids:
                    db.session.add(ProjectMember(project_id=project.id, user_id=m_id, role='Member'))

        log_activity(
            user_id=user_id,
            action_type='updated',
            entity_type='Project',
            entity_id=project.id,
            previous_state=old_status,
            new_state=project.status,
            description=f"Updated project details"
        )
        
        db.session.commit()
        return {"message": "Project updated successfully"}, 200

    @api.doc(security='apikey')
    @jwt_required()
    def delete(self, id):
        """Delete a project"""
        project = Project.query.get(id)
        if not project:
            return {"message": "Project not found"}, 404
            
        claims = get_jwt()
        if claims.get('role') != 'Admin':
            return {"message": "Unauthorized: Only Admins can delete projects"}, 403
            
        user_id = int(get_jwt_identity())
        
        log_activity(
            user_id=user_id,
            action_type='deleted',
            entity_type='Project',
            entity_id=project.id,
            description=f"Deleted project: {project.name}"
        )
        
        db.session.delete(project)
        db.session.commit()
        return {"message": "Project deleted successfully"}, 200

@api.route('/<int:id>/members')
class ProjectMembersResource(Resource):
    @api.doc(security='apikey')
    @api.expect(project_member_model)
    @jwt_required()
    def post(self, id):
        """Add a member to project"""
        claims = get_jwt()
        if claims.get('role') != 'Admin':
            return {"message": "Unauthorized: Only Admins can manage members"}, 403
            
        project = Project.query.get(id)
        if not project:
            return {"message": "Project not found"}, 404
            
        data = request.json
        target_user_id = data.get('user_id')
        user = User.query.get(target_user_id)
        
        if not user:
            return {"message": "User not found"}, 404
            
        existing = ProjectMember.query.filter_by(project_id=id, user_id=target_user_id).first()
        if existing:
            return {"message": "User is already a member"}, 400
            
        new_member = ProjectMember(
            project_id=id,
            user_id=target_user_id,
            role=data.get('role', 'Member')
        )
        
        db.session.add(new_member)
        
        admin_id = int(get_jwt_identity())
        log_activity(
            user_id=admin_id,
            action_type='assigned_member',
            entity_type='Project',
            entity_id=project.id,
            description=f"Added {user.name} to project"
        )
        
        db.session.commit()
        
        return {"message": "Member added successfully"}, 201

    @api.doc(security='apikey')
    @jwt_required()
    def delete(self, id):
        """Remove a member from project"""
        claims = get_jwt()
        if claims.get('role') != 'Admin':
            return {"message": "Unauthorized: Only Admins can manage members"}, 403
            
        project = Project.query.get(id)
        if not project:
            return {"message": "Project not found"}, 404
            
        target_user_id = request.args.get('user_id')
        if not target_user_id:
            return {"message": "user_id is required"}, 400
            
        member = ProjectMember.query.filter_by(project_id=id, user_id=target_user_id).first()
        if not member:
            return {"message": "Member not found"}, 404
            
        user = User.query.get(target_user_id)
        db.session.delete(member)
        
        admin_id = int(get_jwt_identity())
        log_activity(
            user_id=admin_id,
            action_type='removed_member',
            entity_type='Project',
            entity_id=project.id,
            description=f"Removed {user.name if user else target_user_id} from project"
        )
        
        db.session.commit()
        
        return {"message": "Member removed successfully"}, 200
