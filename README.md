# SignSync  
**AI-Powered American Sign Language (ASL) Translator**

SignSync is an AI-driven ASL-to-text web application that bridges the communication gap between the Deaf and hearing communities.  
Built using deep learning and modern web technologies, it recognizes real-time ASL gestures and translates them into English text through an accessible, responsive interface.

---

## Features
- **Real-Time Translation:** Converts ASL hand gestures to English text using a trained Convolutional Neural Network (CNN).  
- **High Accuracy:** Model trained on **80K+ labeled ASL images** with over **95% recognition accuracy**.  
- **Accessible Design:** Clean, modern UI built with **React + TailwindCSS** for seamless interaction.  
- **Scalable Backend:** Flask API deployed on **AWS**, integrating TensorFlow model inference and REST endpoints.  
- **Cross-Device Support:** Works smoothly across desktop and mobile browsers.

---

## Tech Stack
**Frontend:** React, TailwindCSS  
**Backend:** Flask (Python), TensorFlow, scikit-learn  
**Deployment:** AWS EC2, S3  
**Languages:** Python, JavaScript, HTML, CSS  
**Version Control:** Git + GitHub  

---

## Model Overview
The AI model leverages transfer learning with architectures such as **ResNet50**, **VGG16**, and **InceptionV3** to balance real-time inference speed and accuracy.  
It was trained on a custom dataset of over 80,000 ASL gesture images, processed with OpenCV and NumPy.  
Evaluation achieved a validation accuracy of **95%+** with strong generalization across lighting and background conditions.

---

## Setup Instructions for Local Device

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- TensorFlow and Flask installed locally

