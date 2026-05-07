import React, { useEffect, useMemo, useRef, useState } from "react";

const templates = [
  {
    name: "Uno",
    price: 49,
    description: "Fast card-play game with custom action cards and themes.",
  },
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
];

const [featuredTemplate, ...otherTemplates] = templates;

const unoThemeOptions = [
  { id: "red", label: "Cherry" },
  { id: "blue", label: "Bolt" },
  { id: "yellow", label: "Sunny" },
  { id: "green", label: "Lime" },
];

const unoThemeColors = {
  red: { main: "#e11d48", light: "#ffe4e6" },
  blue: { main: "#2563eb", light: "#dbeafe" },
  yellow: { main: "#ca8a04", light: "#fef9c3" },
  green: { main: "#15803d", light: "#dcfce7" },
};

const defaultUnoStudio = {
  deckName: "The Smith Crew",
  wildRule: "Pick any color — next player draws two and tells a joke!",
  drawFourNote: "Drop four cards and your best dramatic gasp.",
  reverseNote: "Turn order flips. Blame the family dog.",
  skipNote: "Skip whoever hogs the playlist.",
  theme: "red",
};

function UnoPreviewCard({ variant, deckName, wildRule, drawFourNote, reverseNote, skipNote, themeKey }) {
  const t = unoThemeColors[themeKey] || unoThemeColors.red;
  const footer = (
    <div className="uno-preview-footer">
      <span className="uno-preview-deck">{deckName || "Your deck name"}</span>
    </div>
  );

  const label =
    variant === "wild"
      ? "Wild card"
      : variant === "drawFour"
      ? "Wild draw four"
      : variant === "reverse"
      ? "Reverse"
      : "Skip";

  let face = null;
  if (variant === "wild") {
    face = (
      <div className="uno-preview-card-face uno-preview-card-face--wild">
        <div className="uno-preview-wild-panel">
          <span className="uno-preview-ribbon">WILD</span>
          <p className="uno-preview-rule">{wildRule}</p>
        </div>
        {footer}
      </div>
    );
  } else if (variant === "drawFour") {
    face = (
      <div
        className="uno-preview-card-face uno-preview-card-face--drawfour"
        style={{ "--uno-accent": t.main, "--uno-accent-soft": t.light }}
      >
        <div className="uno-preview-drawfour-mark">
          <span className="uno-preview-big">+4</span>
          <span className="uno-preview-drawfour-wild">WILD</span>
        </div>
        <p className="uno-preview-sub">{drawFourNote}</p>
        {footer}
      </div>
    );
  } else if (variant === "reverse") {
    face = (
      <div
        className="uno-preview-card-face uno-preview-card-face--action"
        style={{ background: `linear-gradient(145deg, ${t.main}, ${t.main}dd)` }}
      >
        <span className="uno-preview-action-title">REVERSE</span>
        <span className="uno-preview-icon" aria-hidden="true">
          ⇄
        </span>
        <p className="uno-preview-sub uno-preview-sub--on-color">{reverseNote}</p>
        {footer}
      </div>
    );
  } else {
    face = (
      <div
        className="uno-preview-card-face uno-preview-card-face--action"
        style={{ background: `linear-gradient(145deg, ${t.main}, ${t.main}cc)` }}
      >
        <span className="uno-preview-action-title">SKIP</span>
        <span className="uno-preview-icon uno-preview-icon--skip" aria-hidden="true">
          ⊘
        </span>
        <p className="uno-preview-sub uno-preview-sub--on-color">{skipNote}</p>
        {footer}
      </div>
    );
  }

  return (
    <div className="uno-preview-wrap">
      <p className="uno-preview-type-label">{label}</p>
      <div className={`uno-preview-card uno-preview-card--${variant}`}>{face}</div>
    </div>
  );
}

const shippingOptions = [
  { name: "Economy", value: 8 },
  { name: "Standard", value: 14 },
  { name: "Expedited", value: 24 },
];

const storageKey = "boardforge-orders";
const stripePaymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK || "";
const orderWebhookUrl = import.meta.env.VITE_ORDER_WEBHOOK_URL || "";
const dogPosePrompts = ["Playful jump", "Puppy side-eye", "Victory tail wag"];
const numberCardValues = [3, 7, 9];
const unoCardOneImage = "/uno-card-one.png";
const dogReplaceOneImage = "/dog-replace-one.png";

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [shippingSpeed, setShippingSpeed] = useState(shippingOptions[0]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [orderFeedback, setOrderFeedback] = useState({
    type: "",
    message: "",
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [webhookStatus, setWebhookStatus] = useState("");
  const [unoStudio, setUnoStudio] = useState(defaultUnoStudio);
  const [uploadedDogImages, setUploadedDogImages] = useState([]);

  const orderFormRef = useRef(null);

  const updateUnoStudio = (patch) => {
    setUnoStudio((prev) => ({ ...prev, ...patch }));
  };

  const handleDogImageUpload = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 3);
    if (files.length === 0) return;

    setUploadedDogImages((previous) => {
      previous.forEach((img) => URL.revokeObjectURL(img.url));
      return files.map((file, index) => ({
        id: `${file.name}-${index}-${file.lastModified}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
    });
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecentOrders(parsed);
      }
    } catch (error) {
      console.error("Could not parse saved orders:", error);
    }
  }, []);

  useEffect(() => {
    return () => {
      uploadedDogImages.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [uploadedDogImages]);

  const saveOrderLocally = (orderPayload) => {
    const nextOrders = [orderPayload, ...recentOrders].slice(0, 20);
    setRecentOrders(nextOrders);
    window.localStorage.setItem(storageKey, JSON.stringify(nextOrders));
  };

  const totalPrice = useMemo(() => {
    return selectedTemplate.price + shippingSpeed.value;
  }, [selectedTemplate, shippingSpeed]);

  const formatOrderForCsv = (order) => {
    const values = [
      order.createdAt,
      order.orderId,
      order.status,
      order.template,
      order.total,
      order.recipientName,
      order.recipientEmail,
      order.shippingSpeed,
      order.giftMessage,
    ];
    return values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
  };

  const handleDownloadOrdersCsv = () => {
    if (recentOrders.length === 0) return;
    const header =
      "createdAt,orderId,status,template,total,recipientName,recipientEmail,shippingSpeed,giftMessage";
    const rows = recentOrders.map(formatOrderForCsv);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "boardforge-orders.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handlePlaceOrder = async () => {
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

    if (!stripePaymentLink.trim()) {
      setOrderFeedback({
        type: "error",
        message:
          "Stripe checkout is not wired up for this deployment. Add VITE_STRIPE_PAYMENT_LINK in Vercel (or .env locally), then redeploy / restart dev.",
      });
      return;
    }

    const orderPayload = {
      createdAt: new Date().toISOString(),
      orderId: `BG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: "pending_payment",
      template: selectedTemplate.name,
      total: totalPrice.toFixed(2),
      recipientName: name,
      recipientEmail: email,
      shippingSpeed: shippingSpeed.name,
      giftMessage: giftMessage.trim(),
    };

    setIsSubmittingOrder(true);
    setWebhookStatus("");
    saveOrderLocally(orderPayload);

    try {
      if (orderWebhookUrl) {
        // Apps Script web apps often do not return CORS headers for browser fetch.
        // Using no-cors + text/plain avoids preflight and still delivers the payload.
        await fetch(orderWebhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(orderPayload),
        });
        setWebhookStatus("Order payload sent to Google Sheets webhook.");
      }

      const redirectUrl = new URL(stripePaymentLink);
      redirectUrl.searchParams.set("prefilled_email", email);
      redirectUrl.searchParams.set("client_reference_id", orderPayload.orderId);
      window.location.assign(redirectUrl.toString());
    } catch (error) {
      console.error(error);
      setOrderFeedback({
        type: "error",
        message:
          "Could not connect to payment services. Please try again in a moment.",
      });
      setWebhookStatus("");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <>
      <header className="hero">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />
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
          <div className="hero-cta-row">
            <a className="cta" href="#templates">
              Start designing
            </a>
            <a className="cta cta-secondary" href="#uno-studio">
              Try Uno previews
            </a>
          </div>
          <div className="hero-metrics">
            <div>
              <strong>4.9/5</strong>
              <span>Gift joy score</span>
            </div>
            <div>
              <strong>2-4 days</strong>
              <span>Production turnaround</span>
            </div>
            <div>
              <strong>1-click pay</strong>
              <span>Stripe checkout</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="templates" className="section">
          <h2>Choose a base game style</h2>
          <p className="section-copy">
            Pick one of the MVP inspirations, then personalize every detail.
          </p>
          <div className="template-grid">
            <article
              key={featuredTemplate.name}
              className={`card template-card template-card-featured ${
                selectedTemplate.name === featuredTemplate.name ? "selected" : ""
              }`}
              onClick={() => setSelectedTemplate(featuredTemplate)}
            >
              <h3 className="template-card-title">{featuredTemplate.name}</h3>
              <p>{featuredTemplate.description}</p>
              <span className="tag">Starting at ${featuredTemplate.price}</span>
            </article>
            <div className="template-grid-secondary">
              {otherTemplates.map((template) => (
                <article
                  key={template.name}
                  className={`card template-card ${
                    selectedTemplate.name === template.name ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="template-card-heading">
                    <h3>{template.name}</h3>
                    <span className="coming-soon-pill">Coming Soon</span>
                  </div>
                  <p>{template.description}</p>
                  <span className="tag">Starting at ${template.price}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="uno-studio" className="section uno-studio">
          <div className="uno-studio-intro">
            <span className="fun-badge">Uno · live preview</span>
            <h2>Customize wild cards your way</h2>
            <p className="section-copy">
              Type your house rules, family name, and vibe — see how Wild, Draw Four,
              Reverse, and Skip cards could look in print. This is a playful preview,
              not final proofing.
            </p>
          </div>
          <div className="uno-studio-layout">
            <div className="card uno-studio-controls">
              <h3 className="uno-studio-controls-title">Your deck details</h3>
              <div className="form-row">
                <label htmlFor="uno-deck-name">Deck / family name</label>
                <input
                  id="uno-deck-name"
                  type="text"
                  value={unoStudio.deckName}
                  onChange={(e) => updateUnoStudio({ deckName: e.target.value })}
                  placeholder="e.g. The Garcia Game Night"
                  maxLength={48}
                />
              </div>
              <div className="form-row">
                <span className="uno-theme-label">Accent for action cards</span>
                <div className="uno-theme-chips" role="group" aria-label="Card accent color">
                  {unoThemeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`uno-theme-chip uno-theme-chip--${opt.id} ${
                        unoStudio.theme === opt.id ? "selected" : ""
                      }`}
                      onClick={() => updateUnoStudio({ theme: opt.id })}
                      aria-pressed={unoStudio.theme === opt.id}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="uno-wild-rule">Wild card — custom rule text</label>
                <textarea
                  id="uno-wild-rule"
                  rows={3}
                  value={unoStudio.wildRule}
                  onChange={(e) => updateUnoStudio({ wildRule: e.target.value })}
                  placeholder="What happens when someone plays a Wild?"
                  maxLength={160}
                />
              </div>
              <div className="form-row">
                <label htmlFor="uno-draw-four">Draw four — subtitle</label>
                <input
                  id="uno-draw-four"
                  type="text"
                  value={unoStudio.drawFourNote}
                  onChange={(e) => updateUnoStudio({ drawFourNote: e.target.value })}
                  maxLength={90}
                />
              </div>
              <div className="form-row">
                <label htmlFor="uno-reverse">Reverse — subtitle</label>
                <input
                  id="uno-reverse"
                  type="text"
                  value={unoStudio.reverseNote}
                  onChange={(e) => updateUnoStudio({ reverseNote: e.target.value })}
                  maxLength={90}
                />
              </div>
              <div className="form-row">
                <label htmlFor="uno-skip">Skip — subtitle</label>
                <input
                  id="uno-skip"
                  type="text"
                  value={unoStudio.skipNote}
                  onChange={(e) => updateUnoStudio({ skipNote: e.target.value })}
                  maxLength={90}
                />
              </div>
            </div>
            <div className="uno-studio-previews">
              <UnoPreviewCard
                variant="wild"
                deckName={unoStudio.deckName}
                wildRule={unoStudio.wildRule}
                drawFourNote={unoStudio.drawFourNote}
                reverseNote={unoStudio.reverseNote}
                skipNote={unoStudio.skipNote}
                themeKey={unoStudio.theme}
              />
              <UnoPreviewCard
                variant="drawFour"
                deckName={unoStudio.deckName}
                wildRule={unoStudio.wildRule}
                drawFourNote={unoStudio.drawFourNote}
                reverseNote={unoStudio.reverseNote}
                skipNote={unoStudio.skipNote}
                themeKey={unoStudio.theme}
              />
              <UnoPreviewCard
                variant="reverse"
                deckName={unoStudio.deckName}
                wildRule={unoStudio.wildRule}
                drawFourNote={unoStudio.drawFourNote}
                reverseNote={unoStudio.reverseNote}
                skipNote={unoStudio.skipNote}
                themeKey={unoStudio.theme}
              />
              <UnoPreviewCard
                variant="skip"
                deckName={unoStudio.deckName}
                wildRule={unoStudio.wildRule}
                drawFourNote={unoStudio.drawFourNote}
                reverseNote={unoStudio.reverseNote}
                skipNote={unoStudio.skipNote}
                themeKey={unoStudio.theme}
              />
            </div>
          </div>
        </section>

        <section className="section config-grid">
          <div className="card dog-cards-studio">
            <h2>Upload number card photos</h2>
            <p className="section-copy">
              Upload up to 3 family-dog photos from your computer and preview how
              they can replace art on Uno number cards.
            </p>
            <div className="dog-upload-layout">
              <div className="form-row dog-upload-controls">
                <label htmlFor="dog-card-upload">Choose photos (JPG, PNG, WEBP)</label>
                <input
                  id="dog-card-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleDogImageUpload}
                />
              </div>
              <div className="uno-replace-demo">
                <article className="uno-demo-card">
                  <img src={unoCardOneImage} alt="Original Uno number 1 card" />
                  <p>Original Uno 1</p>
                </article>
                <article className="uno-demo-card uno-demo-card-custom">
                  <img src={unoCardOneImage} alt="Uno number 1 card with dog replacing the one" />
                  <img
                    src={dogReplaceOneImage}
                    alt="Dog photo replacing the center number"
                    className="uno-demo-dog-overlay"
                  />
                  <p>1 replaced with your dog</p>
                </article>
              </div>
            </div>
            <div className="dog-card-grid">
              {numberCardValues.map((value, index) => {
                const image = uploadedDogImages[index];
                return (
                  <article key={value} className="dog-number-card">
                    {image ? (
                      <img
                        src={image.url}
                        alt={`Custom dog pose for number ${value}`}
                        className="dog-number-card-image"
                      />
                    ) : (
                      <div className="dog-number-card-placeholder">
                        <span className="dog-number-card-emoji">🐶</span>
                        <span>{dogPosePrompts[index]}</span>
                        <small>Upload your family dog photo</small>
                      </div>
                    )}
                    <span className="dog-number-card-value">{value}</span>
                    <div className="dog-number-card-caption">
                      {image?.name || `Example: ${dogPosePrompts[index]}`}
                    </div>
                  </article>
                );
              })}
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
              Continue to recipient form
            </button>
            <p className="muted checkout-hint">
              Opens the section below. Stripe opens only after you fill the form and
              click Pay Securely.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="card order-form-card" ref={orderFormRef}>
            <h2>Recipient + checkout info</h2>
            <p className="section-copy">
              Fill in all fields, then use Pay Securely to send the order to your
              webhook (if set) and redirect to Stripe Checkout.
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
            <button
              className="cta"
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmittingOrder}
            >
              {isSubmittingOrder ? "Preparing Checkout..." : "Pay Securely (Stripe)"}
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
            <p className="muted">
              Orders are saved locally for backup and can also be posted to your
              webhook (Google Sheets Apps Script) if configured.
            </p>
            {webhookStatus ? <p className="muted success">{webhookStatus}</p> : null}
          </div>
        </section>

        <section className="section">
          <div className="card">
            <h2>Order tracking snapshot</h2>
            <p className="section-copy">
              Keep a lightweight order log now; import CSV into Google Sheets any
              time.
            </p>
            <button
              className="nav-btn dark"
              type="button"
              onClick={handleDownloadOrdersCsv}
              disabled={recentOrders.length === 0}
            >
              Download Orders CSV
            </button>
            <ul className="order-list">
              {recentOrders.length === 0 ? (
                <li className="muted">No orders saved yet.</li>
              ) : (
                recentOrders.map((order) => (
                  <li key={order.orderId}>
                    <div>
                      <strong>{order.orderId}</strong> - {order.template}
                    </div>
                    <div className="muted">
                      ${order.total} | {order.recipientName} |{" "}
                      {order.shippingSpeed}
                    </div>
                  </li>
                ))
              )}
            </ul>
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
          Set `VITE_STRIPE_PAYMENT_LINK` and optionally
          `VITE_ORDER_WEBHOOK_URL` to activate checkout + order tracking.
        </small>
      </footer>
    </>
  );
}

export default App;
