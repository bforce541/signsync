// src/About.js

import React from 'react';
import './About.css';

const About = () => {
    return (
        <div className="about-container">
            <section className="about-header">
                <h1>About Us</h1>
                <p className="intro-text">
                    Welcome to Brainy Crew! Our mission is to empower aspiring developers and coders through immersive learning experiences.
                </p>
            </section>

            <section className="about-mission">
                <h2>Our Mission</h2>
                <p>
                    We aim to provide high-quality coding education, hands-on tutorials, and innovative resources that foster curiosity, collaboration, and problem-solving skills.
                </p>
            </section>

            <section className="about-vision">
                <h2>Our Vision</h2>
                <p>
                    Brainy Crew envisions a world where anyone, regardless of their background, can become a part of the tech community and create impactful solutions for the future.
                </p>
            </section>

            <section className="about-team">
                <h2>Meet the Team</h2>
                <p>
                    Our team consists of experienced developers, educators, and mentors who are passionate about sharing knowledge and nurturing the next generation of tech innovators.
                </p>
            </section>

            <section className="about-goals">
                <h2>Our Goals</h2>
                <ul>
                    <li>Offer engaging coding courses for all skill levels.</li>
                    <li>Provide certification programs to boost career growth.</li>
                    <li>Host community events that inspire collaboration and networking.</li>
                    <li>Continuously update our resources with the latest technologies and trends.</li>
                </ul>
            </section>

            <section className="about-call-to-action">
                <h2>Join Us</h2>
                <p>
                    Ready to start your coding journey? Join Brainy Crew today and become part of a growing community of tech enthusiasts!
                </p>
            </section>
        </div>
    );
};

export default About;
