const page_order = [
    {title: "Principle of Virtual Work", url: "/volume1/chapter4/virtualwork.html"},
    {title: "Pendulum Energy Conservation", url: "/volume1/chapter4/pendulum.html"},
    {title: "Galileo's Ramp", url: "/volume1/chapter5/galileo.html"},
    {title: "Binomial Distribution", url: "/volume1/chapter6/binomial.html"},
    {title: "Random Walk", url: "/volume1/chapter6/random.html"},
    {title: "Kepler's Laws", url: "/volume1/chapter7/kepler.html"},
    {title: "Independence of Horizontal and Vertical Motion", url: "/volume1/chapter7/independence.html"},
    {title: "Newton's Cannonball", url: "/volume1/chapter7/newton.html"},
    {title: "Tides", url: "/volume1/chapter7/tides.html"},
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
          <a href="/index.html"><h1>Feynman Interactive</h1></a>
        </section>
        <nav>
          <a href="/index.html"><strong>Home</strong></a>
          <a href="/about.html"><strong>About</strong></a>
          <a href="/contact.html"><strong>Contact</strong></a>
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
        const currentIndex = page_order.findIndex(page => page.url === window.location.pathname);
        if (currentIndex === -1) return;

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
            const prev = page_order[currentIndex - 1];
            html += `<a href="${prev.url}" class="nav-arrow nav-prev" title="${prev.title}">‹</a>`;
        }

        if (currentIndex < page_order.length - 1) {
            const next = page_order[currentIndex + 1];
            html += `<a href="${next.url}" class="nav-arrow nav-next" title="${next.title}">›</a>`;
        }

        this.innerHTML = html;
    }
}

customElements.define('feynman-nav', FeynmanNav);
customElements.define('feynman-header', FeynmanHeader);
customElements.define('feynman-footer', FeynmanFooter);