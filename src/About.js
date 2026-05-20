import React from "react";

const capabilities = [
  "Live webcam translation backed by TensorFlow inference and delivered over REST or Socket.IO.",
  "A configurable transfer-learning pipeline covering ResNet50, VGG16, InceptionV3, and MobileNetV2.",
  "A responsive interface that keeps the translator, transcript, and confidence feedback easy to read.",
];

const roadmap = [
  "Expand from alphabet recognition into phrase-level translation and temporal gesture modeling.",
  "Add stronger dataset versioning, evaluation reporting, and benchmark visibility.",
  "Harden production deployment for AWS with better environment and observability controls.",
];

function About() {
  return (
    <main className="section-shell pb-16 pt-8 sm:pb-20 sm:pt-12">
      <section className="panel-shell px-6 py-8 sm:px-10 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <p className="soft-label">About SignSync</p>
            <h1 className="max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
              A cleaner path from live ASL gestures to readable text.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate sm:text-lg">
              SignSync exists to reduce communication friction between Deaf and hearing users through live ASL-to-text translation.
              The project combines a practical browser interface with a TensorFlow pipeline that can keep improving as the dataset and models mature.
            </p>
          </div>

          <div className="rounded-[20px] border border-black/5 bg-[#fbfaf7] p-6">
            <div>
              <p className="soft-label">Architecture</p>
              <p className="mt-2 text-sm leading-6 text-slate">
                React and Tailwind power the interface, while Flask, TensorFlow, and Socket.IO handle model inference and live prediction transport.
              </p>
            </div>
            <div className="mt-5">
              <p className="soft-label">Model Strategy</p>
              <p className="mt-2 text-sm leading-6 text-slate">
                The repo now includes a configurable transfer-learning training flow covering ResNet50, VGG16, InceptionV3, and MobileNetV2.
              </p>
            </div>
            <div className="mt-5">
              <p className="soft-label">Current Scope</p>
              <p className="mt-2 text-sm leading-6 text-slate">
                The live translator is optimized for alphabet recognition with transcript capture, confidence scoring, and cross-device responsiveness.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="panel-shell px-6 py-8 sm:px-8">
          <p className="soft-label">What’s in the product</p>
          <div className="mt-5 space-y-4">
            {capabilities.map((item) => (
              <div key={item} className="rounded-2xl border border-black/5 bg-[#fbfaf7] px-4 py-4 text-sm leading-6 text-slate">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="panel-shell px-6 py-8 sm:px-8">
          <p className="soft-label">Forward path</p>
          <div className="mt-5 space-y-4">
            {roadmap.map((item) => (
              <div key={item} className="rounded-2xl border border-black/5 bg-[#fbfaf7] px-4 py-4 text-sm leading-6 text-slate">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
