import React, { useState, useCallback } from 'react';
import { UploadedFile, ChatMessage } from './types';
import FileUpload from './components/FileUpload';
import ChatWindow from './components/ChatWindow';
import { analyzeDocuments } from './services/geminiService';

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'initial',
      role: 'system',
      content: 'Welcome to DocuChat AI! Upload some documents to get started.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0 && chatHistory[0].id === 'initial') {
        setChatHistory([{
            id: 'ready',
            role: 'system',
            content: 'Documents loaded! You can now ask questions about their content.'
        }]);
    } else if (newFiles.length === 0) {
        setChatHistory([{
            id: 'initial',
            role: 'system',
            content: 'Welcome to DocuChat AI! Upload some documents to get started.'
        }]);
    }
    setError(null);
  };

  const handleSendMessage = useCallback(async (query: string) => {
    if (files.length === 0) {
      setError("Please upload at least one document before asking a question.");
      return;
    }
    
    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: query };
    setChatHistory(prev => [...prev, userMessage]);

    const combinedContent = files.map(f => `--- Document: ${f.name} ---\n${f.content}`).join('\n\n');
    
    const aiResponseContent = await analyzeDocuments(combinedContent, query);
    
    const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', content: aiResponseContent };
    
    setChatHistory(prev => [...prev, aiMessage]);
    setIsLoading(false);
  }, [files]);
  
  const handleProcessingError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-screen-2xl mx-auto w-full flex flex-col flex-grow">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              DocuChat AI
            </span>
          </h1>
          <p className="text-gray-400 mt-2">Chat with your documents, powered by Gemini</p>
        </header>

        {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-center" role="alert">
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow min-h-0">
          <div className="lg:col-span-1">
            <FileUpload files={files} onFilesChange={handleFilesChange} onProcessingError={handleProcessingError} />
          </div>
          <div className="lg:col-span-2">
            <ChatWindow 
              messages={chatHistory} 
              isLoading={isLoading} 
              onSendMessage={handleSendMessage}
              isReady={files.length > 0}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
