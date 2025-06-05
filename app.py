from flask import Flask, jsonify, request
import json
from datetime import datetime
import os
from flask_cors import CORS
import pandas as pd
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

EXPENSE_FILE = 'expenses.json'
INCOME_FILE = 'incomes.json'

ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx'}
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ------------------------
# Utility Functions
# ------------------------

def load_data(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, 'r') as f:
        return json.load(f)

def save_data(file_path, data):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4)

def generate_id():
    return int(datetime.utcnow().timestamp() * 1000)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_date(date_str):
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return None

def parse_amount(amount):
    try:
        return float(amount)
    except (ValueError, TypeError):
        return None

def validate_expense_row(row):
    if 'title' not in row or not row['title']:
        return False, "Missing title"
    if 'amount' not in row or parse_amount(row['amount']) is None:
        return False, "Invalid or missing amount"
    if 'category' not in row or not row['category']:
        return False, "Missing category"
    if 'date' in row and parse_date(row['date']) is None:
        return False, "Invalid date format (YYYY-MM-DD expected)"
    return True, ""

def validate_income_row(row):
    if 'source' not in row or not row['source']:
        return False, "Missing source"
    if 'amount' not in row or parse_amount(row['amount']) is None:
        return False, "Invalid or missing amount"
    if 'date' not in row or parse_date(row['date']) is None:
        return False, "Missing or invalid date (YYYY-MM-DD expected)"
    return True, ""

def save_file(file):
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    return filepath

def read_file(filepath):
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == 'csv':
        return pd.read_csv(filepath)
    else:
        return pd.read_excel(filepath)

# ------------------------
# Routes
# ------------------------

@app.route('/')
def index():
    return jsonify({"message": "Welcome to the Expense & Income Tracker API!"})

# --- Expenses ---

@app.route('/expenses', methods=['GET'])
def get_expenses():
    expenses = load_data(EXPENSE_FILE)
    category = request.args.get('category')
    date = request.args.get('date')

    if category:
        expenses = [e for e in expenses if e['category'].lower() == category.lower()]
    if date:
        expenses = [e for e in expenses if e['date'] == date]

    return jsonify(expenses), 200

@app.route('/expenses', methods=['POST'])
def add_expense():
    data = request.get_json()

    if not data or not all(k in data for k in ('title', 'amount', 'category')):
        return jsonify({"error": "Missing title, amount, or category"}), 400

    amount = parse_amount(data['amount'])
    if amount is None:
        return jsonify({"error": "Amount must be a number"}), 400

    date_val = data.get('date')
    if date_val and not parse_date(date_val):
        return jsonify({"error": "Date must be in YYYY-MM-DD format"}), 400

    expense = {
        "id": generate_id(),
        "title": data['title'],
        "amount": amount,
        "category": data['category'],
        "date": date_val or datetime.utcnow().strftime('%Y-%m-%d')
    }

    expenses = load_data(EXPENSE_FILE)
    expenses.append(expense)
    save_data(EXPENSE_FILE, expenses)

    return jsonify(expense), 201

# Bulk upload endpoint for expenses
@app.route('/expenses/upload', methods=['POST'])
def upload_expenses():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filepath = save_file(file)
        try:
            df = read_file(filepath)
        except Exception as e:
            return jsonify({"error": f"Failed to read file: {str(e)}"}), 400

        expenses = load_data(EXPENSE_FILE)
        new_expenses = []
        errors = []

        for idx, row in df.iterrows():
            row_data = row.to_dict()
            valid, msg = validate_expense_row(row_data)
            if not valid:
                errors.append(f"Row {idx+1}: {msg}")
                continue

            expense = {
                "id": generate_id(),
                "title": row_data['title'],
                "amount": float(row_data['amount']),
                "category": row_data['category'],
                "date": row_data.get('date') or datetime.utcnow().strftime('%Y-%m-%d')
            }
            new_expenses.append(expense)

        if errors:
            return jsonify({"errors": errors}), 400

        expenses.extend(new_expenses)
        save_data(EXPENSE_FILE, expenses)
        return jsonify({"added": len(new_expenses)}), 201

    return jsonify({"error": "Unsupported file type"}), 400

# Similar update, delete, and total routes remain the same as your code

# --- Incomes ---

@app.route('/incomes', methods=['GET'])
def get_incomes():
    incomes = load_data(INCOME_FILE)
    source = request.args.get('source')
    date = request.args.get('date')

    if source:
        incomes = [i for i in incomes if i['source'].lower() == source.lower()]
    if date:
        incomes = [i for i in incomes if i['date'] == date]

    return jsonify(incomes), 200

@app.route('/incomes', methods=['POST'])
def add_income():
    data = request.get_json()

    if not data or any(field not in data for field in ('source', 'amount', 'date')):
        return jsonify({"error": "Missing required fields: source, amount, and date"}), 400

    amount = parse_amount(data['amount'])
    if amount is None:
        return jsonify({"error": "Amount must be a number"}), 400

    if not parse_date(data['date']):
        return jsonify({"error": "Date must be in YYYY-MM-DD format"}), 400

    income = {
        "id": generate_id(),
        "source": data['source'],
        "amount": amount,
        "date": data['date']
    }

    incomes = load_data(INCOME_FILE)
    incomes.append(income)
    save_data(INCOME_FILE, incomes)

    return jsonify(income), 201

# Bulk upload endpoint for incomes
@app.route('/incomes/upload', methods=['POST'])
def upload_incomes():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filepath = save_file(file)
        try:
            df = read_file(filepath)
        except Exception as e:
            return jsonify({"error": f"Failed to read file: {str(e)}"}), 400

        incomes = load_data(INCOME_FILE)
        new_incomes = []
        errors = []

        for idx, row in df.iterrows():
            row_data = row.to_dict()
            valid, msg = validate_income_row(row_data)
            if not valid:
                errors.append(f"Row {idx+1}: {msg}")
                continue

            income = {
                "id": generate_id(),
                "source": row_data['source'],
                "amount": float(row_data['amount']),
                "date": row_data['date']
            }
            new_incomes.append(income)

        if errors:
            return jsonify({"errors": errors}), 400

        incomes.extend(new_incomes)
        save_data(INCOME_FILE, incomes)
        return jsonify({"added": len(new_incomes)}), 201

    return jsonify({"error": "Unsupported file type"}), 400

# --- Rest of your update, delete, and total income routes remain unchanged ---

if __name__ == '__main__':
    app.run(debug=True)
