# Extending the AI Water & Energy Footprint Simulator to Image and Video Generation

**Document type:** Methodology addendum (draft, not peer-reviewed)
**Date:** October 29, 2026
**Scope:** Energy, water and carbon estimation for text-to-image and text-to-video diffusion models
**Builds on:** the existing text-query framework (Li et al.; Xiao et al.; Radovanović et al.; Stojkovic et al.)

Numbers in square brackets, such as [2], refer to the References section. Values marked **(derived)** were calculated for this document from cited figures and are not reported in the sources.

---

## 1. Summary

The existing platform converts server energy `e_t` into water and carbon. For image and video generation, only the energy model changes. The published research supports three conclusions:

1. Diffusion inference is compute-bound, and the iterative denoising loop dominates its cost [2][3].
2. Video energy grows **quadratically** with spatial resolution and with frame count, and **linearly** with denoising steps [1].
3. Prompt length has no statistically significant effect on image energy [4], so the footprint is driven by output settings, not prompt text.

No peer-reviewed source measures water or carbon per image or video directly. Those values are derived by applying the platform's existing formulas to a measured or modeled energy value.

## 2. Scope and Limitations

- All measured data come from **open-source models** on specific GPUs. Closed services (Sora, Veo, Midjourney, DALL·E) have no published per-generation energy data; the 17-model image study excluded subscription-based tools for this reason [4].
- The sources are arXiv preprints and a workshop paper. Verify publication status before describing them as peer-reviewed.
- Measurement boundaries differ between sources (GPU only vs. GPU+CPU+RAM vs. full serving stack), which can change results several-fold (Section 6).

## 3. Image Generation Energy Model

### 3.1 Compute decomposition [2]

Diffusion inference consists of text encoding, repeated denoising, and decoding. Denoising accounts for more than 90% of FLOPs [2].

$$\text{FLOPs}_{total} = \text{FLOPs}_{text} + N_{steps}\cdot\text{FLOPs}_{denoise} + \text{FLOPs}_{decode}$$

$$\text{FLOPs}_{denoise} \approx 2N + 2\,L\,d_{attn}\,n_{layers}$$

Classifier-free guidance (CFG) doubles the denoising passes [2].

### 3.2 Energy scaling law [2]

$$\ln E = \ln A + \alpha\,\ln\!\big(\text{FLOPs}\cdot 2^{\mathbb{I}_{cfg}}\big) + \beta_{dtype}\,\mathbb{I}_{fp32} + \beta_{gpu}\,\mathbb{I}_{gpu} + \beta_{res}\,\ln\!\left(\tfrac{H\times W}{256}\right)$$

Fitted on an NVIDIA A100 [2]:

| Model | α | β_dtype (fp32 vs fp16) | β_res |
|---|---|---|---|
| Flux.1 [dev] | 0.989 | 2.04 | −0.043 |
| Stable Diffusion 3.5 | 0.969 | 1.90 | −0.054 |
| Qwen-Image | 0.992 | 0 (fp16 only) | −0.306 |

An exponent near 1 confirms the compute-bound regime [2]. The fp32 penalty is e^2.04 ≈ 7.7× and e^1.90 ≈ 6.7× **(derived)**. Within-architecture fits reach R² > 0.9 [2].

**Practical anchors (Qwen-Image, A100) [2]:** 0.051 Wh per image at 10 steps, 256², fp16, no CFG, up to 3.58 Wh at 50 steps, 1024², fp16, with CFG.

**Caution:** the intercepts (ln A) depend on the paper's FLOP unit convention, which is not confirmed here. Refit them on your own measurements or use the authors' released code rather than copying the values.

### 3.3 Empirical findings across 17 models [4]

Measured on an RTX 4090 with CodeCarbon (CPU + GPU + RAM) [4][8]:

- Median energy per image ranges from 0.086 Wh (LCM-SSD-1B) to 4.08 Wh (Lumina), a **46×** spread.
- U-Net models generally use less energy than transformer-based models.
- int8 quantization **increased** energy for most models, by up to 64.5%.
- Prompt length had no significant effect (Kruskal–Wallis, p > 0.05 for all models).

**Resolution multiplier** (energy at 1024² divided by energy at 512², no quantization) [4]. The exponent *b* in E ∝ pixels^b is derived as ln(ratio)/ln(4) **(derived)**:

| Model | Ratio | b | Model | Ratio | b |
|---|---|---|---|---|---|
| SD 1.5 | 3.85 | 0.97 | LCM-SDXL | 1.51 | 0.30 |
| SDXL | 2.88 | 0.76 | Flash-SD | 2.80 | 0.74 |
| SDXL-Turbo | 1.33 | 0.21 | Flash-SDXL | 1.61 | 0.34 |
| SDXL-Lightning | 1.48 | 0.28 | PixArt-α | 1.00 | 0.00 |
| Hyper-SD | 1.38 | 0.23 | PixArt-σ | 0.99 | −0.01 |
| SSD-1B | 2.90 | 0.77 | Flash-PixArt | 1.00 | 0.00 |
| LCM-SSD-1B | 1.62 | 0.35 | SD 3 | 1.92 | 0.47 |
| Flash-SD3 | 1.85 | 0.44 | Flux.1 schnell | 1.50 | 0.29 |
| Lumina-Next | 4.75 | 1.12 | | | |

PixArt models also used more energy for non-square formats [4].

## 4. Video Generation Energy Model

### 4.1 Analytical model [1]

For WAN2.1-style latent video diffusion, the DiT token count is

$$\ell = \left(1+\tfrac{T}{4}\right)\tfrac{H}{16}\,\tfrac{W}{16}$$

Per-step FLOPs [1]:

$$F_{self}=N(8\ell d^2+4\ell^2 d),\quad F_{cross}=N(4\ell d^2+4md^2+4\ell m d),\quad F_{mlp}=N(4f\ell d^2)$$

$$F_{total}=F_{text}+F_{VAE}+S\,g\,(F_{self}+F_{cross}+F_{mlp}+F_{\tau}),\qquad D\approx\frac{F_{total}}{\mu\,\Theta_{peak}},\qquad E\approx P_{max}\,D$$

Constants for WAN2.1-T2V-1.3B on an H100 [1]: N = 32 layers, d = 2048, f = 4, m = 512, g = 2 (CFG), μ ≈ 0.456 (R² = 0.998), Θ_peak = 989 TFLOP/s (dense BF16), P_max ≈ 700 W.

**Verification (derived):** implementing the equations above for the default clip (720×1280, 81 frames, 50 steps) gives 406 s and 79.0 Wh, against the paper's measured 410 s and 78.8 Wh GPU energy [1].

### 4.2 Scaling laws [1]

| Variable | Scaling | Mean error vs. measurement |
|---|---|---|
| Spatial resolution | Quadratic | 11.6% |
| Frame count | Quadratic | 6.6% |
| Denoising steps | Linear | 1.9% |

Doubling any single dimension costs about 4×; doubling both height and width costs about 16× [1]. In the model above, halving resolution, frames or steps from the default gives about 7.4, 25.3 and 39.5 Wh respectively **(derived)**, against 79 Wh.

GPU energy is above 80% of the total for every model tested [1].

### 4.3 Cross-model benchmark (defaults, H100) [1]

| Model | Steps | Resolution | Frames @ fps | Latency (s) | GPU Wh | Total Wh* | Wh per clip-second* |
|---|---|---|---|---|---|---|---|
| AnimateDiff | 4 | 512×512 | 16 @ 10 | 0.68 | 0.115 | 0.139 | 0.09 |
| CogVideoX-2B | 50 | 480×720 | 49 @ 8 | 50.6 | 8.3 | 9.67 | 1.58 |
| CogVideoX-5B | 50 | 480×720 | 49 @ 8 | 124 | 21.6 | 25.3 | 4.13 |
| LTX-Video | 40 | 512×704 | 121 @ 24 | 9.7 | 3.16 | 3.67 | 0.73 |
| Mochi-1 | 64 | 480×848 | 84 @ 30 | 263 | 44.7 | 52.1 | 18.61 |
| WAN2.1-1.3B | 50 | 720×1280 | 81 @ 15 | 410 | 78.8 | 90.5 | 16.76 |
| WAN2.1-14B | 50 | 720×1280 | 81 @ 15 | 1875 | 359.7 | 415.1 | 76.87 |

\* Derived: total = GPU + CPU + RAM from the source table; clip-second = frames ÷ fps. Because resolution and clip length differ by model and scaling is quadratic, treat per-second values as rough comparisons only.

## 5. Cross-Modality Anchors

Average per-output energy reported by Luccioni et al. [5], as summarized in [1]: about 0.002 Wh for text classification, 0.047 Wh for text generation, and 2.9 Wh for image generation. A default WAN2.1-1.3B clip (about 90 Wh) is roughly 30× an image and 2,000× a text generation [1]. A single high-quality diffusion image can use up to about 10× the energy of an average chatbot query [2].

## 6. Measurement Boundaries

**Hardware and settings.** For SDXL, [5] reports 11.41 kWh per 1,000 images, while the AI Energy Score reports 1.64 kWh per 1,000 [7]. The AI Energy Score maintainers attribute the gap to larger default image sizes, older GPU hardware, and fixed image dimensions [7]. A commenter also questioned whether the earlier figure included idle power from unused GPUs [7]. State the model, hardware and boundary on every receipt.

**GPU-only vs. full stack.** Iyengar et al. measure GPU power with idle subtracted [2]; Delavande et al. and Bertazzini et al. include CPU and RAM [1][4]. Google's production study includes accelerators, host CPU/DRAM, provisioned idle capacity, and data-center overhead [6].

**Production reference (text) [6]:** a median Gemini text prompt uses 0.24 Wh, 0.03 gCO₂e and 0.26 mL of water. Its breakdown is accelerators 0.14 Wh, host 0.06 Wh, idle 0.02 Wh, and overhead 0.02 Wh. A benchmark-style measurement of the same prompt would show about 0.10 Wh. The 2.4× gap (derived) is comparable to the platform's 2.415× idle-overhead factor.

## 7. From Energy to Water and Carbon

The platform's existing formulas (Li et al.; Radovanović et al.) apply unchanged once `e_t` is in kWh:

$$\text{Water}=e_t\left[\rho_{s1}+\theta\,\rho_{s2}\right],\qquad \text{Carbon}=e_t\,\theta\,\eta^{(c)}$$

**Worked example (derived, illustrative).** Take `e_t` = 90.5 Wh for a default WAN2.1-1.3B clip, with the platform's U.S.-average row (PUE 1.17, WUE 0.55 L/kWh, EWIF 3.142 L/kWh, 0.38 kgCO₂e/kWh):

- Water ≈ 0.0905 × (0.55 + 1.17 × 3.142) ≈ **382 mL**
- Carbon ≈ 0.0905 × 1.17 × 0.38 ≈ **40 gCO₂e**

This is an estimate for a dedicated research setup. Production serving will differ. Google's reported intensity implies about 1.08 L/kWh [6] (derived), against about 4.23 L/kWh from the U.S.-average row, so check each source's water boundary before combining them.

## 8. Platform Integration

1. Add a modality selector. Image controls: model, resolution, steps, CFG, precision. Video controls: model, resolution, frames, steps.
2. Use the quadratic video model where architecture constants are available, and the measured tables otherwise. Use the per-model exponent *b* for image resolution.
3. The video paper reports saturated GPU utilization [1], so the text-derived utilization of 0.25 likely overstates idle overhead for diffusion. Treat it as an explicit modeling choice.
4. What-if lab: steps are linear; fp32 costs about 7× fp16 [2]; quantization is not a reliable saving for image models [4]. Diffusion caching (up to 1.62×) and quantization (about 1.27× speedup) are reported in [1] as figures quoted from the original WAN paper [10], and speedup is not the same as energy saving.
5. Video generation is rarely urgent, so it suits the delayed Eco-Queue.

## 9. Limitations

- The video model is validated on one architecture and one GPU (H100); the authors note it assumes uniform attention cost and excludes perceptual quality and audio [1].
- The image scaling law is validated on four models and three GPUs [2]; the 17-model study used a single workstation GPU [4].
- Neither the image nor the video papers measure water or carbon directly.

---

## References

1. Delavande, J., Pierrard, R., & Luccioni, S. (2025). *Video Killed the Energy Budget: Characterizing the Latency and Power Regimes of Open Text-to-Video Models.* arXiv:2509.19222. Workshop paper, "What Makes a Good Video: Next Practices in Video Generation and Evaluation." https://arxiv.org/abs/2509.19222
2. Iyengar, A., Han, J., Ruf, B., Grari, V., Detyniecki, M., & Ermon, S. (2025). *Energy Scaling Laws for Diffusion Models: Quantifying Compute and Carbon Emissions in Image Generation.* arXiv:2511.17031. https://arxiv.org/abs/2511.17031
3. Kaplan, J., McCandlish, S., Henighan, T., et al. (2020). *Scaling Laws for Neural Language Models.* arXiv:2001.08361. (Cited within [2].)
4. Bertazzini, G., Albisani, C., Baracchi, D., Shullani, D., & Verdecchia, R. (2025). *The Hidden Cost of an Image: Quantifying the Energy Consumption of AI Image Generation.* arXiv:2506.17016. https://arxiv.org/abs/2506.17016
5. Luccioni, A. S., Jernite, Y., & Strubell, E. (2024). *Power Hungry Processing: Watts Driving the Cost of AI Deployment?* Proceedings of ACM FAccT '24. doi:10.1145/3630106.3658542; arXiv:2311.16863. https://arxiv.org/abs/2311.16863
6. Elsworth, C., Huang, K., Patterson, D., Schneider, I., Sedivy, R., Goodman, S., Townsend, B., Ranganathan, P., Dean, J., Vahdat, A., Gomes, B., & Manyika, J. (2025). *Measuring the Environmental Impact of Delivering AI at Google Scale.* arXiv:2508.15734. https://arxiv.org/abs/2508.15734
7. AI Energy Score maintainers (n.d.). Discussion #3, "How do these numbers compare to the findings of Sasha Luccioni's paper from last year?" Hugging Face AI Energy Score Leaderboard. https://huggingface.co/spaces/AIEnergyScore/Leaderboard/discussions/3 (community discussion, not peer-reviewed.)
8. Courty, B., Schmidt, V., Luccioni, S., et al. (2024). *mlco2/codecarbon: v2.4.1.* doi:10.5281/zenodo.11171501.
9. Li, P., Yang, J., Islam, M. A., & Ren, S. (2025). *Making AI Less Thirsty: Uncovering and Addressing the Secret Water Footprint of AI Models.* Communications of the ACM. (Water formula used by the platform; verify volume, pages and DOI against the publisher record.)
10. Wan, T., et al. (2025). *Wan: Open and Advanced Large-Scale Video Generative Models.* arXiv:2503.20314. (Cited within [1].)
11. Radovanović, A., Koningstein, R., Schneider, I., et al. (2023). *Carbon-Aware Computing for Datacenters.* IEEE Transactions on Power Systems. (Carbon and load-shifting framework used by the platform; verify full details against the publisher record.)
