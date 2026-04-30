import React, { useMemo, useRef, useState } from "react";

const templates = [
  {
    name: "Cards Against Humanity",
    price: 59,
    description: "Party cards, custom prompts, hilarious inside jokes.",
  },
  {
    name: "Catan",
    price: 79,
    description: "Tile strategy format with custom resources and rules.",
  },
  {
    name: "Ticket to Ride",
    price: 74,
    description: "Route-building gameplay with personalized maps/cities.",
  },
  {
    name: "Uno",
    price: 49,
    description: "Fast card-play game with custom action cards and themes.",
  },
];

const shippingOptions = [
  { name: "Economy", value: 8 },
  { name: "Standard", value: 14 },
  { name: "Expedited", value: 24 },
];

const defaultSimilarResult =
  "Top match: Catan-style strategy (resource trading + map control)";

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [boardSize, setBoardSize] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [premiumBox, setPremiumBox] = useState(false);
  const [similarSearch, setSimilarSearch] = useState("");
  const [shippingSpeed, setShippingSpeed] = useState(shippingOptions[0]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [orderFeedback, setOrderFeedback] = useState({
    type: "",
    message: "",
  });

  const orderFormRef = useRef(null);

  const totalPrice = useMemo(() => {
    return (
      selectedTemplate.price +
      boardSize +
      cardCount +
      (premiumBox ? 9 : 0) +
      shippingSpeed.value
    );
  }, [selectedTemplate, boardSize, cardCount, premiumBox, shippingSpeed]);

  const similarResult = useMemo(() => {
    const term = similarSearch.trim().toLowerCase();
    if (!term) {
      return defaultSimilarResult;
    }

    const gameSignals = [
      {
        key: "monopoly",
        result:
          "Top match: Ticket to Ride-style progression and route ownership.",
      },
      {
        key: "dominion",
        result: "Top match: Cards Against Humanity-style deck-driven card flow.",
      },
      {
        key: "pandemic",
        result:
          "Top match: Catan-style cooperative planning with shared goals.",
      },
      { key: "uno", result: "Top match: Uno-style quick rounds and action cards." },
    ];

    const found = gameSignals.find((signal) => term.includes(signal.key));
    return found
      ? found.result
      : `Top match: ${selectedTemplate.name}-inspired structure with custom content.`;
  }, [similarSearch, selectedTemplate]);

  const handlePlaceOrder = () => {
    const name = recipientName.trim();
    const email = recipientEmail.trim();
    const hasMessage = giftMessage.trim().length > 0;
    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailLooksValid || !hasMessage) {
      setOrderFeedback({
        type: "error",
        message:
          "Please provide recipient name, a valid email, and a gift message before placing your order.",
      });
      return;
    }

    setOrderFeedback({
      type: "success",
      message: `Order queued: ${selectedTemplate.name} gift for ${name}. Estimated total $${totalPrice.toFixed(
        2
      )}. Confirmation and tracking simulation sent to ${email}.`,
    });
  };

  return (
    <>
      <header className="hero">
        <nav className="top-nav">
          <div className="brand">BoardForge Gifts</div>
          <button className="nav-btn" type="button">
            Sign In
          </button>
        </nav>
        <div className="hero-content">
          <p className="pill">Primary launch user: Board-game hobbyists</p>
          <h1>
            Build a custom board game gift and ship it directly to your friend.
          </h1>
          <p className="subtitle">
            Design online, preview in real time, pay with Stripe, and send with
            Shippo-powered carrier rates.
          </p>
          <a className="cta" href="#templates">
            Start Designing
          </a>
        </div>
      </header>

      <main>
        <section id="templates" className="section">
          <h2>Choose a base game style</h2>
          <p className="section-copy">
            Pick one of the MVP inspirations, then personalize every detail.
          </p>
          <div className="template-grid">
            {templates.map((template) => (
              <article
                key={template.name}
                className={`card template-card ${
                  selectedTemplate.name === template.name ? "selected" : ""
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <span className="tag">Starting at ${template.price}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section config-grid">
          <div className="card">
            <h2>Customize components</h2>
            <label htmlFor="similar-search">Find a similar game style</label>
            <input
              id="similar-search"
              type="search"
              placeholder="Search examples: Monopoly, Dominion, Pandemic"
              value={similarSearch}
              onChange={(event) => setSimilarSearch(event.target.value)}
            />
            <p className="muted">{similarResult}</p>

            <div className="form-row">
              <label htmlFor="board-size">Board size</label>
              <select
                id="board-size"
                value={boardSize}
                onChange={(event) => setBoardSize(Number(event.target.value))}
              >
                <option value={0}>Standard (included)</option>
                <option value={12}>Large (+$12)</option>
                <option value={20}>Premium fold-out (+$20)</option>
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="card-count">Card count</label>
              <select
                id="card-count"
                value={cardCount}
                onChange={(event) => setCardCount(Number(event.target.value))}
              >
                <option value={0}>Base deck (included)</option>
                <option value={10}>+50 cards (+$10)</option>
                <option value={18}>+100 cards (+$18)</option>
              </select>
            </div>

            <div className="form-row">
              <label>
                <input
                  type="checkbox"
                  checked={premiumBox}
                  onChange={(event) => setPremiumBox(event.target.checked)}
                />{" "}
                Premium gift box (+$9)
              </label>
            </div>
          </div>

          <div className="card checkout-card">
            <h2>Gift checkout preview</h2>
            <ul className="summary-list">
              <li>
                <span>Template</span>
                <strong>{selectedTemplate.name}</strong>
              </li>
              <li>
                <span>Shipping speed</span>
                <strong>{shippingSpeed.name}</strong>
              </li>
              <li>
                <span>Shipping cost</span>
                <strong>${shippingSpeed.value.toFixed(2)}</strong>
              </li>
              <li>
                <span>Estimated production</span>
                <strong>2-4 business days</strong>
              </li>
              <li>
                <span>Economy delivery window</span>
                <strong>5-8 business days total</strong>
              </li>
              <li>
                <span>Standard delivery window</span>
                <strong>4-6 business days total</strong>
              </li>
              <li>
                <span>Expedited delivery window</span>
                <strong>2-4 business days total</strong>
              </li>
              <li>
                <span>Payments</span>
                <strong>Stripe</strong>
              </li>
              <li>
                <span>Shipping API</span>
                <strong>Shippo</strong>
              </li>
            </ul>
            <div className="price">
              <span>Total</span>
              <strong>${totalPrice.toFixed(2)}</strong>
            </div>
            <button
              className="cta full"
              type="button"
              onClick={() =>
                orderFormRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            >
              Continue to Checkout
            </button>
          </div>
        </section>

        <section className="section">
          <div className="card order-form-card" ref={orderFormRef}>
            <h2>Recipient + checkout info</h2>
            <p className="section-copy">
              This MVP simulates checkout and order placement in-browser.
            </p>
            <div className="form-row">
              <label htmlFor="recipient-name">Recipient name</label>
              <input
                id="recipient-name"
                type="text"
                placeholder="Jamie Rivera"
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="recipient-email">Recipient email</label>
              <input
                id="recipient-email"
                type="email"
                placeholder="jamie@example.com"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="gift-message">Gift message</label>
              <textarea
                id="gift-message"
                rows="4"
                placeholder="Happy birthday! Built this game around all your favorite inside jokes."
                value={giftMessage}
                onChange={(event) => setGiftMessage(event.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="shipping-speed">Shipping speed</label>
              <select
                id="shipping-speed"
                value={shippingSpeed.value}
                onChange={(event) => {
                  const selected = shippingOptions.find(
                    (option) => option.value === Number(event.target.value)
                  );
                  if (selected) {
                    setShippingSpeed(selected);
                  }
                }}
              >
                {shippingOptions.map((option) => (
                  <option key={option.name} value={option.value}>
                    {option.name} (+${option.value})
                  </option>
                ))}
              </select>
            </div>
            <button className="cta" type="button" onClick={handlePlaceOrder}>
              Place MVP Order
            </button>
            <p
              className={`order-feedback muted ${
                orderFeedback.type === "success"
                  ? "success"
                  : orderFeedback.type === "error"
                  ? "error"
                  : ""
              }`}
              role="status"
              aria-live="polite"
            >
              {orderFeedback.message}
            </p>
          </div>
        </section>

        <section className="section">
          <h2>Simple user flow</h2>
          <ol className="flow-list">
            <li>Pick a template style.</li>
            <li>Customize visuals, cards, and components.</li>
            <li>Approve print proof and add to cart.</li>
            <li>Enter recipient address and select shipping speed.</li>
            <li>Pay with Stripe.</li>
            <li>Production starts and Shippo label/tracking is generated.</li>
            <li>Order is delivered and sender gets confirmation.</li>
          </ol>
        </section>
      </main>

      <footer className="footer">
        <small>
          Prototype only. No live payment or shipping transactions are executed.
        </small>
      </footer>
    </>
  );
}

export default App;
