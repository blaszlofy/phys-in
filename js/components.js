const page_order = [
    {title: "Principle of Virtual Work", url: "/volume1/chapter4/virtualwork"},
    {title: "Pendulum Energy Conservation", url: "/volume1/chapter4/pendulum"},
    {title: "Galileo's Ramp", url: "/volume1/chapter5/galileo"},
    {title: "Binomial Distribution", url: "/volume1/chapter6/binomial"},
    {title: "Random Walk", url: "/volume1/chapter6/random"},
    {title: "Kepler's Laws", url: "/volume1/chapter7/kepler"},
    {title: "Independence of Horizontal and Vertical Motion", url: "/volume1/chapter7/independence"},
    {title: "Newton's Cannonball", url: "/volume1/chapter7/newton"},
    {title: "Tides", url: "/volume1/chapter7/tides"},
    {title: "Speed as a Derivative", url: "/volume1/chapter8/derivative"},
    {title: "Distance as an Integral", url: "/volume1/chapter8/integral"},
    {title: "Numerical Methods", url: "/volume1/chapter9/numerical"},
    {title: "Galilean Relativity & Inelastic Collisions", url: "/volume1/chapter10/inelastic"},
    {title: "Elastic Collisions", url: "/volume1/chapter10/elastic"},
    {title: "Gravitational Field Superposition", url: "/volume1/chapter12/superposition"},
    {title: "Pseudo Forces", url: "/volume1/chapter12/pseudo"},
    {title: "Harmonic Motion", url: "/volume1/chapter21/harmonic"},
    {title: "Forced Damped Oscillator", url: "/volume1/chapter23/forced"},
    {title: "Damped Oscillations", url: "/volume1/chapter24/damped"},
    {title: "Principle of Least Time", url: "/volume1/chapter26/leasttime"},
    {title: "The Sum Over Paths", url: "/volume1/chapter26/sum"},
    {title: "Resolving Power", url: "/volume1/chapter27/resolution"},
    {title: "Electric Field of an Accelerating Charge", url: "/volume1/chapter28/field"},
    {title: "Electromagnetic Radiation", url: "/volume1/chapter28/radiation"},
    {title: "Electromagnetic Radiation - 2", url: "/volume1/chapter28/radiation2"},
    {title: "Interference From Two Charges", url: "/volume1/chapter28/interference"},
    {title: "Multiple Source Interference", url: "/volume1/chapter29/interference"},
    {title: "Diffraction Pattern", url: "/volume1/chapter30/diffraction"},
    {title: "Shadow Edge Diffraction", url: "/volume1/chapter30/shadow"},
    {title: "Radiation from a Sheet of Charges", url: "/volume1/chapter30/sheet"},
    {title: "The Origin of the Refractive Index", url: "/volume1/chapter31/refractive"},
    {title: "Scattering of Light", url: "/volume1/chapter32/scattering"},
    {title: "Electric Field from Relativistic Speeds", url: "/volume1/chapter34/relativistic"},
    {title: "Doppler Effect", url: "/volume1/chapter34/doppler"},
    {title: "Ideal Gas Law", url: "/volume1/chapter39/gas"},
    {title: "Distribution of Molecules in an Atmosphere", url: "/volume1/chapter40/atmosphere"},
    {title: "Brownian Motion", url: "/volume1/chapter41/brown"},
    {title: "Ionic Drift Velocity", url: "/volume1/chapter43/ion"},
    {title: "Molecular Diffusion", url: "/volume1/chapter43/diffusion"},
    {title: "The Wave Equation", url: "/volume1/chapter47/wave"},
    {title: "Acoustic Beats", url: "/volume1/chapter48/beats"},
    {title: "Phase Velocity & Group Velocity", url: "/volume1/chapter48/velocity"},
    {title: "Coupled Pendulums", url: "/volume1/chapter48/pendulum"},
    {title: "Reflection of Waves", url: "/volume1/chapter49/reflection"},
    {title: "Fourier Series of a Plucked String", url: "/volume1/chapter50/fourier"},
    {title: "Manufacturing Musical Tones", url: "/volume1/chapter50/note"},
    {title: "Surface Waves", url: "/volume1/chapter51/surface"},
];

class FeynmanHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: #ffffff;
          border-bottom: 1px solid #e0e6ef;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f77b4;
        }
        section a {
            text-decoration: none;
        }
        nav a {
          margin-left: 1.5rem;
          text-decoration: none;
          color: #1f77b4;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        nav a:hover {
          color: #62a4f8;
        }
        strong {
          font-weight: 500;
        }
      </style>
      <header>
        <section>
          <a href="/"><h1>Feynman Interactive</h1></a>
        </section>
        <nav>
          <a href="/"><strong>Home</strong></a>
          <a href="/about"><strong>About</strong></a>
          <a href="/contact"><strong>Contact</strong></a>
          <a href="https://github.com/blaszlofy/feynman-interactive" target="_blank" rel="noopener noreferrer">
            <strong>GitHub</strong>
          </a>
        </nav>
      </header>
    `;
    }
}

class FeynmanFooter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: #ffffff;
          border-top: 1px solid #e0e6ef;
          text-align: center;
          padding: 1.5rem;
          color: #5d6370;
          font-size: 0.875rem;
        }
        p {
          margin: 0.25rem 0;
        }
      </style>
      <footer>
        <p>An independent project. Not affiliated with Caltech or The Feynman Lectures on Physics.</p>
        <p>&copy; 2026</p>
      </footer>
    `;
    }
}

class FeynmanNav extends HTMLElement {
    connectedCallback() {
        const currentPath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '')

        const currentIndex = page_order.findIndex(page => {
            const pagePath = page.url.replace(/\.html$/, '').replace(/\/$/, '')
            return pagePath === currentPath
        });

        if (currentIndex === -1) return

        let html = `
        <style>
            .nav-arrow { 
                position: fixed; top: 50%; transform: translateY(-50%); 
                font-size: 6rem; color: #c7c7c7; text-decoration: none; 
                padding: 1rem; z-index: 100; user-select: none; transition: color 0.2s;
            }
            .nav-arrow:hover { color: #1f77b4; }
            .nav-prev { left: 1rem; }
            .nav-next { right: 1rem; }
            @media (max-width: 1400px) { .nav-arrow { display: none; } }
        </style>`;

        if (currentIndex > 0) {
            const prev = page_order[currentIndex - 1]
            html += `<a href="${prev.url}" class="nav-arrow nav-prev" title="${prev.title}">‹</a>`
        }

        if (currentIndex < page_order.length - 1) {
            const next = page_order[currentIndex + 1]
            html += `<a href="${next.url}" class="nav-arrow nav-next" title="${next.title}">›</a>`
        }

        this.innerHTML = html
    }
}

class FeynmanWarning extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            @media (min-width: 768px) {
                .warning {
                    display: none;
            }
        }
        .warning {
            font-size: 1.2rem;
            color: #ff8787;
            text-align: center;
        }
        </style>
        <div class="warning">
            <p>For the best experience, please view this site on a larger screen. These simulations feature multiple plots and interactive elements optimized for desktop and laptop computers.</p>
        </div>
    `;
    }
}

customElements.define('feynman-nav', FeynmanNav);
customElements.define('feynman-warning', FeynmanWarning);
customElements.define('feynman-header', FeynmanHeader);
customElements.define('feynman-footer', FeynmanFooter);