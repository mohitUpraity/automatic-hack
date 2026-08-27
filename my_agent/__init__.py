import os
from dotenv import load_dotenv
import litellm

# Load .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
load_dotenv(env_path)
load_dotenv()

# Configure litellm
litellm.telemetry = False
litellm.drop_params = True

from . import agent
