import React from "react";

const capabilities = [
  "Live webcam translation with a TensorFlow inference backend and REST/WebSocket delivery.",
  "Transfer-learning training pipeline with ResNet50, VGG16, InceptionV3, and MobileNetV2 backbones.",
  "Responsive React + Tailwind interface tuned for desktop and mobile use.",
];

const roadmap = [
  "Expand beyond alphabet classification into phrase-level decoding and temporal gesture modeling.",
  "Add curated dataset versioning, formal benchmarking, and downloadable evaluation reports.",
  "Harden production deployment for AWS with environment-specific model routing and observability.",
];

function About() {
  return (
    <main className="section-shell pb-20 pt-10 sm:pb-24 sm:pt-14">
      <section className="panel-shell relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(109,184,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,145,102,0.16),_transparent_28%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-signal">
              Mission
            </span>
            <h1 className="max-w-3xl font-serif text-4xl leading-tight text-white sm:text-5xl">
              Build an ASL translator that is technically credible, fast in the browser, and usable in the real world.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              SignSync exists to reduce communication friction between Deaf and hearing users through live ASL-to-text translation.
              The platform combines modern frontend ergonomics with a TensorFlow model pipeline designed for transfer learning and rapid iteration.
            </p>
          </div>

          <div className="grid gap-4 rounded-[24px] border border-white/10 bg-slate/60 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-aurora">Architecture</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                React and Tailwind power the interface, while Flask, TensorFlow, and Socket.IO handle model inference and live prediction transport.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-aurora">Model Strategy</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                The repo now includes a configurable transfer-learning training flow covering ResNet50, VGG16, InceptionV3, and MobileNetV2.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-aurora">Current Scope</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                The live translator is optimized for alphabet recognition with transcript capture, confidence scoring, and cross-device responsiveness.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="panel-shell px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">What’s in the product</p>
          <div className="mt-5 space-y-4">
            {capabilities.map((item) => (
              <div key={item} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="panel-shell px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-signal">Forward path</p>
          <div className="mt-5 space-y-4">
            {roadmap.map((item) => (
              <div key={item} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
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
