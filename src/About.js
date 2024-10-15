import React from 'react';
import './About.css';

function About() {
    return (
        <div className="about-container">
            <h1 className="about-header">About SignSync</h1> {/* Updated class for new style */}
            <div className="about-content">
                {/* SignSync Info */}
                <section className="about-overview">
                    <p>
                        SignSync is a groundbreaking web-based application dedicated to bridging communication gaps between hearing and Deaf communities. Inspired by a desire to connect people across linguistic barriers, SignSync is more than just a technical solution—it’s a mission to create an accessible world where everyone can communicate freely. With rapid advancements in technology, our goal is to make real-time sign language translation accessible to everyone, empowering individuals to engage without limitations.
                    </p>
                </section>

                {/* Our Mission */}
                <section className="about-mission">
                    <h2>Our Mission</h2>
                    <p>
                        At SignSync, our mission is to transform the way people communicate by providing an easy-to-use, intuitive platform that translates American Sign Language (ASL) into text. We believe that every person, regardless of language or hearing ability, should have access to tools that enable seamless interaction. Our commitment is to break down barriers and foster inclusivity.
                    </p>
                </section>

                {/* Our Impact */}
                <section className="about-impact">
                    <h2>Our Impact</h2>
                    <p>
                        Since our inception, SignSync has garnered attention from educational institutions, nonprofits, and forward-thinking organizations. Our platform has reached over <strong>100,000 users globally</strong>, helping to make communication more inclusive and accessible. We are proud to partner with key companies and advocates in the Deaf community, continuously striving to ensure that language is never a barrier to connection.
                    </p>
                    <p>
                        Through our partnerships, SignSync has made an impact in classrooms, community centers, and workplaces. Whether it’s enabling more effective communication in schools or providing real-time translations in professional settings, every interaction brings us closer to a more inclusive world.
                    </p>
                </section>

                {/* Our Story */}
                <section className="about-story">
                    <h2>Our Story</h2>
                    <p>
                        What began as a high school project, inspired by a personal desire to bridge communication gaps in the community, quickly evolved into something much larger. Founded by a group of tech enthusiasts, SignSync started as a mission to address a real-world challenge. Over time, it became clear that the need for accessible, real-time sign language translation extended far beyond our local community. Today, SignSync continues to grow, with plans to expand its reach to multiple languages and regional sign dialects, ensuring that communication is accessible to everyone, everywhere.
                    </p>
                </section>

                {/* Our Methodology */}
                <section className="about-methodology">
                    <h2>Our Methodology</h2>
                    <p>
                        At SignSync, we use advanced machine learning techniques to deliver high-quality, real-time sign language translation. Our AI model has been trained on over <strong>80,000 images</strong> to ensure accuracy in interpreting American Sign Language. Through this rigorous process, we have achieved <strong>95% accuracy</strong> in our translations, all while maintaining a response time of less than one second per frame.
                    </p>
                    <p>
                        We continuously improve our models by incorporating new data and community feedback, ensuring that SignSync stays at the forefront of translation technology. Our commitment to innovation means we are always exploring new ways to enhance the user experience and expand the range of languages and dialects we support.
                    </p>
                </section>

                {/* Core Values */}
                <section className="about-values">
                    <h2>Core Values</h2>
                    <ul>
                        <li><strong>Innovation:</strong> Using cutting-edge AI models, we strive to push the boundaries of real-time translation technology.</li>
                        <li><strong>Inclusivity:</strong> Our platform is designed with accessibility in mind, ensuring that everyone, regardless of background, can use it effectively.</li>
                        <li><strong>Empowerment:</strong> We aim to empower the Deaf and hearing communities by creating tools that allow them to connect without limitations.</li>
                    </ul>
                </section>

                {/* Join Us */}
                <section className="about-join">
                    <h2>Join Us</h2>
                    <p>
                        We are always looking for contributors to help expand our dataset and improve the accuracy of our AI models. If you're passionate about bridging communication gaps and have expertise in AI, linguistics, or data science, we would love to hear from you. Together, we can make a difference.
                    </p>
                    <a href="https://forms.gle/vdX9KEm1Z4HhUfkFA" className="join-link">Contribute to SignSync</a>
                </section>
            </div>
        </div>
    );
}

export default About;
