"use client";

import React, { useEffect, useState, useRef } from "react";
import { Send, User, Clock, Check, CheckCircle2, MessageSquare } from "lucide-react";
import { getExpertDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken } from "@/lib/admin-session";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client for realtime features
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MessagesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [expertProfile, setExpertProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadClients() {
      try {
        const token = getAdminAccessToken();
        if (!token) return;
        const res = await getExpertDashboardData(token);
        if (res && res.clients) {
          setClients(res.clients);
          setExpertProfile(res.profile);
          if (res.clients.length > 0) {
            setSelectedClient(res.clients[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load clients", err);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, []);

  // Fetch messages and subscribe to realtime updates when selected client changes
  useEffect(() => {
    if (!selectedClient || !expertProfile) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("expert_messages")
        .select("*")
        .eq("expert_id", expertProfile.expert_id)
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages (Note: Ensure expert_messages table exists in Supabase):", error);
      } else if (data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${selectedClient.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expert_messages",
          filter: `expert_id=eq.${expertProfile.expert_id}`,
        },
        (payload) => {
          if (payload.new.client_id === selectedClient.id) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClient, expertProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient || !expertProfile) return;

    const msgContent = newMessage.trim();
    setNewMessage("");

    // Optimistic UI update
    const optimisticMsg = {
      id: "temp-" + Date.now(),
      expert_id: expertProfile.expert_id,
      client_id: selectedClient.id,
      sender: "expert",
      content: msgContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase
      .from("expert_messages")
      .insert([
        {
          expert_id: expertProfile.expert_id,
          client_id: selectedClient.id,
          sender: "expert",
          content: msgContent,
        }
      ]);

    if (error) {
      console.error("Error sending message:", error);
      // Revert optimistic update on error
      setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id));
      alert("Failed to send message. Have you created the 'expert_messages' table in Supabase?");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar / Client List */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <p>No active clients yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                    selectedClient?.id === client.id ? "bg-blue-50 dark:bg-gray-750" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 relative">
                    <User className="w-5 h-5" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold truncate ${selectedClient?.id === client.id ? "text-blue-700 dark:text-white" : "text-gray-900 dark:text-white"}`}>
                      {client.clientName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{client.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
        {selectedClient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedClient.clientName}
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </h2>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 block"></span> Active Client
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isExpert = msg.sender === "expert";
                  return (
                    <div key={msg.id || index} className={`flex ${isExpert ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl p-4 ${
                        isExpert 
                          ? "bg-blue-600 text-white rounded-br-sm" 
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-sm shadow-sm"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-2 text-xs ${isExpert ? "text-blue-200" : "text-gray-400"}`}>
                          <Clock className="w-3 h-3" />
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isExpert && <Check className="w-3 h-3 ml-1" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 shrink-0"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Your Messages</h3>
            <p>Select a client from the sidebar to view your conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
