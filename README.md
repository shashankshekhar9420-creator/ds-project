# AI Water & Energy Footprint Simulator

> **Live Deployment:** [https://shashankshekhar9420-creator.github.io/ds-project/](https://shashankshekhar9420-creator.github.io/ds-project/)  
> **Scientific Monograph:** [https://shashankshekhar9420-creator.github.io/ds-project/report.html](https://shashankshekhar9420-creator.github.io/ds-project/report.html)

A publication-grade interactive simulator and 3Blue1Brown-style explorable explanation of generative AI inference's energy, water, and carbon footprint based on peer-reviewed empirical literature (Li et al. CACM 2025, Xiao et al. Nature Sustainability 2025, Radovanović et al. Google CICS).

## Features
- **Query Sandbox & Environmental Receipt**: Real-time tokenization, PUE/WUE modeling, dynamic cooling towers, and live Open-Meteo telemetry across 18 hyperscale data center campuses.
- **3Blue1Brown-Style Explorable Explanation**: Interactive thermodynamic flows, scope 1 vs scope 2 water, and heat exchangers.
- **Spatiotemporal Load Shift Optimizer**: Cleanest data center routing recommendations and 24h carbon intensity modeling.
- **Scientific Monograph Report**: Standalone peer-reviewed technical monograph with rendered LaTeX equations and datacenter audit matrix.

## Deployment & CI/CD
This project is configured with GitHub Actions for automated continuous deployment to **GitHub Pages**:
- Any push to the `main` branch automatically triggers `.github/workflows/deploy.yml`.
- Manual deployment can also be executed with:
  ```bash
  npm run deploy
  ```

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
