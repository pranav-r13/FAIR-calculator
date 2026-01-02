from flask import Flask, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)

# Vulnerability Probability Matrix (Hardcoded)
# Row = TCap (1-5), Col = RS (1-5)
# Access as PROB_MATRIX[tcap][rs] (adjusting for 1-based index)
# Vulnerability Probability Matrix (Hardcoded)
# Row = TCap (1-5), Col = RS (1-5)
PROB_MATRIX = {
    5: {1: 0.99, 2: 0.95, 3: 0.85, 4: 0.60, 5: 0.25}, # TCap 5 (APT)
    4: {1: 0.95, 2: 0.80, 3: 0.50, 4: 0.25, 5: 0.05}, # TCap 4 (Crime)
    3: {1: 0.80, 2: 0.50, 3: 0.20, 4: 0.05, 5: 0.01}, # TCap 3 (Hacktivist)
    2: {1: 0.50, 2: 0.20, 3: 0.05, 4: 0.01, 5: 0.00}, # TCap 2 (Opportunistic)
    1: {1: 0.20, 2: 0.05, 3: 0.01, 4: 0.00, 5: 0.00}  # TCap 1 (Skiddie)
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
    
    # Base Inputs
    tcap = int(data.get('tcap', 3))
    rs = int(data.get('rs', 3))
    asset_value = float(data.get('asset_value', 100000))
    tef = float(data.get('tef', 1)) 

    # SVCC Inputs
    severity = float(data.get('severity', 5))     # 1-10
    criticality = float(data.get('criticality', 5)) # 1-10
    countermeasure = float(data.get('countermeasure', 3)) # 1-5

    # Clamp inputs
    tcap = max(1, min(5, tcap))
    rs = max(1, min(5, rs))
    severity = max(1, min(10, severity))
    criticality = max(1, min(10, criticality))
    countermeasure = max(1, min(5, countermeasure))

    # 1. FAIR-lite Calculations
    vulnerability = PROB_MATRIX[tcap][rs]
    lef = tef * vulnerability
    
    primary_loss = asset_value
    secondary_loss = primary_loss * 0.5 
    loss_magnitude = primary_loss + secondary_loss
    ale = lef * loss_magnitude

    # 2. SVCC Risk Score Calculation
    # Formula: ((Severity + (Vulnerability * 10) + Criticality) / 3) * (10 / Countermeasure)
    # This provides a balanced 0-100 range and sensitivity.
    
    # Scale Vulnerability (0.0 - 1.0) to 1-10 scale
    v_scaled = vulnerability * 10
    
    # Average the three impact factors, then multiply by countermeasure coefficient
    raw_svcc = ((severity + v_scaled + criticality) / 3) * (10 / countermeasure)
    
    # Normalize to 0-100 Gauge
    svcc_score = min(100, max(0, raw_svcc))

    # Determine Color
    if svcc_score <= 30:
        svcc_color = "Green" # Resilient
    elif svcc_score <= 70:
        svcc_color = "Yellow" # Exposed
    else:
        svcc_color = "Red" # Critical

    # Cliff Data
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
            "tef": tef,
            "severity": severity,
            "criticality": criticality,
            "countermeasure": countermeasure
        },
        "results": {
            "vulnerability": vulnerability,
            "lef": round(lef, 4),
            "primary_loss": primary_loss,
            "secondary_loss": secondary_loss,
            "single_loss_expectancy": loss_magnitude,
            "ale": round(ale, 2),
            "cliff_data": cliff_data,
            "svcc": {
                "score": round(svcc_score, 2),
                "color": svcc_color
            }
        }
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
