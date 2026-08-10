import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("AI Assistant");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  const menuItems = [
    "Overview",
    "Users",
    "Mentors",
    "Requests",
    "AI Assistant",
  ];

  async function handleSendMessage(e) {
    e.preventDefault();

    if (!message.trim() || loading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: message,
    };

    // Immediately display the user's message
    setMessages((prev) => [...prev, userMessage]);

    // Save the message before clearing the input
    const currentMessage = message;

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: currentMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("AI service request failed");
      }

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect to the AI service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-black text-white">
      {/* ================= SIDEBAR ================= */}

      <aside className="w-64 border-r border-gray-800 bg-black p-6">
        {/* Logo */}

        <div className="mb-10">
          <h1 className="text-2xl font-bold">TripleS</h1>

          <p className="mt-1 text-sm text-gray-500">Administration</p>
        </div>

        {/* Navigation */}

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveSection(item)}
              className={`
                w-full rounded-lg px-4 py-3
                text-left transition
                ${
                  activeSection === item
                    ? "bg-white text-black"
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }
              `}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* User / Logout */}

        <div className="absolute bottom-6 w-52">
          <div className="mb-4 border-t border-gray-800 pt-4">
            <p className="text-sm font-medium">{user?.name}</p>

            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>

          <button
            onClick={onLogout}
            className="
              w-full rounded-lg
              border border-red-900
              px-4 py-2
              text-sm text-red-400
              transition
              hover:bg-red-950
            "
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="flex flex-1 flex-col">
        {/* TOP BAR */}

        <header className="flex h-20 items-center justify-between border-b border-gray-800 px-8">
          <div>
            <h2 className="text-xl font-semibold">{activeSection}</h2>

            <p className="text-sm text-gray-500">
              TripleS administration panel
            </p>
          </div>

          <div className="text-sm text-gray-400">
            Admin, {user?.name.toUpperCase()}
          </div>
        </header>

        {/* ================= AI ASSISTANT ================= */}

        {activeSection === "AI Assistant" && (
          <section className="flex flex-1 flex-col">
            {/* Chat messages */}

            <div className="flex-1 overflow-y-auto p-8">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-xl text-center">
                    <h3 className="mb-3 text-3xl font-bold">
                      TripleS AI Assistant
                    </h3>

                    <p className="text-gray-500">
                      Ask questions about users, mentors, incubation requests,
                      or anything connected to your platform.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-4xl space-y-6">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`
        
          rounded-2xl
          px-5 py-4
          ${
            msg.role === "user"
              ? "bg-white text-black"
              : "bg-gray-900 text-gray-200"
          }
        `}
                      >
                        {msg.role === "assistant" ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-gray-900 px-5 py-3 text-gray-500">
                        AI is thinking...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ================= INPUT ================= */}

            <div className="border-t border-gray-800 p-6">
              <form
                onSubmit={handleSendMessage}
                className="mx-auto flex max-w-4xl gap-3"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask the TripleS AI..."
                  disabled={loading}
                  className="
                    flex-1
                    rounded-xl
                    border border-gray-700
                    bg-gray-900
                    px-5 py-4
                    text-white
                    outline-none
                    placeholder:text-gray-600
                    focus:border-gray-400
                  "
                />

                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="
                    rounded-xl
                    bg-white
                    px-6
                    font-semibold
                    text-black
                    transition
                    hover:bg-gray-200
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Send
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ================= OTHER SECTIONS ================= */}

        {activeSection === "Overview" && (
          <div className="p-8">
            <h3 className="text-2xl font-bold">Overview</h3>

            <p className="mt-2 text-gray-500">
              Dashboard statistics will go here.
            </p>
          </div>
        )}

        {activeSection === "Users" && (
          <div className="p-8">
            <h3 className="text-2xl font-bold">Users</h3>

            <p className="mt-2 text-gray-500">User management will go here.</p>
          </div>
        )}

        {activeSection === "Mentors" && (
          <div className="p-8">
            <h3 className="text-2xl font-bold">Mentors</h3>

            <p className="mt-2 text-gray-500">
              Mentor management will go here.
            </p>
          </div>
        )}

        {activeSection === "Requests" && (
          <div className="p-8">
            <h3 className="text-2xl font-bold">Incubation Requests</h3>

            <p className="mt-2 text-gray-500">
              Request management will go here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
