"""
=============================================================================
CRM - Application Routes & Controller (routes.py)
=============================================================================
This module defines the Flask Blueprint for all application URL routes:
- Dashboard route
- Customer management routes (List, Add, View, Edit, Delete)
- Interaction tracking routes (List, Add, Delete)
- Follow-up management routes (List, Add, Edit, Toggle, Delete)
- Analytics & Reports route
- Settings & Sample Data Reset routes

Demonstrates standard HTTP verbs (GET, POST), form handling, input validation,
flash messages, and Jinja2 template rendering for college viva examinations.
=============================================================================
"""

import io
import re
import sqlite3
from datetime import date
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, send_file, abort, session
from openpyxl import Workbook
from openpyxl.styles import Font
from werkzeug.security import check_password_hash, generate_password_hash
import models
from database import reset_database

# Create Flask Blueprint for modular routing
crm_bp = Blueprint("crm", __name__)


def valid_password(password):
    return len(password) >= 12


@crm_bp.route("/login", methods=["GET", "POST"])
def login():
    if models.get_user_count() == 0:
        return redirect(url_for("crm.initial_admin"))
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        user = models.get_user_by_email(email)
        if user and check_password_hash(user["password_hash"], request.form.get("password", "")):
            session.clear()
            session["user_id"] = user["id"]
            return redirect(url_for("crm.change_password" if user["must_change_password"] else "crm.home"))
        flash("Email or password was not recognized.", "danger")
    return render_template("login.html", setup_required=False, register_customer=False)


@crm_bp.route("/setup-admin", methods=["GET", "POST"])
def initial_admin():
    if models.get_user_count() > 0:
        return redirect(url_for("crm.login"))
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirmation = request.form.get("confirm_password", "")
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            flash("Enter a valid email address.", "danger")
        elif not valid_password(password):
            flash("Use a password with at least 12 characters.", "danger")
        elif password != confirmation:
            flash("The passwords do not match.", "danger")
        else:
            models.create_user(email, generate_password_hash(password), "admin")
            flash("Admin account created. Please sign in.", "success")
            return redirect(url_for("crm.login"))
    return render_template("login.html", setup_required=True, register_customer=False)


@crm_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    flash("You have been signed out.", "info")
    return redirect(url_for("crm.login"))


@crm_bp.route("/change-password", methods=["GET", "POST"])
def change_password():
    user = models.get_user_by_id(session["user_id"])
    if request.method == "POST":
        current_password = request.form.get("current_password", "")
        new_password = request.form.get("new_password", "")
        confirmation = request.form.get("confirm_password", "")
        if not check_password_hash(user["password_hash"], current_password):
            flash("Current password is incorrect.", "danger")
        elif not valid_password(new_password):
            flash("Use a password with at least 12 characters.", "danger")
        elif new_password != confirmation:
            flash("The new passwords do not match.", "danger")
        else:
            models.update_user_password(user["id"], generate_password_hash(new_password))
            flash("Password updated successfully.", "success")
            return redirect(url_for("crm.home"))
    return render_template("change_password.html")


@crm_bp.route("/admin/users", methods=["POST"])
def create_user():
    email = request.form.get("email", "").strip().lower()
    role = request.form.get("role", "")
    password = request.form.get("password", "")
    customer_id = None
    if role == "customer":
        customer = models.get_customer_by_email(request.form.get("customer_email", "").strip())
        if not customer:
            flash("For a customer account, use an existing customer's email.", "danger")
            return redirect(url_for("crm.settings_page"))
        customer_id = customer["id"]
        email = customer["email"].lower()
    if role not in {"admin", "staff", "customer"} or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        flash("Select a valid role and enter a valid email address.", "danger")
    elif not valid_password(password):
        flash("Temporary passwords must have at least 12 characters.", "danger")
    else:
        try:
            models.create_user(email, generate_password_hash(password), role, customer_id, True)
        except sqlite3.IntegrityError:
            flash("That email or customer profile already has an account.", "danger")
        else:
            flash("Account created. The user must change the temporary password at sign-in.", "success")
    return redirect(url_for("crm.settings_page"))


@crm_bp.route("/admin/users/<int:user_id>/reset-password", methods=["POST"])
def reset_user_password(user_id):
    user = models.get_user_by_id(user_id)
    password = request.form.get("password", "")
    if not user:
        abort(404)
    if not valid_password(password):
        flash("Temporary passwords must have at least 12 characters.", "danger")
    else:
        models.update_user_password(user_id, generate_password_hash(password), True)
        flash("Password reset. The user must change it at next sign-in.", "success")
    return redirect(url_for("crm.settings_page"))


def validate_customer_form(name, email, phone):
    """
    Validates mandatory customer fields:
    - Name must not be blank
    - Email must contain basic email structure (@ and domain)
    - Phone must contain valid digits (at least 7 digits)
    """
    if not name or len(name.strip()) < 2:
        return "Customer full name is required (minimum 2 characters)."
    
    # Basic email format validation
    email_pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not email or not re.match(email_pattern, email.strip()):
        return "Please enter a valid email address (e.g., name@example.com)."
    
    # Clean phone digits check
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) < 7:
        return "Please enter a valid phone number (at least 7 digits)."
        
    return None


# ---------------------------------------------------------------------------
# DASHBOARD ROUTE
# ---------------------------------------------------------------------------
@crm_bp.route("/")
def home():
    """Root redirect to the main dashboard."""
    return redirect(url_for("crm.dashboard"))


@crm_bp.route("/dashboard")
def dashboard():
    """
    Renders main dashboard with 4 KPI summary cards,
    recent customer list, recent interactions, and pending follow-ups.
    """
    data = models.get_dashboard_data()
    settings = models.get_settings()
    return render_template(
        "dashboard.html",
        active_page="dashboard",
        data=data,
        settings=settings
    )


@crm_bp.route("/my-account/<int:customer_id>")
def customer_portal(customer_id):
    customer = models.get_customer_by_id(customer_id)
    if not customer:
        abort(404)
    return render_template(
        "customer_portal.html",
        active_page="account",
        customer=customer,
        interactions=models.get_customer_interactions(customer_id),
        followups=models.get_customer_followups(customer_id),
        settings=models.get_settings()
    )


# ---------------------------------------------------------------------------
# CUSTOMERS ROUTES (CRUD)
# ---------------------------------------------------------------------------
@crm_bp.route("/customers")
def customers_list():
    """
    Displays the customer directory.
    Supports query parameters:
      - ?search=<keyword>
      - ?status=All|Active|Inactive|Pending
    """
    search_query = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "All").strip()

    customers = models.get_customers(search_query, status_filter)
    settings = models.get_settings()

    return render_template(
        "customers.html",
        active_page="customers",
        customers=customers,
        search_query=search_query,
        status_filter=status_filter,
        settings=settings
    )


@crm_bp.route("/customers/add", methods=["POST"])
def customer_add():
    """Handles adding a new customer with input validation."""
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    phone = request.form.get("phone", "").strip()
    company = request.form.get("company", "").strip()
    address = request.form.get("address", "").strip()
    status = request.form.get("status", "Active")
    notes = request.form.get("notes", "").strip()

    error = validate_customer_form(name, email, phone)
    if error:
        flash(error, "danger")
        return redirect(url_for("crm.customers_list"))

    new_id = models.create_customer(name, email, phone, company, address, status, notes)
    flash(f"Customer '{name}' added successfully! (ID: #CUST-{new_id})", "success")
    return redirect(url_for("crm.customers_list"))


@crm_bp.route("/customers/<int:customer_id>")
def customer_details(customer_id):
    """
    Displays full details for a selected customer,
    including their interaction history log and pending follow-ups.
    """
    customer = models.get_customer_by_id(customer_id)
    if not customer:
        flash(f"Customer ID #{customer_id} was not found.", "warning")
        return redirect(url_for("crm.customers_list"))

    interactions = models.get_customer_interactions(customer_id)
    followups = models.get_customer_followups(customer_id)
    settings = models.get_settings()

    return render_template(
        "customer_details.html",
        active_page="customers",
        customer=customer,
        interactions=interactions,
        followups=followups,
        settings=settings
    )


@crm_bp.route("/customers/edit/<int:customer_id>", methods=["POST"])
def customer_edit(customer_id):
    """Updates customer details."""
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    phone = request.form.get("phone", "").strip()
    company = request.form.get("company", "").strip()
    address = request.form.get("address", "").strip()
    status = request.form.get("status", "Active")
    notes = request.form.get("notes", "").strip()

    error = validate_customer_form(name, email, phone)
    if error:
        flash(error, "danger")
        return redirect(request.referrer or url_for("crm.customer_details", customer_id=customer_id))

    models.update_customer(customer_id, name, email, phone, company, address, status, notes)
    flash(f"Customer details for '{name}' updated successfully.", "success")
    return redirect(request.referrer or url_for("crm.customer_details", customer_id=customer_id))


@crm_bp.route("/customers/delete/<int:customer_id>", methods=["POST"])
def customer_delete(customer_id):
    """Deletes customer and cascading interactions/follow-ups."""
    cust = models.get_customer_by_id(customer_id)
    cust_name = cust["name"] if cust else f"#{customer_id}"
    models.delete_customer(customer_id)
    flash(f"Customer '{cust_name}' deleted.", "info")
    return redirect(url_for("crm.customers_list"))


# ---------------------------------------------------------------------------
# INTERACTIONS ROUTES
# ---------------------------------------------------------------------------
@crm_bp.route("/interactions")
def interactions_list():
    """
    Displays all customer interactions.
    Supports filtering by interaction type: Call, Email, Meeting, WhatsApp, Other.
    """
    type_filter = request.args.get("type", "All").strip()
    interactions = models.get_interactions(type_filter)
    customers = models.get_customers()  # For the Add Interaction customer dropdown
    settings = models.get_settings()

    return render_template(
        "interactions.html",
        active_page="interactions",
        interactions=interactions,
        type_filter=type_filter,
        customers=customers,
        settings=settings
    )


@crm_bp.route("/interactions/add", methods=["POST"])
def interaction_add():
    """Logs a new interaction."""
    customer_id = request.form.get("customer_id")
    interaction_type = request.form.get("type", "Call")
    description = request.form.get("description", "").strip()
    interaction_date = request.form.get("interaction_date")
    follow_up_date = request.form.get("follow_up_date") or None

    if not customer_id:
        flash("Please select a valid customer.", "danger")
        return redirect(request.referrer or url_for("crm.interactions_list"))

    if not description:
        flash("Please provide brief notes/description for the interaction.", "danger")
        return redirect(request.referrer or url_for("crm.interactions_list"))

    models.create_interaction(
        customer_id=int(customer_id),
        interaction_type=interaction_type,
        description=description,
        interaction_date=interaction_date,
        follow_up_date=follow_up_date
    )
    flash("Interaction logged successfully.", "success")
    return redirect(request.referrer or url_for("crm.interactions_list"))


@crm_bp.route("/interactions/delete/<int:interaction_id>", methods=["POST"])
def interaction_delete(interaction_id):
    """Deletes an interaction log entry."""
    models.delete_interaction(interaction_id)
    flash("Interaction deleted.", "info")
    return redirect(request.referrer or url_for("crm.interactions_list"))


# ---------------------------------------------------------------------------
# FOLLOW-UPS ROUTES
# ---------------------------------------------------------------------------
@crm_bp.route("/followups")
def followups_list():
    """
    Displays follow-up tasks.
    Supports filtering by status: All, Pending, Completed.
    """
    status_filter = request.args.get("status", "All").strip()
    followups = models.get_followups(status_filter)
    customers = models.get_customers()
    settings = models.get_settings()

    return render_template(
        "followups.html",
        active_page="followups",
        followups=followups,
        status_filter=status_filter,
        customers=customers,
        settings=settings
    )


@crm_bp.route("/followups/add", methods=["POST"])
def followup_add():
    """Creates a new follow-up task."""
    customer_id = request.form.get("customer_id")
    reason = request.form.get("reason", "").strip()
    follow_up_date = request.form.get("follow_up_date")
    priority = request.form.get("priority", "Medium")

    if not customer_id:
        flash("Please select a customer for this follow-up.", "danger")
        return redirect(request.referrer or url_for("crm.followups_list"))

    if not reason:
        flash("Follow-up reason cannot be empty.", "danger")
        return redirect(request.referrer or url_for("crm.followups_list"))

    if not follow_up_date:
        flash("Please select a scheduled follow-up date.", "danger")
        return redirect(request.referrer or url_for("crm.followups_list"))

    models.create_followup(int(customer_id), reason, follow_up_date, priority, status="Pending")
    flash("Follow-up task scheduled successfully.", "success")
    return redirect(request.referrer or url_for("crm.followups_list"))


@crm_bp.route("/followups/edit/<int:followup_id>", methods=["POST"])
def followup_edit(followup_id):
    """Edits follow-up details."""
    reason = request.form.get("reason", "").strip()
    follow_up_date = request.form.get("follow_up_date")
    priority = request.form.get("priority", "Medium")
    status = request.form.get("status", "Pending")

    if not reason or not follow_up_date:
        flash("Reason and date are required.", "danger")
        return redirect(request.referrer or url_for("crm.followups_list"))

    models.update_followup(followup_id, reason, follow_up_date, priority, status)
    flash("Follow-up updated successfully.", "success")
    return redirect(request.referrer or url_for("crm.followups_list"))


@crm_bp.route("/followups/toggle/<int:followup_id>", methods=["POST"])
def followup_toggle(followup_id):
    """
    Toggles follow-up between 'Pending' and 'Completed'.
    Quick one-click action for students during project viva.
    """
    new_status = models.toggle_followup_status(followup_id)
    if new_status:
        flash(f"Follow-up marked as {new_status}!", "success")
    return redirect(request.referrer or url_for("crm.followups_list"))


@crm_bp.route("/followups/delete/<int:followup_id>", methods=["POST"])
def followup_delete(followup_id):
    """Deletes a follow-up item."""
    models.delete_followup(followup_id)
    flash("Follow-up deleted.", "info")
    return redirect(request.referrer or url_for("crm.followups_list"))


# ---------------------------------------------------------------------------
# REPORTS & ANALYTICS
# ---------------------------------------------------------------------------
@crm_bp.route("/reports")
def reports():
    """
    Renders analytics and visual charts for:
    - Customer distribution by status
    - Interaction frequency by type
    - Follow-ups by status and priority
    """
    reports_data = models.get_reports_data()
    settings = models.get_settings()

    return render_template(
        "reports.html",
        active_page="reports",
        reports=reports_data,
        settings=settings
    )


@crm_bp.route("/api/reports-data")
def api_reports_data():
    """API endpoint returning JSON reports data for chart rendering."""
    return jsonify(models.get_reports_data())


# ---------------------------------------------------------------------------
# SETTINGS & DEMO CONTROLS
# ---------------------------------------------------------------------------
@crm_bp.route("/settings", methods=["GET", "POST"])
def settings_page():
    """Manages simple business profile and demonstration data reset."""
    if request.method == "POST":
        business_name = request.form.get("business_name", "CRM")
        owner_email = request.form.get("owner_email", "admin@crm.local")
        owner_phone = request.form.get("owner_phone", "+91 98765 43210")
        currency = request.form.get("currency", "₹")
        theme = request.form.get("theme", "light")

        models.update_settings(business_name, owner_email, owner_phone, currency, theme)
        flash("Settings saved successfully.", "success")
        return redirect(url_for("crm.settings_page"))

    current_settings = models.get_settings()
    return render_template(
        "settings.html",
        active_page="settings",
        settings=current_settings,
        users=models.list_users()
    )


@crm_bp.route("/download-customers.xlsx")
@crm_bp.route("/settings/export-customers")
def download_customers_excel():
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Customers"
    columns = ["ID", "Name", "Email", "Phone", "Company", "Address", "Status", "Notes", "Created At", "Last Contact"]
    sheet.append(columns)
    for cell in sheet[1]:
        cell.font = Font(bold=True)
    sheet.freeze_panes = "A2"
    for column, width in zip("ABCDEFGHIJ", (10, 24, 32, 18, 24, 30, 14, 40, 16, 16)):
        sheet.column_dimensions[column].width = width

    for customer in models.get_customers():
        values = [customer[key] for key in (
            "id", "name", "email", "phone", "company", "address", "status", "notes", "created_at", "last_contact"
        )]
        sheet.append([
            "'" + value if isinstance(value, str) and value.startswith(("=", "+", "-", "@")) else value
            for value in values
        ])

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"customers_{date.today().isoformat()}.xlsx"
    )


@crm_bp.route("/reset-database", methods=["POST"])
def reset_db_action():
    """
    Special helper route for college demonstrations:
    Resets the database back to clean sample customer and interaction records.
    """
    reset_database()
    flash("Database successfully reset to initial realistic sample data!", "info")
    return redirect(url_for("crm.dashboard"))



