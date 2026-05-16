from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db
from models.task import Task
from models.project import Project, ProjectMember
from services.activity_logger import log_activity
from datetime import datetime

api = Namespace('tasks', description='Task operations')

task_model = api.model('Task', {
    'title': fields.String(required=True, description='Task title'),
    'description': fields.String(description='Task description'),
    'priority': fields.String(description='Task priority (Low, Medium, High, Critical)'),
    'status': fields.String(description='Task status (Todo, In Progress, Review, Completed)'),
    'due_date': fields.String(description='Due date (ISO format)'),
    'project_id': fields.Integer(required=True, description='Project ID'),
    'assigned_to': fields.Integer(description='User ID assigned to')
})

task_update_model = api.model('TaskUpdate', {
    'title': fields.String(description='Task title'),
    'description': fields.String(description='Task description'),
    'priority': fields.String(description='Task priority (Low, Medium, High, Critical)'),
    'status': fields.String(description='Task status (Todo, In Progress, Review, Completed)'),
    'due_date': fields.String(description='Due date (ISO format)'),
    'assigned_to': fields.Integer(description='User ID assigned to')
})

@api.route('/')
class TaskList(Resource):
    @api.doc(security='apikey')
    @jwt_required()
    def get(self):
        """List all tasks for the current user's projects"""
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        project_id = request.args.get('project_id')
        query = Task.query
        
        if project_id:
            query = query.filter_by(project_id=project_id)
            
        if claims.get('role') != 'Admin':
            # Members can ONLY view tasks assigned to them (from the prompt)
            query = query.filter_by(assigned_to=user_id)
            
        tasks = query.all()
        now = datetime.utcnow()
        
        result = []
        for t in tasks:
            is_overdue = t.status != 'Completed' and t.due_date and t.due_date < now
            result.append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "status": t.status,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "project_id": t.project_id,
                "assigned_to": t.assigned_to,
                "created_at": t.created_at.isoformat(),
                "is_overdue": bool(is_overdue)
            })
            
        return result, 200

    @api.doc(security='apikey')
    @api.expect(task_model)
    @jwt_required()
    def post(self):
        """Create a new task"""
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        if claims.get('role') != 'Admin':
            return {"message": "Unauthorized: Only Admins can create tasks"}, 403
            
        data = request.json
        project_id = data.get('project_id')
        
        project = Project.query.get(project_id)
        if not project:
            return {"message": "Project not found"}, 404
                    
        due_date = None
        if 'due_date' in data and data['due_date']:
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                pass

        new_task = Task(
            title=data['title'],
            description=data.get('description'),
            priority=data.get('priority', 'Medium'),
            status=data.get('status', 'Pending'),
            due_date=due_date,
            project_id=project_id,
            assigned_to=data.get('assigned_to')
        )
        
        db.session.add(new_task)
        db.session.flush()
        
        log_activity(
            user_id=user_id,
            action_type='created',
            entity_type='Task',
            entity_id=new_task.id,
            description=f"Created task: {new_task.title}"
        )
        
        if data.get('assigned_to'):
            log_activity(
                user_id=user_id,
                action_type='assigned',
                entity_type='Task',
                entity_id=new_task.id,
                new_state=data.get('assigned_to'),
                description=f"Assigned task to user {data.get('assigned_to')}"
            )
            
        db.session.commit()
        return {"message": "Task created successfully", "id": new_task.id}, 201

@api.route('/<int:id>')
@api.response(404, 'Task not found')
class TaskItem(Resource):
    @api.doc(security='apikey')
    @api.expect(task_update_model)
    @jwt_required()
    def put(self, id):
        """Update a task (status, assignees, etc)"""
        task = Task.query.get(id)
        if not task:
            return {"message": "Task not found"}, 404
            
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        data = request.json
        
        old_status = task.status
        
        if claims.get('role') != 'Admin':
            # Members can ONLY update status of assigned tasks
            if task.assigned_to != user_id:
                return {"message": "Unauthorized: You can only update your assigned tasks"}, 403
                
            allowed_member_updates = ['status']
            for key in data.keys():
                if key not in allowed_member_updates:
                    return {"message": "Unauthorized: Members can only update task status"}, 403
                    
            if 'status' in data:
                if data['status'] not in ['Pending', 'In Progress', 'Completed', 'Todo', 'Review']:
                    return {"message": "Invalid status"}, 400
                task.status = data['status']
                
                log_activity(
                    user_id=user_id,
                    action_type='updated_status',
                    entity_type='Task',
                    entity_id=task.id,
                    previous_state=old_status,
                    new_state=task.status,
                    description=f"Updated status to {task.status}"
                )
                
        else:
            # Admin can update everything
            task.title = data.get('title', task.title)
            task.description = data.get('description', task.description)
            task.priority = data.get('priority', task.priority)
            
            if 'status' in data and data['status'] != task.status:
                task.status = data['status']
                log_activity(user_id, 'updated_status', 'Task', task.id, old_status, task.status, f"Updated status to {task.status}")
                
            if 'assigned_to' in data and data['assigned_to'] != task.assigned_to:
                old_assignee = task.assigned_to
                task.assigned_to = data['assigned_to']
                log_activity(user_id, 'assigned', 'Task', task.id, old_assignee, task.assigned_to, "Changed assignee")
                
            if 'due_date' in data and data['due_date']:
                try:
                    task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    pass
                    
            if not ('status' in data and data['status'] != old_status) and not ('assigned_to' in data and data['assigned_to'] != old_assignee):
                log_activity(user_id, 'updated', 'Task', task.id, description="Updated task details")
                
        db.session.commit()
        return {"message": "Task updated successfully"}, 200

    @api.doc(security='apikey')
    @jwt_required()
    def delete(self, id):
        """Delete a task"""
        task = Task.query.get(id)
        if not task:
            return {"message": "Task not found"}, 404
            
        claims = get_jwt()
        if claims.get('role') != 'Admin':
            return {"message": "Unauthorized: Only Admins can delete tasks"}, 403
            
        user_id = int(get_jwt_identity())
        log_activity(user_id, 'deleted', 'Task', task.id, description=f"Deleted task {task.title}")
            
        db.session.delete(task)
        db.session.commit()
        return {"message": "Task deleted successfully"}, 200
