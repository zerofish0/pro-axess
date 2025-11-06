from flask import Flask, render_template, request, jsonify, session, redirect
from flask_cors import CORS
import pro_axess_lib
from datetime import datetime, timedelta
import uuid
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)
CORS(app, supports_credentials=True)

# Stockage des sessions utilisateur et de leurs données
axess_sessions = {}


def safe_json(obj):
    """Convertit les objets complexes en types JSON-compatibles"""
    if isinstance(obj, (str, int, float, type(None), bool)):
        return obj
    elif isinstance(obj, list):
        return [safe_json(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: safe_json(v) for k, v in obj.items()}
    else:
        # Pour les objets Pronote (Attachment, etc.)
        if hasattr(obj, "url"):
            return obj.url
        return str(obj)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    try:
        # Création de l'instance Axess et connexion
        axess_instance = pro_axess_lib.Axess(data["username"], data["password"])

        # Récupération immédiate des données Pronote
        infos = safe_json(axess_instance.getInformations())
        grades = safe_json(axess_instance.getGrades())
        tomorrow_str = (datetime.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        homework = safe_json(axess_instance.getHomeworks(tomorrow_str))
        planner_date = (datetime.today() + timedelta(days=1)).strftime("%d/%m/%Y")
        planner = axess_instance.getPlanner(planner_date)
        elo = axess_instance.getElo()

        # Stockage dans la session Flask
        user_id = str(uuid.uuid4())
        axess_sessions[user_id] = {
            "axess": axess_instance,
            "infos": infos,
            "grades": grades,
            "homework": homework,
            "planner": planner,
            "elo": elo,
        }
        session["user_id"] = user_id
        session.permanent = True

        return jsonify({"success": True, "infos": infos})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


def get_user_data():
    user_id = session.get("user_id")
    if not user_id or user_id not in axess_sessions:
        return None
    return axess_sessions[user_id]


@app.route("/grades", methods=["GET"])
def grades():
    user_data = get_user_data()
    if not user_data:
        return redirect("/")
    return jsonify(user_data["grades"])


@app.route("/homework", methods=["GET"])
def homework():
    user_data = get_user_data()
    if not user_data:
        return redirect("/")
    return jsonify(user_data["homework"])


@app.route("/elo", methods=["GET"])
def elo():
    user_data = get_user_data()
    if not user_data:
        return redirect("/")
    return jsonify(user_data["elo"])


@app.route("/planner", methods=["GET"])
def planner():
    user_data = get_user_data()
    if not user_data:
        return redirect("/")
    return jsonify(user_data["planner"])


@app.route("/logout", methods=["POST"])
def logout():
    user_id = session.get("user_id")
    if user_id and user_id in axess_sessions:
        del axess_sessions[user_id]
    session.clear()
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(debug=True)
