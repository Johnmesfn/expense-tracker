from flask import Flask, jsonify, request
import json
from datetime import datetime
import os
from flask_cors import CORS  # <---- import CORS

app = Flask(__name__)
CORS(app)  # <---- enable CORS

DATA_FILE = 'expenses.json'

# ------------------------
# Utility Functions
# ------------------------

def load_expenses():
    """Load expenses from JSON file"""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)


def save_expenses(expenses):
    """Save expenses to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(expenses, f, indent=4)


# ------------------------
# Routes
# ------------------------

@app.route('/')
def index():
    return jsonify({"message": "Welcome to the Expense Tracker API!"})


@app.route('/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses, with optional filters for category and date"""
    expenses = load_expenses()
    category = request.args.get('category')
    date = request.args.get('date')

    if category:
        expenses = [e for e in expenses if e['category'].lower() == category.lower()]
    if date:
        expenses = [e for e in expenses if e['date'] == date]

    return jsonify(expenses), 200


@app.route('/expenses', methods=['POST'])
def add_expense():
    """Add a new expense"""
    data = request.get_json()

    if not data or not all(k in data for k in ('title', 'amount', 'category')):
        return jsonify({"error": "Missing title, amount, or category"}), 400

    try:
        expense = {
            "id": int(datetime.utcnow().timestamp()),
            "title": data['title'],
            "amount": float(data['amount']),
            "category": data['category'],
            "date": datetime.utcnow().strftime('%Y-%m-%d')
        }
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount format"}), 400

    expenses = load_expenses()
    expenses.append(expense)
    save_expenses(expenses)

    return jsonify(expense), 201


@app.route('/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """Update an existing expense"""
    data = request.get_json()
    expenses = load_expenses()

    for expense in expenses:
        if expense['id'] == expense_id:
            expense['title'] = data.get('title', expense['title'])
            expense['amount'] = float(data.get('amount', expense['amount']))
            expense['category'] = data.get('category', expense['category'])
            expense['date'] = data.get('date', expense['date'])
            save_expenses(expenses)
            return jsonify(expense), 200

    return jsonify({"error": "Expense not found"}), 404


@app.route('/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete an expense by ID"""
    expenses = load_expenses()
    updated_expenses = [e for e in expenses if e['id'] != expense_id]

    if len(updated_expenses) == len(expenses):
        return jsonify({"error": "Expense not found"}), 404

    save_expenses(updated_expenses)
    return jsonify({"message": "Deleted"}), 200


@app.route('/expenses/total', methods=['GET'])
def total_expenses():
    """Get total expense amount, optionally filtered"""
    expenses = load_expenses()
    category = request.args.get('category')
    date = request.args.get('date')

    if category:
        expenses = [e for e in expenses if e['category'].lower() == category.lower()]
    if date:
        expenses = [e for e in expenses if e['date'] == date]

    total = sum(e['amount'] for e in expenses)
    return jsonify({"total": round(total, 2), "count": len(expenses)}), 200


# ------------------------
# Run the App
# ------------------------

if __name__ == '__main__':
    app.run(debug=True)
