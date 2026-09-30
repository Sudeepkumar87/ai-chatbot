import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  MessageCircle,
  Minimize2,
  Volume2,
  Send,
  Sparkles,
  X
} from 'lucide-react';
import './styles.css';

const quickReplies = [
  'Book a demo',
  'See features',
  'Get pricing'
];

const initialMessages = [
  {
    from: 'bot',
    text: 'Hi there 👋 Welcome to Oyik.AI! How can I help you today — booking a demo, features, or pricing?'
  }
];

const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

function getSessionId() {
  const storageKey = 'oyik-chat-session-id';
  const existingSession = window.localStorage.getItem(storageKey);

  if (existingSession) return existingSession;

  const newSession = crypto.randomUUID();
  window.localStorage.setItem(storageKey, newSession);
  return newSession;
}

function readN8nReply(data) {
  if (typeof data === 'string') return data;

  return (
    data?.output ||
    data?.text ||
    data?.message ||
    data?.reply ||
    data?.response ||
    data?.data?.output ||
    data?.data?.text ||
    data?.data?.message ||
    'Thanks. An Oyik.AI specialist can help with that, and we usually reply within a few minutes.'
  );
}

function Chatbot() {
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const latestMessageRef = useRef(null);
  const sessionId = useMemo(() => getSessionId(), []);

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages, isSending, open]);

  const sendMessage = async (text = message) => {
    const cleanText = text.trim();
    if (!cleanText || isSending) return;

    setMessages((current) => [
      ...current,
      { from: 'user', text: cleanText }
    ]);
    setMessage('');
    setOpen(true);
    setIsSending(true);

    if (!n8nWebhookUrl) {
      setMessages((current) => [
        ...current,
        {
          from: 'bot',
          text: 'n8n is not connected yet. Add your webhook URL to VITE_N8N_WEBHOOK_URL to receive live AI replies.'
        }
      ]);
      setIsSending(false);
      return;
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatInput: cleanText,
          message: cleanText,
          sessionId,
          source: 'oyik-react-chatbot'
        })
      });

      if (!response.ok) {
        throw new Error(`n8n returned ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      setMessages((current) => [
        ...current,
        {
          from: 'bot',
          text: readN8nReply(data)
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          from: 'bot',
          text: 'I reached the Oyik.AI workflow, but n8n could not return a reply. Please add a Respond to Webhook node or change the Webhook response mode.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-shell" aria-live="polite">
      {open && (
        <section className="chat-window" aria-label="Floating chatbot">
          <header className="chat-header">
            <span className="bot-mark">
              <Bot size={18} />
            </span>
            <div>
              <strong>
                Oyik.AI Assistant
                <span className="status-dot" aria-label="Online" />
              </strong>
              <small>Usually replies in a few minutes</small>
            </div>
            <button className="icon-button sound" type="button" aria-label="Sound">
              <Volume2 size={18} />
            </button>
            <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Minimize chat">
              <Minimize2 size={18} />
            </button>
          </header>

          <div className="chat-messages">
            {messages.map((item, index) => (
              <div className={`message-block ${item.from}`} key={`${item.from}-${index}`}>
                <p className={`chat-bubble ${item.from}`}>
                  {item.text}
                </p>
                {item.from === 'bot' && <span className="message-meta">Oyik.AI - 06:32 PM</span>}
              </div>
            ))}
            {isSending && (
              <div className="message-block bot">
                <div className="chat-bubble bot typing-bubble" aria-label="Oyik.AI is typing">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="message-meta">Oyik.AI is typing</span>
              </div>
            )}
            <div ref={latestMessageRef} />
          </div>

          <div className="quick-actions" aria-label="Quick actions">
            {quickReplies.map((reply) => (
              <button type="button" key={reply} onClick={() => sendMessage(reply)}>
                {reply}
              </button>
            ))}
          </div>

          <form
            className="chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={isSending ? 'Waiting for reply...' : 'Type a message'}
              aria-label="Type a message"
              disabled={isSending}
            />
            <button type="submit" aria-label="Send message" disabled={isSending}>
              <Send size={18} />
            </button>
          </form>
          <div className="chat-footer">
            Powered by{' '}
            <a href="https://oyik.ai/" target="_blank" rel="noreferrer">
              Oyik.AI
            </a>
          </div>
        </section>
      )}

      <button className="chat-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close chat' : 'Open chat'}>
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}

function App() {
  return (
    <>
      <main>
        <nav className="site-nav">
          <a className="brand" href="#top">
            <Sparkles size={22} />
            Oyik.AI
          </a>
          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#work">Work</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>

        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">AI customer engagement</p>
            <h1>Turn every website visit into a helpful conversation.</h1>
            <p>
              Oyik.AI helps businesses add smart, always-on chat assistants that answer questions, capture leads, and guide customers instantly.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#contact">
                Book a Demo
                <ArrowRight size={18} />
              </a>
              <a className="secondary-button" href="#services">Explore Features</a>
            </div>
          </div>
          <div className="hero-panel" aria-label="Oyik.AI chatbot summary">
            <div className="panel-topline">
              <span>AI Assistant</span>
              <strong>24/7</strong>
            </div>
            <div className="progress-stack">
              <span style={{ width: '92%' }} />
              <span style={{ width: '76%' }} />
              <span style={{ width: '84%' }} />
            </div>
            <div className="metric-row">
              <div>
                <strong>3x</strong>
                <span>More conversations</span>
              </div>
              <div>
                <strong>1m</strong>
                <span>Fast replies</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="section-heading">
            <p className="eyebrow">Features</p>
            <h2>Everything your website chatbot needs to assist visitors.</h2>
          </div>
          <div className="service-grid">
            {['Lead capture', 'Instant answers', 'Easy handoff'].map((item) => (
              <article className="service-card" key={item}>
                <CheckCircle2 size={22} />
                <h3>{item}</h3>
                <p>Automate helpful conversations, qualify visitors, and route high-intent customers to your team.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="split-section" id="work">
          <div>
            <p className="eyebrow">Process</p>
            <h2>Launch an AI assistant without slowing your team down.</h2>
          </div>
          <ol className="steps">
            <li><span>01</span> Add your business details, services, and common questions.</li>
            <li><span>02</span> Customize the assistant to match your brand and tone.</li>
            <li><span>03</span> Go live with a floating chatbot on your website.</li>
          </ol>
        </section>

        <section className="contact-band" id="contact">
          <div>
            <p className="eyebrow">Ready</p>
            <h2>Bring Oyik.AI to your website.</h2>
          </div>
          <a className="primary-button light" href="https://oyik.ai/" target="_blank" rel="noreferrer">
            Visit Oyik.AI
            <ArrowRight size={18} />
          </a>
        </section>
      </main>
      <Chatbot />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
