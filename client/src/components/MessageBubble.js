import React from 'react';

const MessageBubble = ({ sender, text }) => {
  const isUser = sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          px-4 py-2 rounded-xl max-w-xs text-white
          ${isUser 
            ? 'bg-blue-500' 
            : 'bg-gray-600 dark:bg-gray-700 dark:text-white'}
        `}
      >
        {text}
      </div>
    </div>
  );
};

export default MessageBubble;
