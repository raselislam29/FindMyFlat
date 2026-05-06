import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  limit,
  writeBatch,
} from "firebase/firestore";

export interface Chat {
  id: string;
  rentalId: string;
  rentalTitle: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  createdAt: any;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

export function ChatWidget({
  isOpen,
  onClose,
  initialActiveChatId,
  startChatWithRental,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialActiveChatId?: string | null;
  startChatWithRental?: {
    rentalId: string;
    rentalTitle: string;
    ownerId: string;
  } | null;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Chats
  useEffect(() => {
    if (!user || !isOpen) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTime", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const chatsData = snapshot.docs.map(
        (doc: any) => ({ id: doc.id, ...doc.data() }) as Chat,
      );
      setChats(chatsData);

      // Auto-select chat if passed
      if (initialActiveChatId && !activeChat) {
        const chat = chatsData.find((c: Chat) => c.id === initialActiveChatId);
        if (chat) setActiveChat(chat);
      }
    });
    return () => unsubscribe();
  }, [user, isOpen, initialActiveChatId, activeChat]);

  // Handle start new chat
  useEffect(() => {
    const createNewChat = async () => {
      if (!user || !startChatWithRental) return;

      // Check if chat already exists
      const q = query(
        collection(db, "chats"),
        where("rentalId", "==", startChatWithRental.rentalId),
        where("participants", "array-contains", user.uid),
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Chat exists
        const existingChat = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        } as Chat;
        setActiveChat(existingChat);
      } else {
        // We do not create until first message is sent to prevent empty chats, but we can set a dummy activeChat locally.
        setActiveChat({
          id: "NEW",
          rentalId: startChatWithRental.rentalId,
          rentalTitle: startChatWithRental.rentalTitle,
          participants: [user.uid, startChatWithRental.ownerId],
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        setMessages([]);
      }
    };

    if (startChatWithRental && isOpen) {
      createNewChat();
    }
  }, [startChatWithRental, user, isOpen]);

  // Load Messages
  useEffect(() => {
    let isMounted = true;
    if (!activeChat || activeChat.id === "NEW" || !isOpen) {
      setTimeout(() => {
        if (isMounted) setMessages([]);
      }, 0);
      return;
    }
    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      if (isMounted) {
        setMessages(
          snapshot.docs.map(
            (doc: any) => ({ id: doc.id, ...doc.data() }) as Message,
          ),
        );
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeChat, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || !activeChat) return;

    const text = newMessage.trim();
    setNewMessage("");

    try {
      if (activeChat.id === "NEW") {
        const batch = writeBatch(db);
        const newChatRef = doc(collection(db, "chats"));
        batch.set(newChatRef, {
          rentalId: activeChat.rentalId,
          rentalTitle: activeChat.rentalTitle,
          participants: activeChat.participants,
          lastMessage: text.substring(0, 50),
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        const newMessageRef = doc(
          collection(db, "chats", newChatRef.id, "messages"),
        );
        batch.set(newMessageRef, {
          text,
          senderId: user.uid,
          createdAt: serverTimestamp(),
        });

        await batch.commit();
        setActiveChat({ ...activeChat, id: newChatRef.id });
      } else {
        const batch = writeBatch(db);
        const chatRef = doc(db, "chats", activeChat.id);
        batch.update(chatRef, {
          lastMessage: text.substring(0, 50),
          lastMessageTime: serverTimestamp(),
        });

        const newMessageRef = doc(
          collection(db, "chats", activeChat.id, "messages"),
        );
        batch.set(newMessageRef, {
          text,
          senderId: user.uid,
          createdAt: serverTimestamp(),
        });

        await batch.commit();
      }
    } catch (error) {
      console.error(
        `Error sending message (New: ${activeChat.id === "NEW"}):`,
        error,
      );
      alert(`Error! (New: ${activeChat.id === "NEW"}) ${error}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[350px] sm:w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden z-[60] flex flex-col border border-fuchsia-100"
        style={{ height: "500px", maxHeight: "calc(100vh - 80px)" }}
      >
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 p-4 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            {activeChat && (
              <button
                onClick={() => {
                  setActiveChat(null);
                }}
                className="hover:bg-white/20 p-1.5 rounded-full transition-colors mr-1"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-display font-medium text-lg">
              {activeChat ? activeChat.rentalTitle : "Messages"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!activeChat ? (
          <div className="flex-1 overflow-y-auto style-scrollbar">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                <MessageCircle className="h-12 w-12 mb-3 opacity-20" />
                <p>No messages yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className="w-full text-left p-4 hover:bg-fuchsia-50/50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {chat.rentalTitle}
                    </div>
                    <div className="text-sm text-gray-500 truncate mt-1">
                      {chat.lastMessage}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 style-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-[15px] shadow-sm ${msg.senderId === user?.uid ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white h-10 w-10 flex items-center justify-center rounded-full disabled:opacity-50 transition-all hover:shadow-md"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
