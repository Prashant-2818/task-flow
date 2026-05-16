from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from models import db
from models.user import User

api = Namespace('auth', description='Authentication operations')

auth_signup = api.model('Signup', {
    'name': fields.String(required=True, description='User name'),
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password'),
    'role': fields.String(description='User role (Admin or Member)', default='Member')
})

auth_login = api.model('Login', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password'),
    'role': fields.String(description='Requested login role (Admin or Member)', default='Member')
})

@api.route('/signup')
class Signup(Resource):
    @api.expect(auth_signup)
    def post(self):
        data = request.json
        
        if User.query.filter_by(email=data['email']).first():
            return {"message": "Email already registered"}, 400
            
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        role = data.get('role', 'Member')
        if role not in ['Admin', 'Member']:
            role = 'Member'
            
        new_user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hashed,
            role=role
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return {"message": "User created successfully"}, 201

@api.route('/login')
class Login(Resource):
    @api.expect(auth_login)
    def post(self):
        data = request.json
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
            return {"message": "Invalid email or password"}, 401
            
        requested_role = data.get('role', 'Member')
        
        # Verify if the user has the requested role, if they requested Admin, they must be Admin.
        # If they requested Member, even Admins can login as Member (optional, but standard).
        if requested_role == 'Admin' and user.role != 'Admin':
            return {"message": "Unauthorized: You do not have Admin privileges"}, 403
            
        # Optional: update their current active role via JWT claims if needed, but here we just store the actual role
        
        access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
        
        return {
            "access_token": access_token,
            "role": user.role,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        }, 200

@api.route('/profile')
class Profile(Resource):
    @api.doc(security='apikey')
    @jwt_required()
    def get(self):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
            
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }, 200
