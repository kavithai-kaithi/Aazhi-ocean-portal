# DEEPLENS - 10-Step Live Demonstration Checklist

Use this checklist during live jury presentations or stakeholder reviews to verify all capabilities systematically.

| Step | Action | Expected Result | Verified |
|------|--------|-----------------|:--------:|
| **1** | Open `http://localhost:3000` | 3D Cesium globe renders centered on the Indian Ocean with transparent land boundaries. | [ ] |
| **2** | Switch between **Temperature** and **Salinity** | Legend colormap updates immediately, ocean tiles reflect thermal warm pool vs high-salinity Arabian Sea. | [ ] |
| **3** | Drag **Depth Slider** (0m to 150m to 1000m) | Visual thermocline decay transitions smoothly in under 1 second. | [ ] |
| **4** | Press **Play ▶** on bottom TimePlayer | Monthly monsoon evolution animates across all 12 months with Somali upwelling dynamics. | [ ] |
| **5** | Toggle **Argo Robotic Floats** | Glowing amber float markers appear across the Indian Ocean basin. | [ ] |
| **6** | Click on any **Argo Float marker** | Dual-curve comparison popup opens with inverted depth axis (0-2000m), showing Model vs Observed and calculating Bias & RMSE. | [ ] |
| **7** | Click **Fly to Float** | Smooth camera animation flies to high-resolution view of float coordinates. | [ ] |
| **8** | Toggle **Ocean Currents (Particles)** | Real-time particle advection runs at 60 FPS over the 3D globe showing Ekman transport and Wyrtki jets. | [ ] |
| **9** | Click **Vertical Transect Curtain** (Mumbai to Sumatra) | Plotly vertical cross-section displays 0-2000m oceanographic curtain with thermocline depth profile. | [ ] |
| **10** | Toggle **Model Accuracy Error Map** | 2° x 2° colored error bins reveal basin-wide RMSE distribution at a glance. | [ ] |
