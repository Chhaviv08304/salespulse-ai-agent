import React, { useState } from 'react';

export default function SalesPulseChat() {
  const [messages, setMessages] = useState([
    { sender: 'agent', text: 'Hi! Looking for anything specific today?' }
  ]);
  const [input, setInput] = useState('');
  const [discount, setDiscount] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, cart: [] })
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { sender: 'agent', text: data.reply }]);
      if (data.appliedDiscount) {
        setDiscount(data.appliedDiscount);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'agent', text: 'Connection error.' }]);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
      <h3>SalesPulse AI Assistant</h3>
      {discount && <div style={{ background: '#e0ffe0', padding: '8px', marginBottom: '8px' }}>Active Code: {discount}</div>}
      <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '8px', marginBottom: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === 'user' ? 'right' : 'left', margin: '4px 0' }}>
            <span style={{ background: m.sender === 'user' ? '#007bff' : '#eee', color: m.sender === 'user' ? '#fff' : '#000', padding: '6px 10px', borderRadius: '12px', display: 'inline-block' }}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Ask about products or pricing..." style={{ width: '70%', padding: '8px' }} />
      <button onClick={sendMessage} style={{ width: '25%', padding: '8px', marginLeft: '2%' }}>Send</button>
    </div>
  );
}