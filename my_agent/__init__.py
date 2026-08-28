import os
from dotenv import load_dotenv

# Load .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
load_dotenv(env_path)
load_dotenv()

os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
import litellm

# Configure litellm
litellm.telemetry = False
litellm.suppress_debug_info = True
litellm.drop_params = True

from . import agent
