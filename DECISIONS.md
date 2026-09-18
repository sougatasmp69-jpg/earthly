# Earthly — Carbon Footprint Tracker Architecture & Product Decision Log (`DECISIONS.md`)

This document records the design choices, enforcement rules, and behavioral psychology principles implemented in **Earthly**, a web platform for logging daily activities, calculating CO₂ emissions via fixed conversion factors, and monitoring personal progress against weekly carbon budgets.

---

## 🌍 Fixed Emission Factors Reference Table (Hardcoded Constants)

| Activity Category | Fixed Factor | Unit | Rationale / Reference Standard |
| :--- | :--- | :--- | :--- |
| **Car travel** | `0.20 kg CO₂ / km` | km | Average single-occupancy petrol/diesel passenger car. |
| **Bus travel** | `0.08 kg CO₂ / km` | km | Average urban transit bus per passenger-km. |
| **Flight** | `0.25 kg CO₂ / km` | km | Standard short/medium-haul commercial air travel including radiative forcing. |
| **Electricity** | `0.80 kg CO₂ / kWh` | kWh | Standard grid electricity emission intensity. |
| **Veg meal** | `0.50 kg CO₂ / meal` | meal | Plant-based ingredients, low transport and agricultural footprint. |
| **Non-veg meal** | `2.00 kg CO₂ / meal` | meal | Meat/dairy intensive meal factoring livestock methane & feed conversion. |

---

## DP1 · Over-Target Nudging: Empowering, Multi-Tiered Behavioral Psychology

### Product Question
*How does the app respond when a user approaches or exceeds their weekly CO₂ target, and what tone should be adopted?*

### Implementation & User Experience
Earthly implements a **three-tier progressive nudge system** that provides contextual feedback based on both total percentage consumed and day-of-week pacing:

1. **🟢 Green Tier (<80% of Target — On Track)**:
   - *Message*: Positive reinforcement confirming that the user is within their budget.
   - *Educational Habit Tip*: Highlighting high-leverage micro-actions (e.g. *"Every plant-based meal saves ~1.5 kg CO₂ vs poultry/beef"*).
2. **🟡 Amber Tier (80% – 99% of Target — Early Caution Warning)**:
   - *Trigger*: Reaching 80% of weekly target with multiple days remaining in the week.
   - *Message*: Informs the user of their remaining buffer (e.g. *"You've used 85% of your target with 7.5 kg CO₂ left for 3 days"*).
   - *Actionable Suggestion*: Nudges toward immediate lower-carbon swaps (e.g. choosing public transit or plant-based dinners for the rest of the week).
3. **🔴 Red Tier (100%+ of Target — Target Exceeded)**:
   - *Trigger*: Crossing 100% of the weekly carbon budget.
   - *Banner & Visual Cues*: Soft coral alert displaying the exact overage in kg CO₂ alongside the day of the week.
   - *Constructive Offset Recommendations*: Immediately presents tangible mitigation options:
     - *"Swap your next 2 meals to plant-based (saves ~3.0 kg CO₂)"*
     - *"Combine car errands into a single trip or take public transit"*
     - *"Unplug idle appliances and minimize peak heating/AC"*

### Tone Justification: Non-Punitive vs. Guilt-Driven
- **The Pitfall of Climate Guilt**: Extensive behavioral economics and climate psychology studies demonstrate that guilt-inducing or punitive user interfaces trigger *cognitive avoidance*, defensiveness, and application abandonment. When users feel judged, they simply stop logging their data.
- **The Power of Constructive Self-Efficacy**: Earthly deliberately adopts an **encouraging, objective, and solution-focused tone**. Carbon tracking is treated like personal fitness or budgeting: exceeding a target is treated as a neutral data point with straightforward, actionable pathways to recover.

---

## DP2 · Absurd Input Handling: Two-Tiered Validation Guardrails

### Product Question
*How does the app handle unrealistic, accidental, or invalid numerical inputs (e.g. 50,000 km in a day, negative numbers, non-numeric values, or 999,999 kWh)?*

### Policy Chosen & Enforced: **Two-Tiered Hybrid Validation (Hard Blocks + Soft Confirmation Flags)**

```
Input Value
   │
   ├── Is <= 0 or Non-Numeric? ────────────► [ HARD BLOCK: Rejected with immediate inline error ]
   │
   ├── Exceeds Physical Daily Maximum? ─────► [ HARD BLOCK: Exceeds plausible 24h physical limit ]
   │    (e.g., Car > 2,500 km, Flight > 25,000 km, Electricity > 2,000 kWh, Meals > 15)
   │
   ├── Exceeds Typical Daily Baseline? ────► [ SOFT WARNING: Flagged banner with user confirmation ]
   │    (e.g., Car > 350 km, Flight > 4,000 km, Electricity > 60 kWh, Meals > 5)
   │
   └── Within Standard Range ──────────────► [ ACCEPTED: Instant emission calculation ]
```

### Bounds & Thresholds by Category
| Category | Soft Warning Threshold | Hard Block Maximum | Justification |
| :--- | :--- | :--- | :--- |
| **Car travel** | `> 350 km` | `> 2,500 km` | 350 km is an unusually long daily commute; 2,500 km is the absolute physical driving limit in 24 hours. |
| **Bus travel** | `> 200 km` | `> 1,500 km` | Long-distance intercity coach travel capped at plausible vehicle transit speed. |
| **Flight** | `> 4,000 km` | `> 25,000 km` | 4,000 km indicates transcontinental travel; 25,000 km exceeds half the Earth's circumference in a single leg. |
| **Electricity** | `> 60 kWh` | `> 2,000 kWh` | 60 kWh is ~4x US average daily household use; 2,000 kWh indicates commercial-scale consumption. |
| **Veg meal** | `> 5 meals` | `> 15 meals` | 5 meals prompts review; >15 exceeds human daily consumption capacity. |
| **Non-veg meal** | `> 5 meals` | `> 15 meals` | Prevents entering bulk event catering as a single personal entry. |

### Product Reasoning & Tradeoffs
- **Why Not Hard-Cap Low?**: Setting strict hard caps at low numbers (e.g. max 100 km) blocks legitimate edge cases like cross-country road trips or international relocation flights.
- **Why Not Accept Everything?**: Pure unvalidated input allows typographical slips (e.g. typing `50000` instead of `50`) to permanently distort weekly targets and historical charts.
- **The Two-Tiered Advantage**: Hard blocks protect the system against garbage data, while soft warnings catch accidental keystrokes without frustrating users with legitimate high-usage days.

---

## DP3 · Week Definition: Standard ISO Monday–Sunday with Daily Pacing Benchmark

### Product Question
*How is a tracking week defined and represented on the dashboard (Monday–Sunday vs. Rolling 7 Days)?*

### Policy Chosen & Enforced: **Fixed ISO Monday–Sunday Weekly Cycle with Mid-Week Pacing**

### Implementation Details
1. **Fixed Monday–Sunday Calendar Boundaries**:
   - The tracking week begins Monday at 00:00:00 and concludes Sunday at 23:59:59.
2. **"Day X of 7" Mid-Week Representation**:
   - The dashboard displays the current day index (e.g. *"Day 4 of 7 · Thursday"*).
3. **Daily Pacing Metric ($Expected = Target \times \frac{\text{Day}}{7}$)**:
   - The dashboard computes whether the user's current cumulative emissions are ahead of or behind their expected linear pacing for that day of the week.
   - *Example*: With a 50 kg target on Day 3 (Wednesday), expected pacing is $\frac{50 \times 3}{7} = 21.4\text{ kg}$. If the user has emitted 18 kg, they are $+3.4\text{ kg}$ ahead of pace.
4. **7-Day Distribution Bar Chart**:
   - A dedicated Mon–Sun chart visualizes day-by-day emission spikes across the week.

### Tradeoffs Considered
| Model | Pros | Cons / Tradeoffs | Decision |
| :--- | :--- | :--- | :--- |
| **Rolling 7-Day Window** | Always shows exactly 7 days of recent history. | Moving baseline creates disorientation; yesterday's progress changes unpredictably as old entries drop off the trailing window. | ❌ Rejected |
| **Fixed Monday–Sunday Week** *(Earthly Choice)* | Aligns with mental models of weekly routines, grocery shopping, commute schedules, and targets. | Early in the week (Monday) has fewer data points. | ✅ **Implemented** |

### Why This Matches Human Habit Formation
People plan their lives in weekly rhythms (weekdays vs. weekends). A fixed Monday–Sunday schedule gives users a clear clean-slate reset every Monday morning, fostering long-term motivation and predictable habit tracking.

---

## Summary Table

| Decision Point | Chosen Solution | User Impact |
| :--- | :--- | :--- |
| **DP1 · Nudges** | 3-Tier Nudge System (<80% / 80-99% / 100%+) with encouraging, actionable tips. | Eliminates climate guilt; promotes tangible mitigation actions. |
| **DP2 · Inputs** | Two-Tiered Validation (Hard blocks for impossible values + Soft warnings for high spikes). | Prevents typo distortions while accommodating genuine long-distance trips. |
| **DP3 · Week** | Fixed Monday–Sunday week with "Day X of 7" daily pacing benchmark. | Aligns with natural weekly lifestyle planning and clean-slate resets. |
