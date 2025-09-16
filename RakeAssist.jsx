import React, { useState } from 'react';

// A simple styling object. In a real app, you'd use CSS classes.
const styles = {
  chatWindow: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '350px',
    height: '500px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    fontFamily: 'sans-serif',
  },
  header: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px',
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: '10px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  message: {
    padding: '8px 12px',
    borderRadius: '18px',
    marginBottom: '10px',
    maxWidth: '80%',
    lineHeight: '1.4',
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: 'white',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#f1f1f1',
    color: 'black',
    alignSelf: 'flex-start',
  },
  inputArea: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #ccc',
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '20px',
    border: '1px solid #ccc',
    marginRight: '10px',
  },
  button: {
    padding: '10px 15px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
  }
};

const RakeAssist = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm RakeAssist. Ask me about the fleet plan for any day.", sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // The API server we created runs on port 5001
      const response = await fetch('http://localhost:5001/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: inputValue }), // We can also send the current day here
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const aiMessage = { text: data.answer || "Sorry, I couldn't get a response.", sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error fetching from RakeAssist API:", error);
      const errorMessage = { text: "Sorry, I'm having trouble connecting to my brain right now.", sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div style={styles.chatWindow}>
      <div style={styles.header}>
        <h3>RakeAssist AI</h3>
      </div>
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            ...styles.message,
            ...(msg.sender === 'user' ? styles.userMessage : styles.aiMessage)
          }}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div style={{...styles.message, ...styles.aiMessage}}>Thinking...</div>}
      </div>
      <div style={styles.inputArea}>
        <input
          type="text"
          style={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about Rake-05 and Rake-12 on Day 15..."
          disabled={isLoading}
        />
        <button style={styles.button} onClick={handleSendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default RakeAssist;

