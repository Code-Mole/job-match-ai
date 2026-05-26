"""
JobMatch AI Service — Flask application entry point.
Runs on port 8000 by default.
"""

import os
import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Configure logging — shows timestamps and severity in the console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)

    # Allow requests from the Express backend and React frontend
    CORS(app, resources={
        r"/*": {
            "origins": [
                os.getenv("NODE_SERVICE_URL", "http://localhost:5000"),
                "http://localhost:5173",  # React dev server
            ]
        }
    })

    @app.route("/health")
    def health():
        return {
            "status": "ok",
            "service": "ai-service"
        }

    # Register all routes
    from app.routes import bp
    app.register_blueprint(bp)

    logger.info("Flask AI Service initialized.")
    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 8000))
    debug = os.getenv("FLASK_ENV") == "development"

    logger.info(f"Starting AI Service on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)