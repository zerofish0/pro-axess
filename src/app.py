from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import pro_axess_lib
from datetime import datetime, timedelta
import uuid
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
CORS(app, supports_credentials=True)

# Stockage temporaire des abonnements
subscriptions = []

VAPID_PRIVATE_KEY = "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0hBZ0VBTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEJHMHdhd0lCQVFRZ3NHMm00VkVHRlpUSStvaWMKOTNWN01jRzlWV0JPbkRzT1NoTVAwOUZEdElDaFJBTkNBQVFvZklYSWdtV1V0TU1Hb0ZXLzRxdmp3aUlRK0hkQwpUeXRtdktSSVNzZUluampNUU5HRitpVlQyYmpWNUh3bmVKdytiQXRuYldCREs4a05zQ1pUNTdpOQotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tCg"
VAPID_CLAIMS = {"sub": "zerofish0@ik.me"}

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/subscribe', methods=['POST'])
def subscribe():
    sub = request.json
    subscriptions.append(sub)
    return jsonify({"success": True})

def send_notification(note_title):
    for sub in subscriptions:
        webpush(
            subscription_info=sub,
            data=json.dumps({"title": "Nouvelle note", "body": note_title}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
@app.route('/add_note', methods=['POST'])
def add_note():
    data = request.json
    note_title = data['title']
    send_notification(note_title)
    return jsonify({"success": True})

@app.route('/test_notification', methods=['GET'])
def test_notification():
    for sub in subscriptions:
        webpush(
            subscription_info=sub,
            data=json.dumps({"title": "Test", "body": "Bonjour !"}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
    return "Notification envoyée !"

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    try:
        # Création de l'instance Axess et connexion
        axess_instance = pro_axess_lib.Axess(data['username'], data['password'])

        # Récupération immédiate des données Pronote
        infos = safe_json(axess_instance.getInformations())
        grades = safe_json(axess_instance.getGrades())
        tomorrow_str = (datetime.today() + timedelta(days=1)).strftime('%Y-%m-%d')
        homework = safe_json(axess_instance.getHomeworks(tomorrow_str))
        planner_date = (datetime.today() + timedelta(days=1)).strftime('%d/%m/%Y')
        planner = axess_instance.getPlanner(planner_date)

        # Stockage dans la session Flask
        user_id = str(uuid.uuid4())
        axess_sessions[user_id] = {
            "axess": axess_instance,
            "infos": infos,
            "grades": grades,
            "homework": homework,
            "planner": planner
        }
        session['user_id'] = user_id

        return jsonify({"success": True, "infos": infos})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

def get_user_data():
    user_id = session.get('user_id')
    if not user_id or user_id not in axess_sessions:
        return None
    return axess_sessions[user_id]

@app.route('/grades', methods=['GET'])
def grades():
    user_data = get_user_data()
    if not user_data:
        return jsonify({"success": False, "error": "Non authentifié"}), 401
    return jsonify(user_data["grades"])

@app.route('/homework', methods=['GET'])
def homework():
    user_data = get_user_data()
    if not user_data:
        return jsonify({"success": False, "error": "Non authentifié"}), 401
    return jsonify(user_data["homework"])

@app.route('/planner', methods=['GET'])
def planner():
    user_data = get_user_data()
    if not user_data:
        return jsonify({"success": False, "error": "Non authentifié"}), 401
    return jsonify(user_data["planner"])

@app.route('/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    if user_id and user_id in axess_sessions:
        del axess_sessions[user_id]
    session.clear()
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True)
