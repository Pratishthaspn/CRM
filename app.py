"""
=============================================================================
CRM - Main Application Entrypoint (app.py)
=============================================================================
A clean, student-friendly Customer Relationship Management (CRM) web application
built for a Python Programming College Mini Project.

Features:
- Customer Directory (Full CRUD: Create, Read, Update, Delete)
- Search and Filtering (by Name, Company, Email, Phone, Status)
- Interaction History Logging (Calls, Meetings, Emails, WhatsApp)
- Follow-up Reminders & One-Click Status Toggling
- Interactive Analytical Visualizations & Key Business KPIs
- Clean modular structure with Flask and built-in SQLite3

How to Run:
1. python app.py
2. Open your web browser at: http://127.0.0.1:5000/
=============================================================================
"""

import os
import secrets
from flask import Flask, abort, g, redirect, request, session, url_for
from database import init_db
import models
from routes import crm_bp

def create_app():
    """Application factory for CRM."""
    app = Flask(__name__)
    
    # Secret key used for session signing and flash messages
    secret_key = os.environ.get("SECRET_KEY")
    if not secret_key and os.environ.get("VERCEL") == "1":
        raise RuntimeError("Set a strong SECRET_KEY environment variable before deployment.")
    app.secret_key = secret_key or secrets.token_hex(32)
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "0") == "1"
    )

    # Initialize the SQLite database and seed initial demo records
    with app.app_context():
        init_db()

    # Register the main Blueprint containing all CRM routes
    app.register_blueprint(crm_bp)
    
    @app.before_request
    def require_login_and_authorize():
        endpoint = request.endpoint
        if endpoint == "static":
            return None

        if request.method == "POST":
            expected = session.get("_csrf_token", "")
            supplied = request.form.get("_csrf_token", "") or request.headers.get("X-CSRF-Token", "")
            if not expected or not secrets.compare_digest(expected, supplied):
                abort(400, "Invalid or missing CSRF token.")

        public_endpoints = {"crm.login", "crm.initial_admin"}
        if endpoint in public_endpoints:
            if endpoint == "crm.initial_admin" and models.get_user_count() > 0:
                return redirect(url_for("crm.login"))
            return None

        user_id = session.get("user_id")
        if not user_id:
            return redirect(url_for("crm.login", next=request.path))

        user = models.get_user_by_id(user_id)
        if not user:
            session.clear()
            return redirect(url_for("crm.login"))
        g.current_user = user

        if user["must_change_password"] and endpoint not in {"crm.change_password", "crm.logout"}:
            return redirect(url_for("crm.change_password"))

        admin_only = {
            "crm.settings_page", "crm.reset_db_action", "crm.download_customers_excel",
            "crm.create_user", "crm.reset_user_password"
        }
        if endpoint in admin_only and user["role"] != "admin":
            abort(403)

        if user["role"] == "customer":
            if endpoint == "crm.home":
                if not user["customer_id"]:
                    abort(403)
                return redirect(url_for("crm.customer_portal", customer_id=user["customer_id"]))
            if endpoint == "crm.customer_portal" and user["customer_id"] == request.view_args.get("customer_id"):
                return None
            if endpoint in {"crm.change_password", "crm.logout"}:
                return None
            abort(403)

        return None

    @app.context_processor
    def inject_security_context():
        csrf_token = session.setdefault("_csrf_token", secrets.token_urlsafe(32))
        return {"current_user": getattr(g, "current_user", None), "csrf_token": csrf_token}

    # Custom Jinja template filters for clean formatting in HTML
    @app.template_filter("badge_color")
    def badge_color_filter(status):
        """Returns CSS badge class based on status or priority."""
        status_map = {
            "active": "badge-active",
            "inactive": "badge-inactive",
            "pending": "badge-pending",
            "completed": "badge-completed",
            "high": "badge-high",
            "medium": "badge-medium",
            "low": "badge-low"
        }
        return status_map.get(str(status).lower(), "badge-default")

    @app.template_filter("initials")
    def initials_filter(name):
        """Extracts first letter of first and last name for avatar badges."""
        if not name:
            return "CR"
        parts = name.strip().split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[-1][0]}".upper()
        return name[:2].upper()

    return app


app = create_app()

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5000"))
    debug_mode = os.environ.get("FLASK_DEBUG", "1") == "1"

    print("=" * 65)
    print(" 🚀 Starting CRM - College Python Mini Project")
    print(f" 🌐 Access Dashboard at: http://{host}:{port}/")
    print(" 📂 Database: smallbiz.db (SQLite3)")
    print("=" * 65)
    app.run(debug=debug_mode, host=host, port=port)
