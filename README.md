# N.O.A.H — Neural Observation & Alignment Hub

N.O.A.H is a **dark, minimalist, serious alignment system** designed to serve as a mirror for your daily behavior. Unlike traditional productivity apps that reward "doing," N.O.A.H focuses on the "silence" between your intentions and your actions, detecting subtle drifts from your chosen identity.

## 👁️ Core Philosophy
*   **Silence is the Mirror**: N.O.A.H doesn't coach or motivate; it observes and reflects.
*   **Measurable Alignment**: Behavioral anchors and operational time are used to calculate "Authenticity" and "Drift."
*   **30-Day Commitment**: Identities are locked for 30-day cycles to ensure signal integrity.

## 🛠️ Tech Stack
- **Frontend**: React (ES6 Modules), Tailwind CSS, Framer Motion.
- **Icons**: Lucide React.
- **Intelligence**: Google Gemini API (`@google/genai`) using `gemini-3-pro-preview` for deep analysis and `gemini-3-flash-preview` for rapid feedback and audio transcription.
- **Local Database**: Browser `localStorage` with a custom syncing simulation layer.
- **Core Engine**: `noah-core` — A deterministic diagnostic system for signal analysis.

## ✨ Key Features
- **Identity Locking**: Define a role and three behavioral anchors.
- **Daily Observations**: Record notes (via text or audio transcription), time spent, mental state, and energy.
- **Trajectory Analysis**: Visual plot of your alignment over a 7-day rolling window.
- **Deep Reflective Analysis**: LLM-powered "Deep Thinking" sessions that confront self-deception and identity inflation.
- **Offline First**: Full functionality without a connection, with a visual sync indicator.

## 📖 Operational Guide

### 1. Initialization (The Setup)
When you first enter N.O.A.H, you are in the **Setup Phase**.
*   **Define Your Identity**: Choose a role that represents your highest intent (e.g., "Sovereign Developer", "Deep Researcher").
*   **Establish Anchors**: Define exactly three non-negotiable behavioral markers that prove you are inhabiting that identity.
*   **Lock the Signal**: Once locked, this identity is your operational reality for the next 30 days. It cannot be altered mid-cycle.

### 2. Daily Observation (The Check-In)
Alignment requires daily verification.
*   **Document Reality**: Enter a brief summary of your actions. You can use the **Microphone Icon** to speak your observation; Gemini 3 Flash will transcribe it into the system.
*   **Log Metrics**: Record the actual minutes spent on your identity and mark which behavioral anchors were fulfilled.
*   **Mental Telemetry**: Note your state of mind and energy levels. 
*   **Submission**: Once submitted, the entry is immutable for that 24-hour window.

### 3. The Mirror (The Truth)
The **Truth** tab is where the N.O.A.H Core Engine processes your signals.
*   **Status Indicators**: 
    *   `ALIGNED`: Your actions match your intent.
    *   `DRIFTING`: Substantial discrepancy between intent and output.
    *   `UNSTABLE`: Low signal density or high volatility.
*   **Deep Analysis**: Click **Request Deep Analysis** to trigger `gemini-3-pro-preview`. The system will perform a clinical audit of your trajectory, identifying self-deception and "Narrative Smoothing."

### 4. Tracking Trajectory (History)
The **History** tab provides a visualization of your 7-day rolling window.
*   **Trajectory Plot**: A clinical line graph showing your alignment trend.
*   **Node Export**: Use the **Export Node** button to download your entire operational history as a portable JSON file.

### 5. Cycle Completion (Renewal)
After 30 days, your identity node expires.
*   **Review**: Assess your 30-day performance.
*   **Recommit**: Extend the current identity for another cycle.
*   **Reset**: Completely wipe the node to define a new operational intent.

## 🧪 Testing Scenarios

To test the system's diagnostic capabilities without waiting for 30 days, use the **"Import existing Node"** button on the Setup screen.

**ALL TEST NODES USE ID:** `TEST-NODE-001`

### 1. The Paragon (Ideal Alignment)
*   **Scenario**: Consistent check-ins, high anchor completion, high energy.
*   **File**: `test-paragon.json`.
*   **Observation**: High authenticity scores and stable trajectory.

### 2. The Ghost Achievement (Identity Inflation)
*   **Scenario**: The user writes productive-sounding notes but logs **0 minutes** of time while checking all anchors.
*   **File**: `test-ghost.json`.
*   **Observation**: Triggers a **CRITICAL VIOLATION** diagnostic. The system flags the narrative as fraudulent.

### 3. The Effort Paradox (Busy Work)
*   **Scenario**: User logs max time (180m) but completes **0 behavioral anchors**.
*   **File**: `test-busywork.json`.
*   **Observation**: Status: `DRIFTING`. High effort with zero behavioral manifestation.

### 4. Operational Stagnation
*   **Scenario**: Low energy, minimal time (15m), and low engagement.
*   **File**: `test-stagnation.json`.
*   **Observation**: Status: `UNSTABLE`. The trajectory plot will show a downward trend.

### 5. Identity Renewal
*   **Scenario**: A node that has reached its 30-day expiration.
*   **File**: `test-renewal.json`.
*   **Observation**: The app forces the **Cycle Complete** screen, enabling tests of the recommitment/reset logic.

---
*N.O.A.H — Observation is the first step to alignment.*