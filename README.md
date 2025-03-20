# Cognify: Visualize Cognitive Load Through Sound

**Cognify** is an interactive web application that transforms stress and cognitive load data into both visual **and** audio experiences. By combining traditional data visualization with **audio representation**, Cognify provides a multisensory approach to uncovering patterns in physiological data—such as heart rate, GSR (galvanic skin response), and other stress indicators.

> **Award**  
> Winner of the **People's Choice Award** at UCSD's DSC106 Data Visualization Project Showcase

---

## Table of Contents
1. [Why Visualize Data with Audio?](#why-visualize-data-with-audio)  
2. [The Power of Data Sonification](#the-power-of-data-sonification)  
3. [Features](#features)  
4. [How It Works](#how-it-works)  
5. [Try It Yourself](#try-it-yourself)  
6. [Use Cases](#use-cases)  
7. [Implementation](#implementation)  
8. [Deployment](#deployment)  
9. [Project Structure](#project-structure)  
10. [Additional Details](#additional-details)  
11. [Developed By](#developed-by)

---

## Why Visualize Data with Audio?

Traditional data visualization relies solely on visual perception, but our brains process auditory information through different neural pathways. By adding sound:

- **Pattern Recognition:** We can detect trends and anomalies that might be missed visually.  
- **Temporal Awareness:** Sound naturally maps to time, making it ideal for time-series data.  
- **Cognitive Offloading:** Reducing visual cognitive load allows for better pattern detection.  
- **Accessibility:** Offers alternative means of data perception for varying learning styles.  
- **Emotional Connection:** Sound creates a more visceral, intuitive understanding of data.

This multisensory approach often reveals subtle shifts in stress responses that might otherwise remain undetected in traditional visualizations.

---

## The Power of Data Sonification

**Sonification**—the process of translating data into sound—unlocks unique insights in stress research:

- **Intuitive Stress Perception:** Harsh waveforms (e.g., sawtooth, square) can instantly convey high-stress moments.  
- **Rhythm Detection:** Human ears are highly sensitive to rhythm and pattern changes, illuminating small stress fluctuations (like exam anxiety spikes).  
- **Accessibility:** Makes data exploration feasible for those with visual impairments.  
- **Subconscious Processing:** Our brains process audio in the background, allowing for passive pattern recognition even when visual attention is elsewhere.

> In user testing, participants identified critical stress events **23% faster** using audio-augmented visual representations compared to visuals alone.

---

## Features

### Dataset Exploration
- **Curated Stress Datasets:** Browse pre-loaded scenarios (driving and exam data) in an album-like interface.  
- **Compare Subjects:** Analyze multiple subjects side-by-side or view averaged data.  
- **Synchronized Playback:** Play through data with corresponding audio and visual updates.  
- **Playback Controls:** Adjust playback speed and volume on the fly.

### Interactive Visualizations
- **Dynamic Line Charts:** Hover to inspect exact data points.  
- **Real-Time Waveform Visualization:** See audio waveforms that reflect stress metrics.  
- **Pulsing Circular Visualization:** Circles respond to intensity levels in the data.  
- **Audio Frequency Mapping:** Stress levels are mapped to various frequencies for immediate auditory feedback.

### Data Upload Options
- **CSV Support:** Upload CSVs containing timestamps and relevant metrics (heart rate, GSR, etc.).  
- **Apple Health Export:** Load data from Apple Health `.zip` files.  
- **Auto Detection:** Automatically detects column headers and can calculate averages if desired.  
- **Preview & Configuration:** Confirm and adjust mappings before visualization begins.

### Customization
- **Waveform Types:** Choose from sine, triangle, square, sawtooth, and more.  
- **Pitch & Volume Control:** Fine-tune the audio to highlight key stress moments.  
- **Custom Audio Files:** Optionally upload your own audio samples to enhance uniqueness.  
- **Playback Speed:** Control data playback rate to focus on specific intervals of interest.

---

## How It Works

1. **Load Data**  
   Select from the included datasets or upload your own CSV/Apple Health data.  

2. **Map Values to Sound**  
   The Web Audio API maps data (e.g., heart rate) to synthesized oscillators or filters.  

3. **Visual Representation**  
   D3.js plots real-time charts and interactive visuals (lines, circles) in sync with audio playback.  

4. **Explore & Interact**  
   Hover over points to see exact values, experiment with different waveforms, and adjust speed or volume to isolate stress points.

---

## Try It Yourself

Access the live demo here:  
[https://devklim.github.io/cognitive-waveform/](https://devklim.github.io/cognitive-waveform/)

1. Explore **pre-loaded datasets** (driving, exam scenarios).  
2. **Upload your own CSV** for custom stress metrics.  
3. **Import Apple Health** `.zip` exports for personal data insights.  
4. Toggle **audio waveform types** and pitch settings to highlight meaningful patterns.

---

## Use Cases

- **Researchers:** Study and compare stress patterns across numerous participants.  
- **Athletes:** Track physiological stress responses during competitions or workouts.  
- **Students:** Visualize and hear stress changes during exam sessions.  
- **Meditation Practitioners:** Observe data patterns in heart rate or GSR during mindfulness exercises.  
- **Developers:** Integrate with wearable biometrics for real-time audio feedback loops.

---

## Implementation

Cognify is a **client-side** web application built with:
- **Vanilla JavaScript** for the core logic.  
- **D3.js** for dynamic, data-driven visualizations.  
- **Web Audio API** for generating and manipulating audio in real time.  
- **Papa Parse** for CSV file parsing.

**Key Components:**
- **Album Interface:** A Spotify-inspired layout for switching between datasets.  
- **Data Manager:** Unified approach to handle both CSV and Apple Health data.  
- **Audio Processor:** Maps incoming data to frequency, waveform, and other parameters.  
- **Visualization Engine:** Renders synchronized charts, waveforms, and interactive elements.

---

## Deployment

Cognify is deployed via **GitHub Pages**, making it easily accessible in modern browsers without installation. All operations run **in your local browser**, requiring no backend services.

Simply open:  
[https://devklim.github.io/cognitive-waveform/](https://devklim.github.io/cognitive-waveform/)

---

## Project Structure

**cognitive-waveform/**  
• **js/**  
&nbsp;&nbsp;• app-state.js (Core state management)  
&nbsp;&nbsp;• data-manager.js (Data processing)  
&nbsp;&nbsp;• chart-visualizer.js (Data visualization)  
&nbsp;&nbsp;• audio-processor.js (Sound generation)  
&nbsp;&nbsp;• waveform-visualizer.js (Audio visualization)  
&nbsp;&nbsp;• bottom-wave.js (UI animation)  
&nbsp;&nbsp;• upload.js (Upload functionality)  
• **css/** (Styling)  
• **data/** (Sample datasets: driving, exam scenarios)  
• albums.html (Dataset selection page)  
• visualizer.html (Main visualization page)  
• index.html (Entry point)

---

## Additional Details

- **Security & Privacy:**  
  All data is processed locally in the client’s browser. No data is saved or transmitted.  

- **Roadmap:**  
  - Enhanced audio effects (filters, spatial audio)  
  - Machine learning for automated stress anomaly detection  
  - Collaboration tools for shared real-time analysis sessions  

- **License:**  
  Currently for educational purposes. Please contact the developer regarding reuse or licensing.

---

## Developed By

Cognify was developed by [Kliment Ho](https://github.com/devklim), written by Stephanie Luo, and data processing by Cherie Xiao and Marco Liu in the DSC106 Data Visualization course at UC San Diego, garnering the **People's Choice Award**. 

For questions, suggestions, or contributions, feel free to open an issue or reach out on GitHub.

> **Disclaimer:**  
> This project is for educational use. While it can handle personal health data, all processing occurs locally. Use at your discretion.