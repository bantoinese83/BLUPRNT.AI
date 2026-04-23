import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, X, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIAssistantWidget({
  projectId,
  isOpen,
  onOpenChange,
}: {
  projectId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Hi! I'm your Project Assistant. Ask me anything about your renovation budget, scope, or next steps.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg || isTyping) return;

    setInput("");
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const { data, error } = await invokeFunction<{ reply?: string }>(
        "chat-with-project",
        {
          body: { query: msg, projectId },
        },
      );

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            data?.reply?.trim() || "I couldn't process that. Please try again.",
        },
      ]);
    } catch (err) {
      reportClientError("ai_assistant_web", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting. Check your connection and try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-96 h-[500px] bg-white rounded-2xl shadow-spatial border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-teal-950 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                  <Bot className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">AI Project Assistant</h4>
                  <p className="text-[10px] text-teal-400">
                    Online & Ready to help
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="text-white/60 hover:text-white p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-teal-600 text-white rounded-br-none"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="markdown-content prose prose-sm prose-slate">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white border-t border-slate-100"
            >
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 text-center">
                Powered by Gemini 3.1 & Blueprint Data
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onOpenChange(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-slate-900 text-white"
            : "bg-teal-600 text-white shadow-teal-600/20"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
        {!isOpen && (
          <div className="absolute -top-1 -right-1">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
}
