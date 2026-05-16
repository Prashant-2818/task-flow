from flask import request
from flask_restx import Namespace, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db
from models.task import Task
from models.project import Project, ProjectMember
from models.activity import ActivityLog
from models.user import User
from datetime import datetime

api = Namespace('dashboard', description='Dashboard analytics')


@api.route('/analytics')
class Analytics(Resource):

    @api.doc(security='apikey')
    @jwt_required()
    def get(self):
        """Get dashboard statistics"""

        user_id = int(get_jwt_identity())
        claims = get_jwt()
        now = datetime.utcnow()

        role = claims.get('role')

        # =========================
        # ADMIN ANALYTICS
        # =========================
        if role == 'Admin':

            projects_count = Project.query.count()

            tasks = Task.query.all()

            activities = (
                ActivityLog.query
                .order_by(ActivityLog.timestamp.desc())
                .limit(20)
                .all()
            )

            users = User.query.filter_by(role='Member').all()

            member_performance = []

            for u in users:

                user_tasks = [t for t in tasks if t.assigned_to == u.id]

                completed = len([
                    t for t in user_tasks
                    if (t.status or '').strip().lower() == 'completed'
                ])

                total_user_tasks = len(user_tasks)

                completion_rate = (
                    (completed / total_user_tasks) * 100
                    if total_user_tasks > 0 else 0
                )

                member_performance.append({
                    "id": u.id,
                    "name": u.name,
                    "total_assigned": total_user_tasks,
                    "completed": completed,
                    "completion_rate": round(completion_rate, 2)
                })

        # =========================
        # MEMBER ANALYTICS
        # =========================
        else:

            member_projects = (
                ProjectMember.query
                .filter_by(user_id=user_id)
                .all()
            )

            project_ids = list(set([
                pm.project_id for pm in member_projects
            ]))

            projects_count = len(project_ids)

            tasks = Task.query.filter_by(
                assigned_to=user_id
            ).all()

            activities = (
                ActivityLog.query
                .filter_by(user_id=user_id)
                .order_by(ActivityLog.timestamp.desc())
                .limit(20)
                .all()
            )

            member_performance = []

        # =========================
        # TASK ANALYTICS
        # =========================

        total_tasks = len(tasks)

        completed_tasks = len([
            t for t in tasks
            if (t.status or '').strip().lower() == 'completed'
        ])

        in_progress_tasks = len([
            t for t in tasks
            if (t.status or '').strip().lower() == 'in progress'
        ])

        pending_tasks = len([
            t for t in tasks
            if (t.status or '').strip().lower() == 'pending'
        ])

        overdue_tasks = len([
            t for t in tasks
            if (
                (t.status or '').strip().lower() != 'completed'
                and t.due_date
                and t.due_date < now
            )
        ])

        progress = (
            (completed_tasks / total_tasks) * 100
            if total_tasks > 0 else 0
        )

        # =========================
        # ACTIVITY FEED
        # =========================

        activity_feed = [{
            "id": a.id,
            "user_id": a.user_id,
            "user_name": a.user.name if a.user else "Unknown User",
            "action_type": a.action_type,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "description": a.description,
            "timestamp": a.timestamp.isoformat()
        } for a in activities]

        # =========================
        # CHART DATA
        # =========================

        chart_data = {
            "completed": completed_tasks,
            "pending": pending_tasks,
            "in_progress": in_progress_tasks,
            "overdue": overdue_tasks
        }

        return {
            "total_projects": projects_count,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "in_progress_tasks": in_progress_tasks,
            "overdue_tasks": overdue_tasks,
            "progress_percentage": round(progress, 2),
            "member_performance": member_performance,
            "activity_feed": activity_feed,
            "chart_data": chart_data
        }, 200