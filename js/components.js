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

customElements.define('feynman-header', FeynmanHeader);
customElements.define('feynman-footer', FeynmanFooter);