# Project Specification: Interactive Sustainable AI Query Tracker & Educational Experience

## 1. Role & Creative Direction for Claude
You are tasked with designing and building an interactive, visually captivating web application that educates everyday users on the hidden environmental footprint (Energy, Water, and Carbon) of their AI queries, while giving them a real-time "Environmental Receipt" and actionable ways to reduce their impact.

### Visual & Pedagogical Aesthetic (3Blue1Brown / Explorable Explanations Style)
* **Visual Storytelling First:** Inspired by Grant Sanderson’s *3Blue1Brown* and Nicky Case’s *Explorable Explanations*, do not just present a dry dashboard of static tables. Use smooth vector animations, interactive mathematical intuition, dynamic flow diagrams, and scrollytelling to explain *how* a prompt turns into electricity, heat, evaporated cooling water, and carbon emissions.
* **Color Palette & Vibe:** Deep, rich dark-mode canvas (slate/obsidian background) with glowing mathematical accents:
  * **Energy ($e_t$):** Electric Amber / Gold
  * **Water ($\text{WUE} / \text{EWIF}$):** Cyan / Cerulean Blue (distinguishing between evaporated "Consumed" water and cycled "Withdrawn" water)
  * **Carbon ($\eta$):** Crimson / Coral vs. Emerald Green for renewable hours
* **Creative Freedom:** You have full creative autonomy over the UI layout, SVG/Canvas animations, interactive sliders, and micro-interactions. Avoid rigid, hardcoded boilerplate layouts—design an experience that makes complex data center thermodynamics and grid dynamics intuitive to a layperson.

---

## 2. Core User Journey & Interactive Modules

### Module A: The "Live Prompt to Environmental Receipt" Sandbox (No LLM API Required)
Instead of calling a live LLM API, the user types or pastes a prompt into an interactive prompt box and selects an **Expected Output Length** (e.g., Short ~100 words, Medium ~250 words, Long ~600 words) and a **Data Center Location**.
* **Real-Time Token & Phase Breakdown:** As the user types, dynamically count words/tokens. Visually animate the two distinct physical phases of LLM inference (from *Stojkovic et al. / Li et al., 2025*):
  1. **Prompt Phase (CPU/Compute-Intensive):** Processing the user's input words.
  2. **Token Phase (Memory-Intensive):** Generating the output words sequentially.
* **The Environmental Receipt:** Display both **Exact Scientific Metrics** (Wh, mL of water, $\text{gCO}_2\text{e}$) and **Relatable Everyday Equivalents** (e.g., *"% of a 500mL plastic water bottle evaporated"*, *"drops of water"*, *"seconds of an LED lightbulb"*, or *"smartphone battery %"*).
* **Interactive Toggles on the Receipt:**
  * **Water Mode Toggle:** Switch between **Water Consumption** (water permanently evaporated into the air) and **Water Withdrawal** (total freshwater pumped from rivers/lakes, including water discharged back).
  * **Idle Server Overhead Toggle:** Let the user toggle between *Active Query Energy Only* vs. *Real-World Data Center Utilization* (showing how low GPU utilization and idle power inflate the true footprint).

### Module B: 3Blue1Brown-Style Visual Explainer ("Why Does AI Drink Water?")
Create an interactive, animated diagram showing the two scopes of AI water and carbon usage (*Li et al., 2025* & *Xiao et al., 2025*):
* **Scope 1 (On-Site Data Center Cooling):** Show server racks generating heat $\rightarrow$ transferred via server-level liquid/air cooling $\rightarrow$ rejected at the facility level via **Cooling Towers** or **Air Economizers**. Animate how hotter outside temperatures or high humidity force cooling towers to evaporate more potable freshwater ($\text{WUE}$).
* **Scope 2 (Off-Site Power Plant Generation):** Show the power lines leading back to thermoelectric power plants (Coal, Natural Gas, Nuclear) and Hydropower dams. Highlight the counterintuitive insight from *Xiao et al. (2025)*: **71% of AI's water footprint is actually Scope 2 (off-site electricity generation), while 29% is Scope 1 (on-site cooling).**

### Module C: Spatiotemporal Optimizer ("Where" and "When" Recommender)
* **Live Weather API Integration (with Fallback):** Connect to a free, no-key weather API (such as `Open-Meteo API`: `https://api.open-meteo.com/v1/forecast`) for the selected data center's coordinates to fetch current ambient temperature and relative humidity. Use this live weather data to dynamically modulate the real-time On-Site $\text{WUE}$ ($\rho_{s1,t}$), showing the user how a hot afternoon spikes cooling water evaporation compared to a cool midnight!
* **The "Follow the Sun" vs. "Unfollow the Sun" Conflict Slider (*Li et al., 2025*):**
  * Provide an interactive 24-hour timeline and a **Priority Weight Slider** ($\lambda_{\text{carbon}}$ vs. $\lambda_{\text{water}}$).
  * Visually demonstrate the fundamental conflict: **Midday ("Follow the Sun")** has high solar energy (low carbon), but high outside temperatures (high cooling water evaporation). **Midnight ("Unfollow the Sun")** has cooler air (low water evaporation), but relies more on fossil-fuel baseload power (higher carbon).
* **The Hydropower Paradox Alert (*Xiao et al., 2025*):** When a user selects a region heavy in hydroelectricity (like Washington State, Oregon, or California), trigger an visual insight showing that while carbon emissions drop near zero, **Scope-2 water evaporation skyrockets** due to reservoir evaporation.
* **Google CICS "Flexible Batch Queue" Simulator (*Radovanović et al., 2023*):**
  * Allow the user to mark their query as **"Urgent (Run Now - Inflexible)"** or **"Eco-Queue (Delay up to 24h - Flexible)"**.
  * Animate a **Virtual Capacity Curve (VCC)** that caps data center compute during dirty/hot peak hours and shifts the user's flexible query to the optimal green/cool window, displaying the exact % of water and carbon saved.

### Module D: Infrastructure "What-If" Lab (*Xiao et al., 2025*)
Allow curious users to toggle data center engineering upgrades to see how industry best practices shrink the receipt:
* **Advanced Liquid Cooling (ALC) / Immersion Cooling**
* **Server Utilization Optimization (SUO)**
* **Best-Practice PUE/WUE Thermodynamics**

---

## 3. Scientific Formulas & Mathematical Models (From the Papers)

Use these exact peer-reviewed formulations to power the calculations in your code.

### 1. Token-to-Energy Scaling ($e_t$)
In *Li et al. (2025)* and *Stojkovic et al. (2025)*, the baseline inference energy $E_{\text{base}}$ is measured for a **medium-sized conversation request** defined as:
* Baseline Input ($W_{\text{in, base}}$): $\approx 800\text{ words}$ ($\sim 1,060\text{ tokens}$)
* Baseline Output ($W_{\text{out, base}}$): $\approx 225\text{ words}$ (midpoint of $150\text{--}300\text{ words}$, $\sim 300\text{ tokens}$)

Because the **Token Generation Phase** (autoregressive decoding) is memory-bandwidth bound and consumes significantly more energy per word than the parallelized **Prompt Processing Phase** (prefill), scale energy $e_t$ (in $\text{kWh}$) dynamically based on the user's actual input words ($W_{\text{in}}$) and expected output words ($W_{\text{out}}$):
$$e_t = E_{\text{base}} \cdot \left( 0.30 \cdot \frac{W_{\text{in}}}{800} + 0.70 \cdot \frac{W_{\text{out}}}{225} \right)$$
*(Note: You may also let the user toggle "Include Idle Server Power Penalty" from Xiao et al., 2025, where server power follows $P_{\text{server}} = (P_{\text{max}} - P_{\text{idle}})u + P_{\text{idle}}$, with $P_{\text{idle}} = 0.23 P_{\text{rated}}$, $P_{\text{max}} = 0.88 P_{\text{rated}}$, and average inference utilization $u = u_{\text{active}} \times r_{\text{active}} = 0.50 \times 0.50 = 0.25$ vs. training utilization $u = 0.80 \times 0.90 = 0.72$).*

### 2. Operational Water Footprint ($\text{Water}_{\text{Operational}}$)
From *Li et al. (2025)* Section 3.1, total operational water at time $t$ is the sum of **Scope-1 On-Site Cooling Water** and **Scope-2 Off-Site Grid Electricity Water**:
$$\text{Water}_{\text{Operational}}(t) = e_t \cdot \left[ \rho_{s1,t} + \theta_t \cdot \rho_{s2,t} \right]$$
Where:
* $e_t$ = Server energy consumed by the query ($\text{kWh}$).
* $\theta_t$ = Data center **PUE** (Power Usage Effectiveness, ratio of total facility energy to IT server energy).
* $\rho_{s1,t}$ = **On-site WUE** (Water Usage Effectiveness in $\text{L/kWh}$). Modulate this dynamically around the region's baseline $\text{WUE}$ using live temperature/humidity from the weather API (e.g., $\rho_{s1,t}$ increases when wet-bulb temperature rises or when dry-bulb temperature exceeds $85^\circ\text{F} / 29.4^\circ\text{C}$).
* $\rho_{s2,t}$ = **Off-site EWIF** (Electricity Water Intensity Factor in $\text{L/kWh}$), calculated from the local grid's fuel mix:
  $$\rho_{s2,t} = \frac{\sum_k b_{k,t} \times \text{EWIF}_k}{\sum_k b_{k,t}}$$

#### Water Consumption vs. Water Withdrawal Multipliers:
* **Water Consumption (Default):** Evaporated water calculated using the regional $\text{WUE}$ and $\text{EWIF}$ values in the table below.
* **Water Withdrawal Toggle:**
  * For **Scope-1 (On-Site)**: In cooling towers, roughly $80\%$ of withdrawn water is evaporated (consumed), and in air cooling with evaporative assist, roughly $70\%$ is consumed (*Li et al., Section 2.2.1*). Thus, $\text{WUE}_{\text{withdrawal}} \approx 1.25 \times \text{WUE}_{\text{consumption}}$ (or use $1.2\text{ L/kWh}$ global withdrawal vs $1.0\text{ L/kWh}$ consumption benchmark).
  * For **Scope-2 (Off-Site Grid)**: The U.S. national average electricity water withdrawal is **$43.83\text{ L/kWh}$**, compared to **$3.14\text{ L/kWh}$** for consumption ($\approx 13.95\times$ higher!).

### 3. Operational Carbon Footprint ($\text{Carbon}_{\text{Operational}}$)
From *Radovanović et al. (2023)* and *Xiao et al. (2025)*:
$$\text{Carbon}_{\text{Operational}}(t) = e_t \cdot \theta_t \cdot \eta^{(c)}(t)$$
Where $\eta^{(c)}(t)$ is the regional grid carbon intensity in $\text{kgCO}_2\text{e/kWh}$ (or $\text{gCO}_2\text{e/Wh}$) at hour $t$.

### 4. Google CICS Load-Shifting Optimization (*Radovanović et al., 2023*)
Google's Carbon-Intelligent Computing System shapes cluster load by minimizing the weighted sum of carbon emissions and peak power across 24 hours while preserving total daily flexible compute ($\sum_h \delta(c,h) = 0$):
$$\min \left[ \lambda_e \text{ (Carbon Footprint)} + \lambda_p \text{ (Peak Power)} \right]$$
*(In Google's production system, internal weights are $\lambda_e = 40$ and $\lambda_p = 10$, achieving a $50\%$ drop in flexible load and $1\text{--}8\%$ total cluster power reduction during peak carbon hours).* For our individual user dashboard, adapt this into a **Carbon-Water Trade-off Optimizer** that finds the optimal hour $h^* \in \{0..23\}$ minimizing:
$$\text{Cost}(h) = w_{\text{carbon}} \cdot \frac{\text{Carbon}(h)}{\text{Carbon}_{\text{avg}}} + w_{\text{water}} \cdot \frac{\text{Water}(h)}{\text{Water}_{\text{avg}}}$$

---

## 4. Verified Datasets from the Research Papers

Embed these structured datasets as clean, extensible JSON/configuration modules so your visuals and calculators use authentic figures from the papers.

### Dataset 1: AI Models with Verified Energy Data (*Li et al., 2025* & *Stojkovic et al., 2025*)
Only include models whose empirical or official baselines are cited in the papers:

| Model Name | Parameters | Hardware / Context Cited in Paper | Server Energy per Medium Query ($E_{\text{base}}$) | Notes for UI Tooltip |
| :--- | :--- | :--- | :--- | :--- |
| **GPT-3 (Full)** | 175B | Microsoft Azure Data Centers (OpenAI estimate) | **$0.004\text{ kWh}$** ($4\text{ Wh}$) | Conservative baseline; training consumed $1,287\text{ MWh}$ and $5.439\text{ million L}$ of water (U.S. Avg). |
| **Llama-3-70B** | 70B | Enterprise Nvidia DGX H100 cluster (with SLOs & non-GPU overhead) | **$0.010\text{ kWh}$** ($10\text{ Wh}$) | Includes prompt + token phases and full server non-GPU energy overhead under real-world response-time SLOs. |
| **Falcon-180B** | 180B | Enterprise Nvidia DGX H100 cluster (comparable size to GPT-3-175B) | **$0.016\text{ kWh}$** ($16\text{ Wh}$) | Full server energy measurement under enterprise inference workloads. |
| **High-Efficiency Architecture (e.g., DeepSeek scenario)** | MoE / Distilled | *Xiao et al. (2025)* Low-Power / High-Application Scenario | **$\sim 0.002\text{ kWh}$** ($2\text{ Wh}$) | Demonstrates hardware/algorithmic efficiency gains—**Warning:** Prone to the "Rebound Effect" (users run more queries when cost/energy per query drops). |

---

### Dataset 2: Regional Data Center Profiles (*Li et al., 2025 - Table 1* & *Xiao et al., 2025*)
This table contains the exact PUE ($\theta$), On-Site WUE ($\rho_{s1}$), Off-Site Grid EWIF ($\rho_{s2}$), and GPT-3 per-request water footprints across **18 Microsoft Data Center Locations** from *Li et al. (2025)*, paired with regional grid carbon/scarcity insights from *Xiao et al. (2025)*:

| Location | Coordinates (for Weather API) | PUE ($\theta$) | On-Site WUE ($\text{L/kWh}$) | Off-Site EWIF ($\text{L/kWh}$) | GPT-3 On-Site Water (mL/query) | GPT-3 Off-Site Water (mL/query) | GPT-3 Total Water (mL/query) | Queries per 500mL Bottle (GPT-3) | Grid & Sustainability Profile (*Xiao et al. / Li et al.*) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **U.S. Average** | `39.8, -98.5` | 1.170 | 0.550 | 3.142 | 2.200 | 14.704 | 16.904 | 29.6 | Baseline U.S. grid (~$0.38\text{ kgCO}_2\text{e/kWh}$) |
| **Arizona** | `33.4, -112.0` | 1.180 | 1.630 | 4.959 | 6.520 | 23.406 | 29.926 | 16.7 | **High Water Stress:** Hot arid climate spikes cooling WUE (up to $9\text{ L/kWh}$ in summer peak) + hydro/thermal mix. |
| **Georgia** | `33.7, -84.3` | 1.120 | 0.060 | 2.309 | 0.240 | 10.345 | 10.585 | 47.2 | Low on-site cooling water; sensitive to grid renewable pace. |
| **Illinois** | `41.8, -87.6` | 1.350 | 0.740 | 2.233 | 2.960 | 12.060 | 15.020 | 33.3 | Higher PUE overhead (1.35). |
| **Iowa** | `41.5, -93.6` | 1.160 | 0.140 | 3.104 | 0.560 | 14.403 | 14.963 | 33.4 | Major wind-rich Midwest hub. |
| **Texas** | `30.2, -97.7` | 1.280 | 0.250 | 1.287 | 1.000 | 6.590 | 7.590 | 65.9 | **Optimal Combined Hub (*Xiao et al.*):** High wind/solar potential + very low off-site EWIF ($1.287\text{ L/kWh}$). |
| **Virginia** | `39.0, -77.4` | 1.140 | 0.140 | 2.385 | 0.560 | 10.875 | 11.435 | 43.7 | **Largest US Data Center Hub (~25% of US capacity):** Weak correlation ($r=0.06$) between hourly carbon and water efficiency. |
| **Washington** | `47.2, -120.0` | 1.150 | 0.950 | 9.501 | 3.800 | 43.706 | 47.506 | 10.5 | **The Hydropower Paradox:** Very low carbon, but highest water footprint ($47.5\text{ mL}$/query) due to hydro reservoir evaporation. |
| **Wyoming** | `41.1, -104.8` | 1.110 | 0.130 | 2.574 | 0.520 | 11.429 | 11.949 | 41.8 | Cool climate enables low PUE (1.11) and low on-site WUE. |
| **Australia** | `-33.8, 151.2` | 1.120 | 0.012 | 4.259 | 0.048 | 19.078 | 19.126 | 26.1 | Ultra-low on-site WUE, high off-site grid water intensity. |
| **Denmark** | `55.6, 12.5` | 1.160 | 0.010 | 3.180 | 0.040 | 14.754 | 14.794 | 33.8 | Cool Nordic climate; minimal on-site evaporation. |
| **Finland** | `60.1, 24.9` | 1.120 | 0.010 | 4.542 | 0.040 | 20.350 | 20.390 | 24.5 | Free outside air cooling nearly year-round ($\text{WUE} = 0.01$). |
| **India** | `19.0, 72.8` | 1.430 | 0.000 | 3.445 | 0.000 | 19.704 | 19.704 | 25.4 | **Dry Cooler Trade-off:** $0.000\text{ L/kWh}$ on-site water, but highest PUE ($1.430$), increasing electricity & Scope-2 impact. |
| **Indonesia** | `-6.2, 106.8` | 1.320 | 1.900 | 2.271 | 7.600 | 11.992 | 19.592 | 25.5 | Tropical heat/humidity drives the highest on-site WUE ($1.90\text{ L/kWh}$). |
| **Ireland** | `53.3, -6.2` | 1.190 | 0.020 | 1.476 | 0.080 | 7.027 | 7.107 | **70.4** | **Most Water-Efficient Global Hub:** Cool air cooling + wind-heavy grid yields 70.4 queries per 500mL bottle. |
| **Mexico** | `20.6, -100.3` | 1.120 | 0.056 | 5.300 | 0.224 | 23.742 | 23.966 | 20.9 | High off-site grid water intensity ($5.30\text{ L/kWh}$). |
| **Netherlands** | `52.3, 4.9` | 1.140 | 0.060 | 3.445 | 0.240 | 15.708 | 15.948 | 31.4 | Temperate European hub. |
| **Sweden** | `59.3, 18.0` | 1.160 | 0.090 | 6.019 | 0.360 | 27.927 | 28.287 | 17.7 | Low carbon (hydro/nuclear), but high off-site EWIF ($6.019\text{ L/kWh}$). |

#### Additional Regional Insights from *Xiao et al. (2025)* to Feature in the Recommender:
* **Optimal U.S. Siting Candidates (Low Carbon + Low Water + Low Scarcity):** **Texas, Montana, Nebraska, and South Dakota** (Midwestern/Southern wind & solar belt). Deploying servers in the top 25% combined locations cuts water footprints by **52%** and carbon emissions by **49%**.
* **Severe Water Scarcity States to Flag:** California, Nevada, Arizona, Utah, Washington, New Mexico, Colorado, Wyoming, Oregon, and Montana.

---

### Dataset 3: Mitigation & Reduction Multipliers (*Xiao et al., 2025 - Fig. 2 & Fig. 5*)
Use these exact percentage impacts when the user toggles infrastructure or scheduling optimizations in the UI:

1. **Best-Practice PUE Optimization** (extending free cooling via air set-point adjustments):
   * Reduces Infrastructure Energy by **67.9%**
   * Reduces Total Energy & Carbon Emissions by **7.4%**
   * Reduces Direct Water by **9.3%** and Indirect Water by **7.5%**
2. **Best-Practice WUE Optimization** (reducing windage/concentration loss, air-side economizers):
   * Reduces Direct (Scope-1) Water by **85.7%**
   * Reduces Total Water Footprint by **29.6%**
   * Reduces Carbon Emissions by **6.7%**
3. **Advanced Liquid Cooling (ALC / Immersion Cooling) Adoption:**
   * Reduces Energy by **1.7%**, Total Water by **2.4%**, and Carbon by **1.6%**.
4. **Server Utilization Optimization (SUO - raising active GPU ratio):**
   * Reduces Energy, Water, and Carbon footprints by **5.5%** across the board (whereas frozen utilization practices increase footprints by **+7.3%**).
5. **Combined Best Practices (Industry Efficiency + Optimal Spatial Location + Low-Cost Renewable Grid LRC):**
   * Cuts total carbon emissions by **73%** and total water footprint by **86%**.

---

## 5. Macro Context Facts (For Scrollytelling / Educational Callouts)
Sprinkle these verified facts from the papers into your interactive animations to give users perspective on why their individual queries matter at scale:
* **Training GPT-3** in U.S. data centers evaporated **700,000 liters** of clean on-site freshwater and consumed **5.4 million liters** in total (*Li et al., 2025*).
* By **2027**, global AI water withdrawal is projected to reach **4.2–6.6 billion cubic meters**—more than the total annual water withdrawal of **4–6 Denmarks** or **half of the United Kingdom** (*Li et al., 2025*).
* In the U.S. alone between **2024 and 2030**, AI servers will generate an annual water footprint of **731 to 1,125 million $\text{m}^3$** and **24 to 44 $\text{MtCO}_2\text{e}$** (*Xiao et al., 2025*).
* **Potable Water:** Nearly **80%** of on-site water withdrawn by major data centers is potable (drinking-quality) water to prevent pipe clogs and bacterial growth (*Li et al., 2025*).
* **The India Dry-Cooler Example:** India's Microsoft data center uses $0.000\text{ L/kWh}$ of on-site water (dry cooling), but its PUE jumps to $1.430$, showing how saving on-site water can increase energy usage and off-site Scope-2 water/carbon (*Li et al., 2025*).