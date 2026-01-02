from flask import Flask, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)

# Vulnerability Probability Matrix (Hardcoded)
# Row = TCap (1-5), Col = RS (1-5)
# Access as PROB_MATRIX[tcap][rs] (adjusting for 1-based index)
PROB_MATRIX = {
    1: {1: 0.20, 2: 0.10, 3: 0.05, 4: 0.01, 5: 0.00},
    2: {1: 0.40, 2: 0.25, 3: 0.15, 4: 0.05, 5: 0.02},
    3: {1: 0.60, 2: 0.45, 3: 0.30, 4: 0.15, 5: 0.05},
    4: {1: 0.90, 2: 0.70, 3: 0.50, 4: 0.30, 5: 0.10},
    5: {1: 0.99, 2: 0.95, 3: 0.85, 4: 0.60, 5: 0.25}
}

DEFAULT_THREATS = {
    "Script Kiddie": 1,
    "Hacktivist": 2,
    "Cyber Criminal": 3,
    "Organized Crime (FIN7)": 4,
    "Nation State (APT29)": 5
}

@app.route('/api/threat-defaults', methods=['GET'])
def get_threat_defaults():
    return jsonify(DEFAULT_THREATS)

@app.route('/api/calculate', methods=['POST'])
def calculate_risk():
    data = request.json
    
    tcap = int(data.get('tcap', 3))
    rs = int(data.get('rs', 3))
    asset_value = float(data.get('asset_value', 100000))
    tef = float(data.get('tef', 1)) # Threat Event Frequency (times per year)

    # Clamp inputs
    tcap = max(1, min(5, tcap))
    rs = max(1, min(5, rs))

    # 1. Vulnerability
    vulnerability = PROB_MATRIX[tcap][rs]

    # 2. Loss Event Frequency (LEF) = TEF * Vulnerability
    lef = tef * vulnerability

    # 3. Loss Magnitude
    # Assumptions for Financial Formulas:
    # Primary Loss is derived directly from Asset Value (simplified for FAIR-lite)
    # Secondary Loss is estimated as a percentage of Primary Loss 
    # (e.g. fines, reputation, response costs)
    
    primary_loss = asset_value
    # Secondary loss multiplier increases with LEF/severity? 
    # Let's keep it simple: 50% usually
    secondary_loss = primary_loss * 0.5 
    
    loss_magnitude = primary_loss + secondary_loss

    # 4. Annualized Loss Expectancy (ALE)
    ale = lef * loss_magnitude

    # Generate Capability Cliff Data
    # Probability of success vs RS (for a fixed TCap) ??
    # Or Probability vs TCap (for fixed RS)?
    # Usually Cliff shows Probability of Success for different Capabilities giving current RS.
    cliff_data = []
    for t in range(1, 6):
        prob = PROB_MATRIX[t][rs]
        cliff_data.append({
            "tcap": t,
            "probability": prob,
            "label": f"TCap {t}"
        })

    response = {
        "inputs": {
            "tcap": tcap,
            "rs": rs,
            "asset_value": asset_value,
            "tef": tef
        },
        "results": {
            "vulnerability": vulnerability,
            "lef": round(lef, 4),
            "primary_loss": primary_loss,
            "secondary_loss": secondary_loss,
            "single_loss_expectancy": loss_magnitude,
            "ale": round(ale, 2),
            "cliff_data": cliff_data
        }
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
