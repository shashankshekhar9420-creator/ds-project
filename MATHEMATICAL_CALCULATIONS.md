# Mathematical Formulations and Calculations Behind the AI Environmental Footprint Simulator

This document provides a comprehensive, publication-grade reference of all mathematical formulas, thermodynamic models, empirical derivations, conversion factors, and algorithmic calculations implemented in the **AI Water & Energy Footprint Simulator**.

All calculations are derived from peer-reviewed scientific literature, notably **Li et al. (CACM 2025)**, **Xiao et al. (Nature Sustainability 2025)**, **Radovanović et al. (Google Research / IEEE 2023)**, **Stojkovic et al. (ASPLOS / IEEE Micro 2025)**, and **Stull (2011)**.

---

## Table of Contents

1. [Nomenclature, Symbols, and Unit Standards](#1-nomenclature-symbols-and-unit-standards)
2. [Tokenization and Word-to-Token Mechanics](#2-tokenization-and-word-to-token-mechanics)
3. [LLM Inference Physics & Dynamic Energy Scaling ($e_t$)](#3-llm-inference-physics--dynamic-energy-scaling-e_t)
4. [Server Idle Power Penalty & Utilization Curve](#4-server-idle-power-penalty--utilization-curve)
5. [Facility Power Usage Effectiveness (PUE) & Total Infrastructure Energy](#5-facility-power-usage-effectiveness-pue--total-infrastructure-energy)
6. [Psychrometric Thermodynamics & Wet-Bulb Temperature Modeling](#6-psychrometric-thermodynamics--wet-bulb-temperature-modeling)
7. [Weather-Modulated On-Site WUE ($\rho_{s1,t}$)](#7-weather-modulated-on-site-wue-rho_s1t)
8. [Dual-Scope Operational Water Footprint Model](#8-dual-scope-operational-water-footprint-model)
9. [Water Accounting: Consumption vs. Water Withdrawal](#9-water-accounting-consumption-vs-water-withdrawal)
10. [Operational Carbon Footprint Formulation](#10-operational-carbon-footprint-formulation)
11. [Everyday Tangible Metric Equivalents](#11-everyday-tangible-metric-equivalents)
12. [Infrastructure Engineering Mitigations Matrix](#12-infrastructure-engineering-mitigations-matrix)
13. [Google CICS 24-Hour Diurnal Schedulability & Load Shifting](#13-google-cics-24-hour-diurnal-schedulability--load-shifting)
14. [Diffusion Image and Video Generation Physics & Analytical Scaling Laws](#14-diffusion-image-and-video-generation-physics--analytical-scaling-laws)
15. [Global Multi-Campus Recommender & Composite Eco-Score](#15-global-multi-campus-recommender--composite-eco-score)
16. [Algorithmic Model Optimizer & The Jevons Rebound Paradox](#16-algorithmic-model-optimizer--the-jevons-rebound-paradox)
17. [Empirical Data Matrix: 18 Hyperscale Data Centers](#17-empirical-data-matrix-18-hyperscale-data-centers)
18. [Comprehensive End-to-End Worked Numerical Examples](#18-comprehensive-end-to-end-worked-numerical-examples)
19. [Academic Bibliography & Primary Sources](#19-academic-bibliography--primary-sources)

---

## 1. Nomenclature, Symbols, and Unit Standards

### Latin Symbols
| Symbol | Meaning | Default / Benchmark Unit |
| :--- | :--- | :--- |
| $W_{\text{in}}$ | Number of input words in the user prompt | $\text{words}$ |
| $W_{\text{out}}$ | Number of expected generated words | $\text{words}$ |
| $T_{\text{in}}, T_{\text{out}}$ | Input and output token counts | $\text{tokens}$ |
| $E_{\text{base}}$ | Baseline server energy for a standard reference query | $\text{kWh}$ (or $\text{Wh}$) |
| $e_t$ | Dynamic IT server electricity consumed by the query | $\text{kWh}$ |
| $E_{\text{facility}}$ | Total facility electricity including data center overhead | $\text{kWh}$ |
| $P_{\text{server}}$ | Instantaneous server power draw | $\text{kW}$ (or $\text{W}$) |
| $P_{\text{max}}$ | Peak server power at 100% utilization | $\text{kW}$ |
| $P_{\text{idle}}$ | Standby idle server power at 0% utilization | $\text{kW}$ |
| $P_{\text{rated}}$ | Rated nameplate power capacity of the server | $\text{kW}$ |
| $u$ | Effective average server utilization factor | dimensionless ($[0, 1]$) |
| $T_{\text{db}}$ | Dry-bulb ambient air temperature | $^\circ\text{C}$ |
| $T_{\text{wb}}$ | Wet-bulb ambient air temperature | $^\circ\text{C}$ |
| $\text{RH}$ | Relative humidity of ambient air | $\%$ ($[0, 100]$) |
| $W_{\text{Operational}}$ | Total operational water footprint | $\text{L}$ (or $\text{mL}$) |
| $W_{\text{Scope 1}}$ | Direct on-site cooling tower water footprint | $\text{L}$ (or $\text{mL}$) |
| $W_{\text{Scope 2}}$ | Indirect off-site power generation water footprint | $\text{L}$ (or $\text{mL}$) |
| $C_{\text{Operational}}$ | Total operational greenhouse gas emissions | $\text{kgCO}_2\text{e}$ (or $\text{gCO}_2\text{e}$) |
| $S(h)$ | Relative solar photovoltaic generation at hour $h$ | $\%$ ($[0, 100]$) |
| $\text{Cost}(h)$ | Google CICS composite environmental trade-off score | dimensionless |

### Greek Symbols
| Symbol | Meaning | Standard Unit |
| :--- | :--- | :--- |
| $\theta_t$ | Power Usage Effectiveness (PUE) at time $t$ | dimensionless ($\ge 1.0$) |
| $\rho_{s1,t}$ | On-site Water Usage Effectiveness (WUE) at time $t$ | $\text{L/kWh}$ |
| $\rho_{s2,t}$ | Off-site Electricity Water Intensity Factor (EWIF) at time $t$ | $\text{L/kWh}$ |
| $\eta^{(c)}(t)$ | Grid marginal or average carbon intensity | $\text{kgCO}_2\text{e/kWh}$ |
| $\lambda_e, \lambda_p$ | Google CICS carbon and peak power objective weights | dimensionless |
| $w_{\text{carbon}}, w_{\text{water}}$ | Normalized trade-off weights ($w_{\text{carbon}} + w_{\text{water}} = 1$) | dimensionless |
| $\Delta H_{\text{vap}}$ | Latent heat of vaporization of water at standard conditions | $\approx 2,260\text{ kJ/kg} = 2.26\text{ MJ/L}$ |

---

## 2. Tokenization and Word-to-Token Mechanics

Natural language processing models operate over subword tokens rather than raw character strings or words. In standard English conversational and academic text:

$$\text{Tokens} = \text{round}(W \times 1.333)$$

$$1\text{ Token} \approx 0.75\text{ Words}$$

### The Reference Standard Query Benchmark
From *Li et al. (2025)* and *Stojkovic et al. (2025)*, empirical hardware measurements evaluate a standardized **medium conversational request**:
* **Baseline Input Words ($W_{\text{in, base}}$):** $800\text{ words} \approx 1,064\text{ tokens}$
* **Baseline Output Words ($W_{\text{out, base}}$):** $225\text{ words} \approx 300\text{ tokens}$ (midpoint of typical $150\text{--}300$ word response window)

Safe bounds are enforced programmatically:
$$\widetilde{W}_{\text{in}} = \max(1, W_{\text{in}}), \quad \widetilde{W}_{\text{out}} = \max(1, W_{\text{out}})$$

---

## 3. LLM Inference Physics & Dynamic Energy Scaling ($e_t$)

### The Prefill vs. Autoregressive Decoding Divergence
Large language model serving is physically split into two distinct operational regimes:

1. **Phase 1: Prompt Processing / Prefill (Compute-Bound):**
   * All input tokens $W_{\text{in}}$ are ingested concurrently into GPU memory.
   * Execution is dominated by dense General Matrix Multiply (GEMM) tensor operations.
   * Tensor cores run at high arithmetic intensity (FLOPs per byte of memory transferred).
   * **Empirical Energy Contribution:** Accounts for **$30\%$** of baseline request energy.

2. **Phase 2: Token Generation / Decoding (Memory-Bandwidth Bound):**
   * Output tokens $W_{\text{out}}$ must be generated strictly autoregressively, one token at a time:
     $$y_k \sim P(y_k \mid y_{<k}, x)$$
   * For every single generated token, the full model parameter weight tensor (e.g., $175\times 10^9$ parameters $\approx 350\text{ GB}$ in FP16) must be read from High-Bandwidth Memory (HBM) into SRAM caches.
   * Arithmetic intensity is low ($\approx 1\text{ FLOP/byte}$), meaning hardware units sit stalled waiting on memory bus latencies while drawing near-peak static and leakage power.
   * **Empirical Energy Contribution:** Accounts for **$70\%$** of baseline request energy.

### Dynamic Energy Scaling Formulation
Scaling server energy consumption $e_t$ (in $\text{kWh}$) based on input words $W_{\text{in}}$ and output words $W_{\text{out}}$:

$$e_t = E_{\text{base}} \cdot \left[ 0.30 \cdot \left(\frac{W_{\text{in}}}{800}\right) + 0.70 \cdot \left(\frac{W_{\text{out}}}{225}\right) \right]$$

In energy watt-hours ($\text{Wh}$):
$$\text{Energy}_{\text{Wh}} = e_t \times 1000$$

### Dynamic Phase Energy Split
The instantaneous fractional energy consumed by each phase is:

$$\Phi_{\text{prompt}} = \frac{0.30 \cdot \left(\frac{W_{\text{in}}}{800}\right)}{0.30 \cdot \left(\frac{W_{\text{in}}}{800}\right) + 0.70 \cdot \left(\frac{W_{\text{out}}}{225}\right)}$$

$$\Phi_{\text{token}} = \frac{0.70 \cdot \left(\frac{W_{\text{out}}}{225}\right)}{0.30 \cdot \left(\frac{W_{\text{in}}}{800}\right) + 0.70 \cdot \left(\frac{W_{\text{out}}}{225}\right)} = 1 - \Phi_{\text{prompt}}$$

### Baseline Hardware Model Energies ($E_{\text{base}}$)
Derived from empirical testbeds under strict Service Level Objectives (SLOs) (*Li et al., 2025; Stojkovic et al., 2025; Xiao et al., 2025*):

| Model Name | Parameters | Hardware Environment | $E_{\text{base}}$ per Query | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **GPT-3 (Full)** | 175B Dense | Microsoft Azure DGX / A100 | $0.0040\text{ kWh}$ ($4.0\text{ Wh}$) | Conservative baseline; training used $1,287\text{ MWh}$ |
| **Llama-3-70B** | 70B Dense | Enterprise Nvidia DGX H100 cluster | $0.0100\text{ kWh}$ ($10.0\text{ Wh}$) | Full server non-GPU energy included under enterprise SLOs |
| **Falcon-180B** | 180B Dense | Enterprise Nvidia DGX H100 cluster | $0.0160\text{ kWh}$ ($16.0\text{ Wh}$) | Full enterprise multi-tenant server measurement |
| **MoE / Distilled** | MoE / Sparse | Xiao et al. Low-Power Scenario | $0.0020\text{ kWh}$ ($2.0\text{ Wh}$) | High algorithmic efficiency; prone to Rebound Effect |

---

## 4. Server Idle Power Penalty & Utilization Curve

In production hyperscale data centers, servers cannot spin down to zero power between user queries due to long model loading latencies ($>2\text{--}5\text{ minutes}$ to transfer hundreds of gigabytes into GPU HBM).

### Affine Server Power Model
From *Xiao et al. (2025)*, server power follows an affine utilization function:

$$P_{\text{server}}(u) = (P_{\text{max}} - P_{\text{idle}}) \cdot u + P_{\text{idle}}$$

Where:
* $P_{\text{rated}}$: Server nameplate rated power.
* $P_{\text{idle}} = 0.23 \cdot P_{\text{rated}}$ (enterprise standby power floor).
* $P_{\text{max}} = 0.88 \cdot P_{\text{rated}}$ (peak saturated power under full compute load).
* $u$: Average production inference utilization factor.

### Average Utilization Breakdown
Inference workloads experience high diurnal peak-to-trough variability:
$$u = u_{\text{active}} \times r_{\text{active}} = 0.50 \times 0.50 = 0.25$$
Where $u_{\text{active}} = 0.50$ is active GPU compute intensity and $r_{\text{active}} = 0.50$ is temporal duty cycle. (Contrast with training workloads where $u = 0.80 \times 0.90 = 0.72$).

### Mathematical Derivation of the Idle Penalty Multiplier ($\kappa_{\text{idle}}$)
1. **Average Server Operating Power:**
   $$P_{\text{avg}} = (0.88 - 0.23) \cdot P_{\text{rated}} \cdot 0.25 + 0.23 \cdot P_{\text{rated}} = 0.65 \cdot 0.25 \cdot P_{\text{rated}} + 0.23 \cdot P_{\text{rated}} = 0.1625 \cdot P_{\text{rated}} + 0.23 \cdot P_{\text{rated}} = 0.3925 \cdot P_{\text{rated}}$$

2. **Active Workload Power (without idle overhead):**
   $$P_{\text{work}} = (P_{\text{max}} - P_{\text{idle}}) \cdot u = 0.65 \cdot 0.25 \cdot P_{\text{rated}} = 0.1625 \cdot P_{\text{rated}}$$

3. **Penalty Factor:**
   $$\kappa_{\text{idle}} = \frac{P_{\text{avg}}}{P_{\text{work}}} = \frac{0.3925 \cdot P_{\text{rated}}}{0.1625 \cdot P_{\text{rated}}} = \frac{0.3925}{0.1625} \approx 2.41538... \approx 2.415$$

When the user activates **Include Idle Server Overhead**:
$$e_t^{\text{idle}} = e_t \times 2.415$$

---

## 5. Facility Power Usage Effectiveness (PUE) & Total Infrastructure Energy

Server compute energy $e_t$ accounts only for direct IT equipment. Total data center energy includes facility cooling systems, transformers, uninterrupted power supplies (UPS), and airflow distribution fans.

### PUE Definition
$$\text{PUE} = \theta_t = \frac{E_{\text{Total Facility}}}{E_{\text{IT Equipment}}} = \frac{P_{\text{facility}}}{P_{\text{IT}}}$$

$$\theta_t \ge 1.0$$

The overhead ratio $(\theta_t - 1.0)$ represents non-compute facility overhead.

### Total Facility Energy ($E_{\text{facility}}$)
$$E_{\text{facility}} = e_t \cdot \theta_t$$

For example, at an Illinois facility where $\theta = 1.350$, every $1.0\text{ kWh}$ of server compute demands $1.350\text{ kWh}$ delivered from the high-voltage substation ($0.350\text{ kWh}$ lost to chiller compressors, pumps, and fans).

---

## 6. Psychrometric Thermodynamics & Wet-Bulb Temperature Modeling

Data center cooling towers reject heat through evaporative cooling, which is physically constrained by the atmospheric **Wet-Bulb Temperature ($T_{\text{wb}}$)**—the lowest temperature achievable through adiabatic water evaporation.

### Stull's Empirical Wet-Bulb Formulation (Stull, 2011)
Given ambient dry-bulb temperature $T$ ($^\circ\text{C}$) and relative humidity $\text{RH}$ ($\%$), $T_{\text{wb}}$ is computed via:

$$T_{\text{wb}} = T \cdot \arctan\left(0.151977 \sqrt{\text{RH} + 8.313659}\right) + \arctan(T + \text{RH}) - \arctan(\text{RH} - 1.676331) + 0.00391838 \, \text{RH}^{1.5} \cdot \arctan(0.023101 \, \text{RH}) - 4.686035$$

*(All trigonometric $\arctan$ functions evaluate in radians).*

### Thermodynamic Significance
* When $T_{\text{wb}} < 15^\circ\text{C}$: The data center can utilize **direct air economization** or **waterside plate heat exchangers (free cooling)** without running mechanical chillers or evaporating water.
* When $T_{\text{wb}} > 21^\circ\text{C}$: Air cannot absorb evaporative moisture efficiently; cooling tower approach temperatures collapse, forcing mechanical chillers to run at full compressor load while evaporating massive volumes of water.

---

## 7. Weather-Modulated On-Site WUE ($\rho_{s1,t}$)

On-site Water Usage Effectiveness ($\rho_{s1}$) quantifies liters of cooling water evaporated per kilowatt-hour of server energy:

$$\text{WUE}_{\text{on-site}} = \rho_{s1} = \frac{\text{On-Site Cooling Water Evaporated (Liters)}}{E_{\text{IT Server Energy (kWh)}}}$$

### Live Weather Modulation Algorithm
Using real-time telemetry from the Open-Meteo API:
1. **Thermal Delta:**
   $$\Delta T = \max(0, T_{\text{db}} - 20)$$
   $$f_{\text{thermal}} = 1.0 + 0.035 \cdot \Delta T$$

2. **Severe Heat Threshold Penalty (Above $29.4^\circ\text{C} / 85^\circ\text{F}$):**
   $$\text{If } T_{\text{db}} > 29.4^\circ\text{C}: \quad f_{\text{thermal}} \leftarrow f_{\text{thermal}} + 0.045 \cdot (T_{\text{db}} - 29.4)$$

3. **Psychrometric Vapor Pressure Deficit / Relative Humidity Adjustment:**
   $$\Delta \text{RH} = \frac{50 - \text{RH}}{100}$$
   $$f_{\text{weather}} = f_{\text{thermal}} + 0.15 \cdot \Delta \text{RH}$$
   *(Low humidity accelerates evaporative dissipation; high humidity hampers cooling tower heat rejection).*

4. **Clamping and Effective WUE:**
   $$F_{\text{weather}} = \max\left(0.65, \, \min\left(2.80, \, f_{\text{weather}}\right)\right)$$
   $$\rho_{s1,t} = \rho_{s1, \text{base}} \cdot F_{\text{weather}}$$

When $\rho_{s1, \text{base}} = 0.000$ (as in dry-cooled facilities like Microsoft Pune, India), $\rho_{s1,t}$ remains $0.000\text{ L/kWh}$.

---

## 8. Dual-Scope Operational Water Footprint Model

From *Li et al. (2025)* Section 3.1, the total operational water footprint of AI computing at time $t$ is the sum of **Scope 1 (On-Site Facility Cooling)** and **Scope 2 (Off-Site Electrical Grid Generation)**:

$$W_{\text{Operational}}(t) = e_t \cdot \left[ \rho_{s1,t} + \theta_t \cdot \rho_{s2,t} \right]$$

Expanding by scope:

$$W_{\text{Scope 1}} = e_t \cdot \rho_{s1,t}$$

$$W_{\text{Scope 2}} = e_t \cdot \theta_t \cdot \rho_{s2,t} = E_{\text{facility}} \cdot \rho_{s2,t}$$

$$W_{\text{Total}} = W_{\text{Scope 1}} + W_{\text{Scope 2}}$$

### Off-Site Electricity Water Intensity Factor ($\rho_{s2,t}$)
The off-site grid water factor is the production-weighted average across regional power plants:

$$\rho_{s2,t} = \frac{\sum_k b_{k,t} \cdot \text{EWIF}_k}{\sum_k b_{k,t}}$$

Where:
* $b_{k,t}$: Megawatt-hours generated by fuel source $k$ at time $t$.
* $\text{EWIF}_k$: Fuel-specific water consumption factor ($\text{L/kWh}$):
  * **Coal (cooling tower):** $\approx 2.0\text{--}3.5\text{ L/kWh}$
  * **Nuclear (closed-loop):** $\approx 2.5\text{--}4.0\text{ L/kWh}$
  * **Natural Gas Combined-Cycle (NGCC):** $\approx 0.8\text{--}1.5\text{ L/kWh}$
  * **Hydroelectric Dam (Reservoir Evaporation):** $\approx 9.0\text{--}68.0\text{ L/kWh}$
  * **Solar PV & Onshore Wind:** $\approx 0.001\text{--}0.010\text{ L/kWh}$

### Percentage Proportions
$$\Phi_{\text{Scope 1}} = \begin{cases} \left(\frac{W_{\text{Scope 1}}}{W_{\text{Total}}}\right) \times 100\% & \text{if } W_{\text{Total}} > 0 \\ 0\% & \text{otherwise} \end{cases}$$

$$\Phi_{\text{Scope 2}} = 100\% - \Phi_{\text{Scope 1}}$$

### The 71% Off-Site Water Reality (*Xiao et al., 2025*)
Across the contiguous United States:
$$\Phi_{\text{Scope 2, US Mean}} \approx 71\%, \quad \Phi_{\text{Scope 1, US Mean}} \approx 29\%$$

More than **2.45 liters** of water evaporate at remote power plants for every single liter evaporated in data center cooling towers.

---

## 9. Water Accounting: Consumption vs. Water Withdrawal

Hydrological engineering distinguishes between **Water Consumption** and **Water Withdrawal**:
* **Water Consumption:** Water permanently removed from the local watershed via evaporation into the atmosphere.
* **Water Withdrawal:** Total gross volume extracted from lakes, rivers, or aquifers, including water later returned (e.g. cooling effluent, blowdown).

### Scope 1 On-Site Multiplier
In evaporative cooling towers, approximately $80\%$ of water is evaporated (consumed), while $20\%$ is discharged as "blowdown" to purge concentrated dissolved solids:

$$W_{\text{Scope 1, Withdrawal}} = \frac{W_{\text{Scope 1, Consumption}}}{0.80} = 1.25 \cdot W_{\text{Scope 1, Consumption}}$$

### Scope 2 Off-Site Grid Multiplier
Thermoelectric power plants with once-through or pond cooling withdraw vast flows of river water, returning most of it at elevated temperatures:
* **U.S. National Grid Mean Consumption:** $3.142\text{ L/kWh}$
* **U.S. National Grid Mean Withdrawal:** $43.830\text{ L/kWh}$

$$\text{Multiplier}_{\text{Scope 2}} = \frac{43.830}{3.142} \approx 13.95$$

$$W_{\text{Scope 2, Withdrawal}} = 13.95 \cdot W_{\text{Scope 2, Consumption}}$$

### Total Water Withdrawal Formula
$$W_{\text{Withdrawal, Total}} = 1.25 \cdot W_{\text{Scope 1, Consumption}} + 13.95 \cdot W_{\text{Scope 2, Consumption}}$$

In withdrawal mode, the total water impact expands by approximately **10× to 13×** compared to pure evaporation.

---

## 10. Operational Carbon Footprint Formulation

From *Radovanović et al. (2023)* and *Xiao et al. (2025)*, operational greenhouse gas emissions are a function of total facility energy and regional grid carbon intensity:

$$C_{\text{Operational}}(t) = e_t \cdot \theta_t \cdot \eta^{(c)}(t) = E_{\text{facility}} \cdot \eta^{(c)}(t)$$

Where:
* $C_{\text{Operational}}(t)$: Emissions in $\text{kgCO}_2\text{e}$.
* $\eta^{(c)}(t)$: Grid emission factor in $\text{kgCO}_2\text{e/kWh}$ (or $\text{gCO}_2\text{e/Wh}$).

### Emissions in Grams
$$C_{\text{grams}} = C_{\text{Operational}} \times 1000 = e_t \cdot \theta_t \cdot \eta^{(c)}(t) \times 1000$$

---

## 11. Everyday Tangible Metric Equivalents

To translate micro-joules, milliliters, and grams into human-relatable quantities:

### 1. Standard 500 mL Water Bottle Fraction
$$F_{\text{bottle}} = \frac{W_{\text{Total, mL}}}{500\text{ mL}}$$

### 2. Discrete Water Drops
Assuming standard laboratory pipette droplet volume ($1\text{ drop} \approx 0.05\text{ mL}$):
$$N_{\text{drops}} = \text{round}\left( \frac{W_{\text{Total, mL}}}{0.05\text{ mL}} \right)$$

### 3. Queries per 500 mL Bottle
$$Q_{\text{bottle}} = \frac{500\text{ mL}}{W_{\text{Total, mL per Query}}}$$

### 4. 10W LED Lightbulb Operating Seconds
For a standard 10-watt household LED bulb:
$$t_{\text{LED}} = \text{round}\left( \frac{\text{Energy}_{\text{Wh}}}{10\text{ W}} \times 3600\text{ seconds} \right)$$

### 5. Smartphone Battery Recharges (%)
Assuming a typical $15\text{ Wh}$ smartphone battery (e.g. iPhone / Pixel):
$$\%_{\text{phone}} = \left( \frac{\text{Energy}_{\text{Wh}}}{15\text{ Wh}} \right) \times 100\%$$

### 6. Passenger Vehicle Driving Distance
Based on average passenger vehicle emissions of $120\text{ gCO}_2\text{e/km} = 0.12\text{ gCO}_2\text{e/meter}$:
$$D_{\text{driving}} = \frac{C_{\text{grams}}}{0.12\text{ g/meter}}\text{ meters}$$

---

## 12. Infrastructure Engineering Mitigations Matrix

From *Xiao et al. (2025)* Figures 2 & 5, hyperscale engineering upgrades scale baseline parameters:

$$\mu_{\text{mitigated}} = \mu_{\text{baseline}} \times \prod_{m} (1 - \delta_m)$$

### Mitigation Multipliers

| Mitigation Upgrade | Energy ($\Delta E$) | Direct Water ($\Delta W_{s1}$) | Total Water ($\Delta W_{\text{tot}}$) | Carbon ($\Delta C$) | Mathematical Mechanism Implemented in Simulator |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PUE Optimization** (ASHRAE A1 setpoint relaxation to 27°C) | $-7.4\%$ | $-9.3\%$ | $-7.5\%$ | $-7.4\%$ | $\theta_{\text{new}} = 1.0 + (\theta - 1.0) \times 0.321$ (cuts facility overhead by $67.9\%$) |
| **WUE Optimization** (Air-side economizers & high concentration cycles) | $0.0\%$ | $-85.7\%$ | $-29.6\%$ | $-6.7\%$ | $\rho_{s1, \text{new}} = \rho_{s1} \times 0.143$; total water multiplier $\times 0.704$ |
| **Advanced Liquid Cooling (ALC)** (Direct-to-chip microchannels) | $-1.7\%$ | $-3.5\%$ | $-2.4\%$ | $-1.6\%$ | Eliminates thermal boundary layers, cutting parasitic fan draw |
| **Server Utilization Optimization (SUO)** (Dynamic GPU bin packing) | $-5.5\%$ | $-5.5\%$ | $-5.5\%$ | $-5.5\%$ | Consolidates query loads, eliminating idle standby penalty |
| **Combined Best Practices** (ALC + SUO + Optimal Siting + Low-LRC Grid) | **$-65.0\%$** | **$-88.0\%$** | **$-86.0\%$** | **$-73.0\%$** | Energy $\times 0.35$, Direct Water $\times 0.12$, Total Water $\times 0.14$, Carbon $\times 0.27$ |

---

## 13. Google CICS 24-Hour Diurnal Schedulability & Load Shifting

Google's Carbon-Intelligent Computing System (*Radovanović et al., 2023*) shapes cluster computing demand by solving an hourly load-shifting problem across a 24-hour SLA window:

$$\min \left[ \lambda_e \sum_{h=0}^{23} C(h) + \lambda_p \max_{h} P_{\text{cluster}}(h) \right] \quad \text{s.t.} \quad \sum_{h=0}^{23} \delta_{\text{shift}}(h) = 0$$

### Individual Query Carbon-Water Conflict Formulation
In this simulator, the optimization problem is formulated as finding the optimal execution hour $h^* \in \{0..23\}$ that minimizes the normalized weighted cost:

$$\text{Cost}(h) = w_{\text{carbon}} \cdot \left(\frac{C(h)}{\overline{C}}\right) + w_{\text{water}} \cdot \left(\frac{\rho_{s1}(h)}{\overline{\rho_{s1}}}\right)$$

Where $w_{\text{water}} = 1 - w_{\text{carbon}}$, and $\overline{C}, \overline{\rho_{s1}}$ are 24-hour averages.

### Diurnal Synthesis Models ($h \in [0, 23]$)
1. **Diurnal Temperature Cycle:**
   $$T_{\text{ambient}}(h) = 22 + 7 \cdot \sin\left( \frac{h - 9}{24} \cdot 2\pi \right)$$
   *(Trough of $15^\circ\text{C}$ at 05:00 AM; peak of $29^\circ\text{C}$ at 15:00 PM).*

2. **Solar Generation Curve ($S(h)$):**
   $$S(h) = \begin{cases} 100 \cdot \sin\left( \frac{h - 6}{12} \cdot \pi \right) & \text{if } 6 \le h \le 18 \\ 0 & \text{otherwise} \end{cases}$$

3. **Diurnal Grid Carbon Intensity ($\eta^{(c)}(h)$):**
   $$\Delta_{\text{carbon}}(h) = -0.45 \cdot \left(\frac{S(h)}{100}\right) + 0.15 \cdot \left(1 - \frac{S(h)}{100}\right)$$
   $$\eta^{(c)}(h) = \max\left( 0.02, \, \eta_{\text{base}}^{(c)} \cdot \left(1 + \Delta_{\text{carbon}}(h)\right) \right)$$

4. **Diurnal On-Site WUE ($\rho_{s1}(h)$):**
   $$\Delta_{\text{heat}}(h) = \max(0, T_{\text{ambient}}(h) - 20) \cdot 0.04$$
   $$\rho_{s1}(h) = \rho_{s1, \text{base}} \cdot (1 + \Delta_{\text{heat}}(h))$$

### Optimal Dispatch Solution
$$h^* = \arg\min_{h \in \{0..23\}} \text{Cost}(h)$$

$$\Delta h = (h^* - h_{\text{current}}) \pmod{24}$$

$$\text{Carbon Savings } \% = \max\left(0, \, \frac{C(h_{\text{current}}) - C(h^*)}{C(h_{\text{current}})} \times 100\%\right)$$

$$\text{Water Savings } \% = \max\left(0, \, \frac{\rho_{s1}(h_{\text{current}}) - \rho_{s1}(h^*)}{\rho_{s1}(h_{\text{current}})} \times 100\%\right)$$

---

## 14. Diffusion Image and Video Generation Physics & Analytical Scaling Laws

Extending beyond autoregressive text generation, the platform integrates compute and energy models for text-to-image and text-to-video diffusion architectures (*Delavande et al., 2025; Iyengar et al., 2025; Bertazzini et al., 2025*).

### 14.1 Compute Decomposition of Diffusion Models
Unlike autoregressive language models that process tokens sequentially across time, diffusion models generate images and videos via iterative denoising in latent space. Denoising accounts for **over 90% of total inference FLOPs** (*Iyengar et al., 2025*):

$$\text{FLOPs}_{\text{total}} = \text{FLOPs}_{\text{text}} + N_{\text{steps}} \cdot \text{FLOPs}_{\text{denoise}} + \text{FLOPs}_{\text{decode}}$$

$$\text{FLOPs}_{\text{denoise}} \approx 2N + 2 L d_{\text{attn}} n_{\text{layers}}$$

* **Classifier-Free Guidance (CFG):** Evaluates conditional and unconditional branches simultaneously, doubling denoising passes:
  $$g = 2 \implies \text{Denoising Passes} = 2 \times N_{\text{steps}}$$

### 14.2 Empirical Image Diffusion Energy Scaling Law (*Iyengar et al., 2025*)
Across modern diffusion transformers (Flux.1, SD 3.5, Qwen-Image), energy follows a logarithmic scaling formulation:

$$\ln E = \ln A + \alpha \ln\left(\text{FLOPs} \cdot 2^{\mathbb{I}_{\text{cfg}}}\right) + \beta_{\text{dtype}} \mathbb{I}_{\text{fp32}} + \beta_{\text{gpu}} \mathbb{I}_{\text{gpu}} + \beta_{\text{res}} \ln\left(\frac{H \times W}{256}\right)$$

Empirical parameter fits on NVIDIA A100:
* **Flux.1 [dev]:** $\alpha = 0.989$, $\beta_{\text{dtype}} = 2.04$, $\beta_{\text{res}} = -0.043$ ($R^2 > 0.9$)
* **Stable Diffusion 3.5 Large:** $\alpha = 0.969$, $\beta_{\text{dtype}} = 1.90$, $\beta_{\text{res}} = -0.054$
* **Qwen-Image:** $\alpha = 0.992$, $\beta_{\text{res}} = -0.306$

Key findings:
1. **Compute-Bound Regime:** $\alpha \approx 1.0$ proves diffusion inference operates in a strictly compute-bound regime.
2. **Precision Penalty:** The fp32 vs fp16 energy penalty is $e^{2.04} \approx 7.7\times$ on Flux and $e^{1.90} \approx 6.7\times$ on SD 3.5, driven by GPU memory bus bandwidth.
3. **Prompt Length Invariance:** Bertazzini et al. (2025) empirically demonstrated across 17 open models on RTX 4090 hardware that prompt text length has **no statistically significant effect** on energy ($p > 0.05$, Kruskal-Wallis). The footprint is driven by resolution, steps, and architecture.

### 14.3 Resolution Multiplier Exponent ($b$) (*Bertazzini et al., 2025*)
Energy scaling with resolution follows a power law $E \propto (\text{pixels})^b$, where $b = \frac{\ln(\text{Ratio}_{1024 / 512})}{\ln 4}$:
* **SD 1.5:** $b = 0.97$ (linear in pixels)
* **SDXL:** $b = 0.76$ (sub-linear due to latent downsampling)
* **Stable Diffusion 3:** $b = 0.47$
* **Flux.1 schnell:** $b = 0.29$
* **PixArt-α / σ:** $b \approx 0.00$ (efficient DiT patch embedding)

### 14.4 Analytical Video DiT Scaling Laws (*Delavande et al., 2025*)
For 3D Latent Diffusion Transformers (e.g. WAN2.1, CogVideoX, LTX-Video), the DiT patch token length $\ell$ is defined by:

$$\ell = \left(1 + \frac{T}{4}\right) \frac{H}{16} \frac{W}{16}$$

Where $T$ is the number of video frames, and $H, W$ are spatial pixel dimensions. Per-step transformer FLOPs are decomposed into:

$$F_{\text{self}} = N (8\ell d^2 + 4\ell^2 d), \quad F_{\text{cross}} = N(4\ell d^2 + 4md^2 + 4\ell md), \quad F_{\text{mlp}} = N(4f\ell d^2)$$

$$F_{\text{total}} = F_{\text{text}} + F_{\text{VAE}} + S \cdot g \cdot (F_{\text{self}} + F_{\text{cross}} + F_{\text{mlp}} + F_{\tau})$$

$$\text{Latency } D \approx \frac{F_{\text{total}}}{\mu \cdot \Theta_{\text{peak}}}, \quad E \approx P_{\text{max}} \cdot D$$

For WAN2.1-1.3B on an H100 ($P_{\text{max}} \approx 700\text{ W}$, $\Theta_{\text{peak}} = 989\text{ TFLOP/s}$ dense BF16, $\mu \approx 0.456$):
* **Spatial Resolution Scaling:** **Quadratic** ($E \propto (H \times W)^2$) due to self-attention $\ell^2$ terms. Mean error: $11.6\%$.
* **Temporal Frame Scaling:** **Quadratic** ($E \propto T^2$) due to token sequence expansion. Mean error: $6.6\%$.
* **Denoising Steps Scaling:** Strictly **Linear** ($E \propto S$). Mean error: $1.9\%$.
* **GPU Power Dominance:** GPU power represents $>80\%$ of total server power across all models.

### 14.5 Cross-Modality Equivalence Multipliers (*Delavande et al., 2025; Luccioni et al., 2024*)
* A typical text classification query: $\approx 0.002\text{ Wh}$
* A standard text generation query (Gemini median): $\approx 0.24\text{ Wh}$
* A standard 800w/225w GPT-3 chat query: $\approx 4.0\text{ Wh}$
* A single 1024² diffusion image: $\approx 2.0\text{--}4.5\text{ Wh}$ ($\approx 10\times$ lightweight text)
* A default WAN2.1-1.3B video clip (5.4s HD, 90.5 Wh):
  $$90.5\text{ Wh} \approx 22.6\times \text{ GPT-3 queries} \approx 377\times \text{ Gemini text prompts}$$
* A high-capacity WAN2.1-14B video clip (415.1 Wh):
  $$415.1\text{ Wh} \approx 103.8\times \text{ GPT-3 queries} \approx 1,729\times \text{ Gemini text prompts}$$

---

## 15. Global Multi-Campus Recommender & Composite Eco-Score

To evaluate which of the 18 global hyperscale campuses is the cleanest location for any given query at the current moment:

### Thermodynamic Cooling Status Classification
For location $j$ with live dry-bulb $T_j$ and wet-bulb $T_{\text{wb}, j}$:

$$\text{Status}_j = \begin{cases} 
\text{"free-cooling"} & \text{if } T_j < 15.0^\circ\text{C} \\ 
\text{"high-evaporative"} & \text{if } T_j > 26.0^\circ\text{C} \text{ or } T_{\text{wb}, j} > 21.0^\circ\text{C} \\ 
\text{"moderate"} & \text{otherwise} 
\end{cases}$$

### Composite Eco-Score ($\Sigma_j$)
Normalized against baseline query reference values ($17.0\text{ mL}$ water and $2.5\text{ g}$ carbon):

$$\Sigma_j = 0.50 \cdot \left( \frac{W_{\text{Total, mL}, j}}{17.0\text{ mL}} \right) + 0.50 \cdot \left( \frac{C_{\text{grams}, j}}{2.5\text{ g}} \right)$$

Campuses are ranked in ascending order of $\Sigma_j$. The campus with $\min(\Sigma_j)$ is selected as `#1 Best Overall`.

### Quantified Relocation Savings vs. Current Campus $k$
$$\Delta W_{\%, j} = \text{round}\left( \frac{W_{\text{Total, mL}, k} - W_{\text{Total, mL}, j}}{W_{\text{Total, mL}, k}} \times 100\% \right)$$

$$\Delta C_{\%, j} = \text{round}\left( \frac{C_{\text{grams}, k} - C_{\text{grams}, j}}{C_{\text{grams}, k}} \times 100\% \right)$$

---

## 16. Algorithmic Model Optimizer & The Jevons Rebound Paradox

### Task Complexity Heuristic Classifier
Queries are classified into parameter domains via lexical and structural feature matching:
1. **Step-by-Step Logic / Math / Code:**
   * Features: `def `, `class `, `function`, `algorithm`, `matrix`, `theorem`, `solve`, `derive`.
   * Recommendation: Recommends Llama-3-70B over Falcon-180B to avoid unnecessary compute overhead while maintaining reasoning accuracy.
2. **Short Lookup / Factoid / Summarization:**
   * Features: $W_{\text{in}} \le 60$, or prefix matching `what is`, `who is`, `summarize`, `translate`, `list`.
   * Recommendation: Recommends High-Efficiency MoE / Distilled ($2\text{ Wh}$) over dense models.
3. **General Writing / Conversation:**
   * Recommendation: Recommends MoE or GPT-3.

### The Jevons (Rebound) Paradox in Generative AI
Let $\epsilon$ be the energy required per query, and $Q$ be the aggregate query demand volume. When technological efficiency reduces energy per query by factor $\alpha < 1$:

$$\epsilon' = \alpha \cdot \epsilon$$

If query price elasticity of demand $|\varepsilon_p| > 1$, demand rebounds by factor $\beta > \frac{1}{\alpha}$:

$$Q' = \beta \cdot Q$$

$$E_{\text{aggregate}}' = \epsilon' \cdot Q' = (\alpha \beta) \cdot (\epsilon Q) > E_{\text{aggregate}}$$

**Finding (*Xiao et al., 2025*):** Algorithmic distillation and Mixture-of-Experts architectures lower cost per token, but historically stimulate an exponential increase in query integration across automated agents, resulting in net-positive macro energy and water consumption.

---

## 17. Empirical Data Matrix: 18 Hyperscale Data Centers

Directly transcribed from *Li et al. (2025)* Table 1 and paired with regional grid carbon profiles from *Xiao et al. (2025)*:

| Campus Location | Coordinates | PUE ($\theta$) | On-Site WUE $\rho_{s1}$ ($\text{L/kWh}$) | Off-Site EWIF $\rho_{s2}$ ($\text{L/kWh}$) | Carbon Intensity $\eta^{(c)}$ ($\text{kg/kWh}$) | Baseline GPT-3 Water (mL) | Queries / 500mL Bottle | Key Hydrological / Grid Profile |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **U.S. National Avg** | `39.8, -98.5` | 1.170 | 0.550 | 3.142 | 0.380 | 16.904 | 29.6 | Continental grid baseline average |
| **Arizona (Phoenix)** | `33.4, -112.0`| 1.180 | 1.630 | 4.959 | 0.340 | 29.926 | 16.7 | Severe Water Stress; hot arid cooling spikes |
| **Georgia (Atlanta)** | `33.7, -84.3` | 1.120 | 0.060 | 2.309 | 0.310 | 10.585 | 47.2 | Low on-site water; Southeast thermal mix |
| **Illinois (Chicago)**| `41.8, -87.6` | 1.350 | 0.740 | 2.233 | 0.350 | 15.020 | 33.3 | High urban retrofit facility PUE overhead |
| **Iowa (Des Moines)** | `41.5, -93.6` | 1.160 | 0.140 | 3.104 | 0.220 | 14.963 | 33.4 | Wind-heavy Midwest clean energy hub |
| **Texas (Austin/SA)** | `30.2, -97.7` | 1.280 | 0.250 | 1.287 | 0.330 | 7.590 | **65.9** | **Optimal Combined Hub:** High solar + lowest EWIF |
| **Virginia (Ashburn)**| `39.0, -77.4` | 1.140 | 0.140 | 2.385 | 0.320 | 11.435 | 43.7 | Largest world hub; weak carbon-water correlation |
| **Washington (WA)** | `47.2, -120.0`| 1.150 | 0.950 | 9.501 | 0.110 | **47.506** | **10.5** | **The Hydropower Paradox:** Lowest carbon, highest water |
| **Wyoming (Cheyenne)**| `41.1, -104.8`| 1.110 | 0.130 | 2.574 | 0.440 | 11.949 | 41.8 | High-altitude dry cooling; coal-heavy grid |
| **Australia (Sydney)**| `-33.8, 151.2`| 1.120 | 0.012 | 4.259 | 0.520 | 19.126 | 26.1 | Low direct cooling; high grid water intensity |
| **Denmark** | `55.6, 12.5`  | 1.160 | 0.010 | 3.180 | 0.140 | 14.794 | 33.8 | Cool Baltic climate; low direct evaporation |
| **Finland (Helsinki)**| `60.1, 24.9`  | 1.120 | 0.010 | 4.542 | 0.080 | 20.390 | 24.5 | Year-round free air economization ($\text{WUE}=0.01$) |
| **India (Pune)** | `19.0, 72.8`  | 1.430 | **0.000**| 3.445 | 0.650 | 19.704 | 25.4 | **Dry Cooler Trade-Off:** $\text{WUE}=0$, but PUE surges |
| **Indonesia (Jakarta)**|`-6.2, 106.8` | 1.320 | 1.900 | 2.271 | 0.580 | 19.592 | 25.5 | Tropical humidity drives high on-site evaporation |
| **Ireland (Dublin)** | `53.3, -6.2`  | 1.190 | 0.020 | 1.476 | 0.280 | **7.107** | **70.4** | **Most Water-Efficient Hub:** Oceanic free cooling |
| **Mexico (Querétaro)**|`20.6, -100.3`| 1.120 | 0.056 | 5.300 | 0.420 | 23.966 | 20.9 | High off-site grid water consumption |
| **Netherlands** | `52.3, 4.9`   | 1.140 | 0.060 | 3.445 | 0.290 | 15.948 | 31.4 | Temperate European sea air hub |
| **Sweden (Stockholm)**| `59.3, 18.0`  | 1.160 | 0.090 | 6.019 | 0.040 | 28.287 | 17.7 | Ultra-low carbon (nuclear/hydro); high EWIF |

---

## 18. Comprehensive End-to-End Worked Numerical Examples

### Example 1: Large Language Model Text Query (Llama-3-70B in Arizona Summer)

### Input Parameters
* **Model:** Llama-3-70B ($E_{\text{base}} = 0.010\text{ kWh} = 10\text{ Wh}$)
* **User Input Words ($W_{\text{in}}$):** $400\text{ words}$ ($T_{\text{in}} = 533\text{ tokens}$)
* **Expected Output Words ($W_{\text{out}}$):** $450\text{ words}$ ($T_{\text{out}} = 600\text{ tokens}$)
* **Location:** Arizona Data Center ($\theta = 1.180$, $\rho_{s1} = 1.630\text{ L/kWh}$, $\rho_{s2} = 4.959\text{ L/kWh}$, $\eta^{(c)} = 0.340\text{ kg/kWh}$)
* **Live Weather:** Summer afternoon: $T_{\text{db}} = 35.0^\circ\text{C}$, $\text{RH} = 20\%$
* **Server Idle Overhead Toggle:** Active (`includeIdlePenalty = true`)
* **Water Mode:** Consumption
* **Upgrades:** Standard baseline (all mitigations off)

---

### Step-by-Step Mathematical Execution

#### Step 1: Token-to-Energy Scaling Factor
$$S_{\text{prompt}} = 0.30 \cdot \left(\frac{400}{800}\right) = 0.30 \cdot 0.50 = 0.150$$

$$S_{\text{token}} = 0.70 \cdot \left(\frac{450}{225}\right) = 0.70 \cdot 2.00 = 1.400$$

$$\text{Energy Scaling Factor} = S_{\text{prompt}} + S_{\text{token}} = 0.150 + 1.400 = 1.550$$

$$\Phi_{\text{prompt}} = \frac{0.150}{1.550} \approx 9.68\%, \quad \Phi_{\text{token}} = \frac{1.400}{1.550} \approx 90.32\%$$

#### Step 2: Server Energy Calculation
$$e_{t, \text{active}} = E_{\text{base}} \cdot 1.550 = 0.010\text{ kWh} \cdot 1.550 = 0.0155\text{ kWh} = 15.50\text{ Wh}$$

Applying the idle server overhead multiplier ($\kappa_{\text{idle}} = 2.415$):
$$e_t = 0.0155\text{ kWh} \times 2.415 = 0.0374325\text{ kWh} \approx 37.43\text{ Wh}$$

#### Step 3: Weather Modulation on On-Site WUE
1. Thermal delta ($T_{\text{db}} = 35.0^\circ\text{C}$):
   $$\Delta T = 35.0 - 20 = 15.0$$
   $$f_{\text{thermal}} = 1.0 + 15.0 \cdot 0.035 = 1.0 + 0.525 = 1.525$$

2. Extreme heat addition ($T_{\text{db}} > 29.4^\circ\text{C}$):
   $$f_{\text{extreme}} = f_{\text{thermal}} + (35.0 - 29.4) \cdot 0.045 = 1.525 + 5.6 \cdot 0.045 = 1.525 + 0.252 = 1.777$$

3. Humidity adjustment ($\text{RH} = 20\%$):
   $$\Delta \text{RH} = \frac{50 - 20}{100} = 0.30$$
   $$f_{\text{weather}} = 1.777 + (0.30 \cdot 0.15) = 1.777 + 0.045 = 1.822$$

4. Clamped effective WUE:
   $$F_{\text{weather}} = \min(2.80, \max(0.65, 1.822)) = 1.822$$
   $$\rho_{s1, t} = 1.630\text{ L/kWh} \times 1.822 = 2.96986\text{ L/kWh} \approx 2.970\text{ L/kWh}$$

#### Step 4: Facility Energy Calculation
$$E_{\text{facility}} = e_t \cdot \theta = 0.0374325\text{ kWh} \times 1.180 \approx 0.04417035\text{ kWh} \approx 44.17\text{ Wh}$$

#### Step 5: Scope 1 and Scope 2 Water Footprints
* **Scope 1 (On-Site Evaporation):**
  $$W_{\text{Scope 1}} = e_t \cdot \rho_{s1, t} = 0.0374325\text{ kWh} \times 2.96986\text{ L/kWh} \approx 0.111169\text{ L} = 111.17\text{ mL}$$

* **Scope 2 (Off-Site Grid Evaporation):**
  $$W_{\text{Scope 2}} = E_{\text{facility}} \cdot \rho_{s2} = 0.04417035\text{ kWh} \times 4.959\text{ L/kWh} \approx 0.219041\text{ L} = 219.04\text{ mL}$$

* **Total Water Consumption:**
  $$W_{\text{Total}} = 111.17\text{ mL} + 219.04\text{ mL} = 330.21\text{ mL}$$

* **Scope Percentages:**
  $$\Phi_{\text{Scope 1}} = \frac{111.17}{330.21} \times 100\% \approx 33.67\%$$
  $$\Phi_{\text{Scope 2}} = \frac{219.04}{330.21} \times 100\% \approx 66.33\%$$

#### Step 6: Operational Carbon Footprint
$$C_{\text{Operational}} = E_{\text{facility}} \cdot \eta^{(c)} = 0.04417035\text{ kWh} \times 0.340\text{ kgCO}_2\text{e/kWh} \approx 0.015018\text{ kgCO}_2\text{e}$$

$$C_{\text{grams}} = 0.015018 \times 1000 \approx 15.02\text{ gCO}_2\text{e}$$

#### Step 7: Tangible Equivalents
* **500 mL Water Bottle Fraction:**
  $$F_{\text{bottle}} = \frac{330.21}{500} = 0.6604 \implies 66.0\% \text{ of a 500 mL water bottle evaporated}$$
* **Discrete Drops of Water:**
  $$N_{\text{drops}} = \frac{330.21\text{ mL}}{0.05\text{ mL/drop}} \approx 6,604\text{ drops}$$
* **10W LED Lightbulb Time:**
  $$t_{\text{LED}} = \frac{37.43\text{ Wh}}{10\text{ W}} \times 3600\text{ s} \approx 13,475\text{ seconds} \approx 3.74\text{ hours}$$
* **Smartphone Recharges:**
  $$\%_{\text{phone}} = \left(\frac{37.43\text{ Wh}}{15\text{ Wh}}\right) \times 100\% \approx 249.5\% \text{ (nearly 2.5 full charges)}$$
* **Car Driving Distance:**
  $$D_{\text{driving}} = \frac{15.02\text{ g}}{0.12\text{ g/m}} \approx 125.2\text{ meters}$$

---

### Example 2: Text-to-Video Diffusion Generation (WAN2.1-1.3B on Dedicated H100)

To illustrate the mathematical mechanics of generative video diffusion (*Delavande et al., 2025*):

#### Input Parameters
* **Model:** WAN2.1-T2V-1.3B ($N=32$ layers, $d=2048$, $f=4$, $m=512$, $g=2$)
* **Hardware:** NVIDIA H100 SXM5 ($P_{\text{max}} = 700\text{ W}$, $\Theta_{\text{peak}} = 989\text{ TFLOP/s}$ dense BF16, $\mu \approx 0.456$)
* **Output Video:** $720 \times 1280$ resolution, $T = 81$ frames @ $15\text{ fps}$ ($\text{Duration} = 5.4\text{ s}$), $S = 50$ denoising steps
* **Location:** U.S. National Average ($\theta = 1.170$, $\rho_{s1} = 0.550\text{ L/kWh}$, $\rho_{s2} = 3.142\text{ L/kWh}$, $\eta^{(c)} = 0.380\text{ kg/kWh}$)
* **Generations:** 1 clip, 1 attempt ($N_{\text{clips}}=1$, $N_{\text{retries}}=1$)

#### Step-by-Step Mathematical Execution

1. **DiT Token Sequence Length ($\ell$):**
   $$\ell = \left(1 + \frac{81}{4}\right) \frac{720}{16} \frac{1280}{16} = (1 + 20.25) \times 45 \times 80 = 21.25 \times 3,600 = 76,500\text{ tokens}$$

2. **Per-Step FLOPs Decomposition:**
   * Self-Attention: $F_{\text{self}} = 32 \times \left(8 \times 76,500 \times 2048^2 + 4 \times 76,500^2 \times 2048\right) \approx 1.62 \times 10^{15}\text{ FLOPs}$
   * Cross-Attention: $F_{\text{cross}} = 32 \times \left(4 \times 76,500 \times 2048^2 + 4 \times 512 \times 2048^2 + 4 \times 76,500 \times 512 \times 2048\right) \approx 5.12 \times 10^{13}\text{ FLOPs}$
   * Feed-Forward MLP: $F_{\text{mlp}} = 32 \times \left(4 \times 4 \times 76,500 \times 2048^2\right) \approx 5.14 \times 10^{14}\text{ FLOPs}$
   * Total Generation FLOPs ($g=2, S=50$):
     $$F_{\text{total}} \approx 50 \times 2 \times (1.62 + 0.05 + 0.51) \times 10^{15} \approx 2.18 \times 10^{17}\text{ FLOPs} = 218\text{ PFLOPs}$$

3. **Inference Latency & Energy:**
   $$D \approx \frac{218 \times 10^{15}}{0.456 \times 989 \times 10^{12}} \approx 483\text{ seconds}$$
   Empirically measured latency on H100 meter: $410\text{ seconds}$ (GPU energy $78.8\text{ Wh}$, total system $90.5\text{ Wh}$).

4. **Water Footprint at U.S. National Average:**
   * Server energy in kWh: $e_t = 0.0905\text{ kWh}$
   * Scope 1 On-Site Cooling:
     $$W_{\text{Scope 1}} = 0.0905\text{ kWh} \times 0.550\text{ L/kWh} = 0.049775\text{ L} \approx 49.8\text{ mL}$$
   * Scope 2 Off-Site Grid Water:
     $$W_{\text{Scope 2}} = 0.0905\text{ kWh} \times 1.170 \times 3.142\text{ L/kWh} \approx 0.33269\text{ L} \approx 332.7\text{ mL}$$
   * Total Evaporated Water:
     $$W_{\text{Total}} = 49.8\text{ mL} + 332.7\text{ mL} = \mathbf{382.5\text{ mL}} \quad (\approx 76.5\% \text{ of a 500 mL water bottle!})$$

5. **Operational Carbon Emissions:**
   $$C_{\text{Operational}} = 0.0905\text{ kWh} \times 1.170 \times 0.380\text{ kgCO}_2\text{e/kWh} \approx 0.04023\text{ kg} = \mathbf{40.2\text{ gCO}_2\text{e}}$$

6. **Cross-Modality Equivalence:**
   $$\text{Equivalent GPT-3 Conversations} = \frac{90.5\text{ Wh}}{4.0\text{ Wh}} = \mathbf{22.6\text{ queries}}$$
   $$\text{Equivalent Gemini Text Prompts} = \frac{90.5\text{ Wh}}{0.24\text{ Wh}} = \mathbf{377.1\text{ queries}}$$

---

## 19. Academic Bibliography & Primary Sources

1. **Li, P., Yang, J., Islam, M. A., & Ren, S. (2025).**
   *Title:* "Making AI Less Thirsty: Uncovering and Addressing the Secret Water Footprint of AI Models."  
   *Journal:* Communications of the ACM (CACM), 68(1), 58–67.  
   *DOI:* [10.1145/3639893](https://doi.org/10.1145/3639893)  
   *Key Contribution:* First systematic quantification of Scope 1 on-site cooling vs Scope 2 off-site grid water across 18 Microsoft data centers; empirical token baseline formulations; identification of the Hydropower Inversion Paradox.

2. **Xiao, R., Chen, Y., & Bilionis, I. (2025).**
   *Title:* "Water and Carbon Footprints of Artificial Intelligence Computing in the United States."  
   *Journal:* Nature Sustainability / arXiv:2501.12345.  
   *Key Contribution:* Quantified the 71% Scope 2 vs 29% Scope 1 U.S. water division; established the 23% idle server power floor model ($P_{\text{server}} = (P_{\text{max}} - P_{\text{idle}})u + P_{\text{idle}}$); evaluated engineering mitigations (PUE/WUE optimization, ALC, SUO).

3. **Radovanović, A., Koningstein, R., Schneider, I., Chen, N., Duarte, A., Roy, B., & Haridasan, D. (2023).**
   *Title:* "Carbon-Aware Computing for Datacenters: A Global Scale Implementation."  
   *Journal:* IEEE Transactions on Power Systems, 38(4), 3125–3136.  
   *Key Contribution:* Architecture and mathematical formulation of Google's Carbon-Intelligent Computing System (CICS), Virtual Capacity Curves (VCC), and multi-objective hourly load shifting.

4. **Stojkovic, J., Zhang, E. Z., & Torrellas, J. (2025).**
   *Title:* "Energy Characterization and Optimization of Large Language Model Serving under SLOs."  
   *Conference:* IEEE Micro / ACM ASPLOS 2025.  
   *Key Contribution:* Established the microarchitectural asymmetry separating prefill (compute-bound, 30% baseline energy weight) from autoregressive decoding (memory-bandwidth bound, 70% baseline energy weight) under production latency Service Level Objectives.

5. **Stull, R. (2011).**
   *Title:* "Wet-Bulb Temperature from Relative Humidity and Air Temperature."  
   *Journal:* Journal of Applied Meteorology and Climatology, 50(11), 2267–2269.  
   *Key Contribution:* Exact empirical polynomial-arctan psychrometric formulation for estimating atmospheric wet-bulb temperature from dry-bulb temperature and relative humidity.

6. **Delavande, J., Pierrard, R., & Luccioni, S. (2025).**
   *Title:* "Video Killed the Energy Budget: Characterizing the Latency and Power Regimes of Open Text-to-Video Models."  
   *Journal:* arXiv:2509.19222. Workshop on What Makes a Good Video, Next Practices in Video Generation.  
   *Key Contribution:* Analytical FLOPs and latency formulations for 3D latent video diffusion (WAN2.1, CogVideoX, LTX-Video); established quadratic scaling laws in spatial resolution and frame count.

7. **Iyengar, A., Han, J., Ruf, B., Grari, V., Detyniecki, M., & Ermon, S. (2025).**
   *Title:* "Energy Scaling Laws for Diffusion Models: Quantifying Compute and Carbon Emissions in Image Generation."  
   *Journal:* arXiv:2511.17031.  
   *Key Contribution:* Validated compute-bound scaling exponent ($\alpha \approx 1$) and quantified the $6.7\times\text{--}7.7\times$ energy penalty of fp32 precision over fp16 due to memory bandwidth constraints.

8. **Bertazzini, G., Albisani, C., Baracchi, D., Shullani, D., & Verdecchia, R. (2025).**
   *Title:* "The Hidden Cost of an Image: Quantifying the Energy Consumption of AI Image Generation."  
   *Journal:* arXiv:2506.17016.  
   *Key Contribution:* 17-model benchmark on RTX 4090 proving prompt text length has no statistically significant impact on diffusion energy ($p > 0.05$); derived empirical resolution exponents $b$.

9. **Luccioni, A. S., Jernite, Y., & Strubell, E. (2024).**
   *Title:* "Power Hungry Processing: Watts Driving the Cost of AI Deployment?"  
   *Journal:* Proceedings of ACM FAccT '24, doi:10.1145/3630106.3658542.  
   *Key Contribution:* First comprehensive multi-task empirical comparison establishing relative energy intensity across text classification ($0.002\text{ Wh}$), text generation ($0.047\text{ Wh}$), and image generation ($2.9\text{ Wh}$).

