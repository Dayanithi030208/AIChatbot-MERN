import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import MessageBubble from './components/MessageBubble';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Load list of sessions
  const loadSessions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/chat/sessions');
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const toggleHistoryPanel = () => {
    if (!showHistoryPanel) loadSessions();
    setShowHistoryPanel(!showHistoryPanel);
  };

  const loadSessionMessages = async (date) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/history/${date}`);
      setMessages(res.data);
      setSelectedSession(date);
      setShowHistoryPanel(false);
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedSession(null);
  };

  const clearHistory = async () => {
    try {
      await axios.delete('http://localhost:5000/api/chat/clear-all');
      setMessages([]);
      setSelectedSession(null);
      setSessions([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const startNewChat = () => {
    const newSessionId = new Date().toISOString().split('T')[0] + '-' + Date.now();
    setMessages([]);
    setSelectedSession(newSessionId);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/chat', {
        message: input,
        session: selectedSession
      });

      const aiReply = { sender: 'bot', text: res.data.reply };
      setMessages(prev => [...prev, aiReply]);
    } catch (error) {
      const errorMsg = { sender: 'bot', text: '⚠️ Error getting response from server.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300 relative">
      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex space-x-2 z-50">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={toggleHistoryPanel}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white shadow hover:bg-green-700 transition-colors"
        >
          {showHistoryPanel ? 'Close History' : 'Show History'}
        </button>

        <button
          onClick={startNewChat}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white shadow hover:bg-blue-600 transition-colors"
        >
          New Chat
        </button>

        <button
          onClick={clearChat}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-white shadow hover:bg-yellow-600 transition-colors"
        >
          Clear Chat
        </button>

        <button
          onClick={clearHistory}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white shadow hover:bg-red-700 transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* History Sidebar */}
      {showHistoryPanel && (
        <div className="absolute top-16 right-4 w-60 max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Chat History</h2>
          {sessions.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No sessions found</p>}
          <ul>
            {sessions.map((date) => (
              <li key={date}>
                <button
                  className={`w-full text-left px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-colors
                    ${selectedSession === date ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                  onClick={() => loadSessionMessages(date)}
                >
                  {date}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="w-full max-w-2xl h-[600px] bg-white dark:bg-gray-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-colors duration-300">
        <div className="bg-blue-600 text-white text-lg font-semibold px-4 py-3 flex justify-between items-center">
          <span>AI Chatbot {selectedSession ? `- ${selectedSession}` : ''}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-gray-500 dark:text-gray-300 text-center mt-10">
              No messages to display.
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} sender={msg.sender} text={msg.text} />
          ))}
          {loading && (
            <div className="text-gray-500 dark:text-gray-300 text-sm">AI is typing...</div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center">
          <input
            type="text"
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2 mr-2 focus:outline-none"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
