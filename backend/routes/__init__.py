from flask import Blueprint
from flask_restx import Api

blueprint = Blueprint('api', __name__)

authorizations = {
    'apikey': {
        'type': 'apiKey',
        'in': 'header',
        'name': 'Authorization',
        'description': "Type in the *'Value'* input box below: **'Bearer &lt;JWT&gt;'**, where JWT is the token"
    }
}

api = Api(blueprint,
          title='Task Flow API',
          version='1.0',
          description='Enterprise SaaS Task Flow API',
          authorizations=authorizations,
          security='apikey'
          )

from .auth import api as auth_ns
from .projects import api as projects_ns
from .tasks import api as tasks_ns
from .dashboard import api as dashboard_ns
from .team import api as team_ns

api.add_namespace(auth_ns, path='/auth')
api.add_namespace(projects_ns, path='/projects')
api.add_namespace(tasks_ns, path='/tasks')
api.add_namespace(dashboard_ns, path='/dashboard')
api.add_namespace(team_ns, path='/team')
