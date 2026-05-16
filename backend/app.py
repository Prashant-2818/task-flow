from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from config import Config
from models import db

# Initialize extensions
jwt = JWTManager()
migrate = Migrate()
cors = CORS()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "http://localhost:3000"}},
        supports_credentials=True
    )

    # Import models to ensure they are known to SQLAlchemy
    from models.user import User
    from models.project import Project, ProjectMember
    from models.task import Task
    from models.activity import ActivityLog

    # Register Blueprints / Namespaces here
    from routes import blueprint as api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    @app.route('/')
    def index():
        return jsonify({"message": "Welcome to Task Flow API"})

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)