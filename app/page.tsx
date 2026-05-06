"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { RentalCard, Rental } from "@/components/RentalCard";
import { CreateRentalModal } from "@/components/CreateRentalModal";
import { LoginModal } from "@/components/LoginModal";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Search, Heart, List, Map } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RentalDetailsModal } from "@/components/RentalDetailsModal";
import { ChatWidget } from "@/components/ChatWidget";
import { RentalsMap } from "@/components/DynamicMap";

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filterMode, setFilterMode] = useState<"all" | "favorites">("all");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [startChatData, setStartChatData] = useState<{
    rentalId: string;
    rentalTitle: string;
    ownerId: string;
  } | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!user) {
      setFavorites(new Set());
      setFilterMode("all");
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    const q = query(collection(db, "users", user.uid, "favorites"));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const favs = new Set<string>(snapshot.docs.map((d: any) => d.id));
      setFavorites(favs);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleOpenChats = () => setIsChatOpen(true);
    const handleOpenLogin = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: "login" | "signup" }>;
      if (customEvent.detail?.mode) {
        setLoginMode(customEvent.detail.mode);
      } else {
        setLoginMode("login");
      }
      setIsLoginModalOpen(true);
    };

    window.addEventListener("open-chats", handleOpenChats);
    window.addEventListener("open-login", handleOpenLogin as EventListener);

    return () => {
      window.removeEventListener("open-chats", handleOpenChats);
      window.removeEventListener(
        "open-login",
        handleOpenLogin as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, "rentals"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: any) => {
        const fetchedRentals = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as Rental[];
        setRentals(fetchedRentals);
        setLoading(false);
      },
      (error: any) => {
        console.error("Error fetching rentals:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      try {
        await deleteDoc(doc(db, "rentals", id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete.");
      }
    }
  };

  const handleToggleFavorite = async (rental: Rental) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    const isFav = favorites.has(rental.id);
    try {
      if (isFav) {
        await deleteDoc(doc(db, "users", user.uid, "favorites", rental.id));
      } else {
        await setDoc(doc(db, "users", user.uid, "favorites", rental.id), {
          addedAt: serverTimestamp(),
        });
      }
    } catch (e: any) {
      console.error("Failed to toggle fav", e);
    }
  };

  const handleOpenRentalDetails = (rental: Rental) => {
    setSelectedRental(rental);

    void addDoc(collection(db, "rentals", rental.id, "views"), {
      viewedAt: serverTimestamp(),
      viewerId: user?.uid || null,
      viewerEmail: user?.email || null,
    }).catch((error: any) => {
      console.error("Failed to track listing view", error);
    });
  };

  const filteredRentals = rentals.filter((rental) => {
    const searchMatch =
      rental.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;

    if (filterType !== "All" && rental.propertyType !== filterType)
      return false;

    if (filterAmenities.length > 0) {
      if (!rental.amenities) return false;
      const hasAll = filterAmenities.every((a) =>
        rental.amenities?.includes(a),
      );
      if (!hasAll) return false;
    }

    if (filterMode === "favorites") {
      return favorites.has(rental.id);
    }

    return true;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <Header onPostClick={() => setIsModalOpen(true)} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero / Search Section */}
        <div className="mb-16 text-center max-w-4xl mx-auto pt-8 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-black mb-6 leading-tight tracking-tighter">
              <span className="text-gradient-primary">Find Your</span>
              <br />
              <span className="text-slate-900">Perfect Home</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
              {t("homeSubtitle")}
            </p>
          </motion.div>

          {/* Modern Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative mb-8 max-w-3xl mx-auto group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-20 group-focus-within:opacity-30 transition-all duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-premium hover:shadow-xl transition-all p-2 flex items-center">
              <div className="pl-5 flex items-center pointer-events-none group-focus-within:text-pink-500 transition-colors">
                <Search className="h-6 w-6 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
              </div>
              <input
                type="text"
                className="flex-1 px-4 py-4 bg-transparent border-0 leading-5 placeholder-slate-400 focus:outline-none text-lg font-medium transition-all"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mr-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30"
              >
                Search
              </motion.button>
            </div>
          </motion.div>

          {/* Advanced Filters - Modern Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-5xl mx-auto"
          >
            <motion.select
              whileHover={{ scale: 1.02 }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-6 py-3 border-2 border-gradient-to-r from-pink-200 to-purple-200 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 shadow-soft outline-none text-sm font-bold text-slate-700 hover:border-pink-400 transition-all focus:ring-2 focus:ring-pink-400 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Room">Room</option>
              <option value="Sublet">Sublet</option>
            </motion.select>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {[
                "Parking",
                "Pet-friendly",
                "Furnished",
                "AC",
                "Balcony",
                "Mosque",
                "Grocery",
              ].map((amenity, idx) => (
                <motion.button
                  key={`${amenity}-${idx}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setFilterAmenities((prev) =>
                      prev.includes(amenity)
                        ? prev.filter((a) => a !== amenity)
                        : [...prev, amenity],
                    )
                  }
                  className={`px-4 py-2.5 text-xs font-black rounded-lg border-2 transition-all shadow-soft uppercase tracking-wider ${filterAmenities.includes(amenity) ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white shadow-lg shadow-purple-500/30" : "bg-white border-slate-200 text-slate-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50"}`}
                >
                  {amenity}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Listings Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 pb-6 border-b-2 border-gradient-to-r from-pink-200 via-purple-200 to-indigo-200"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-display font-black text-gradient-primary">
              {t("allRentals")}
            </h2>
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-sm font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full shadow-lg shadow-purple-500/30"
            >
              {filteredRentals.length} listings
            </motion.span>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            {user && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center bg-white/80 backdrop-blur-md border border-slate-200/50 p-1 rounded-full shadow-soft"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterMode("all")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${filterMode === "all" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"}`}
                >
                  All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterMode("favorites")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${filterMode === "favorites" ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30" : "text-slate-600 hover:text-pink-600 hover:bg-pink-50"}`}
                >
                  <Heart
                    className={`h-4 w-4 ${filterMode === "favorites" ? "fill-white" : ""}`}
                  />
                  Favorites
                </motion.button>
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center bg-white/80 backdrop-blur-md border border-slate-200/50 p-1 rounded-full shadow-soft"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "list" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30" : "text-slate-600 hover:text-purple-600 hover:bg-purple-50"}`}
              >
                <List className="h-4 w-4" />
                List
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "map" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30" : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"}`}
              >
                <Map className="h-4 w-4" />
                Map
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Listings Grid or Map */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-soft border border-slate-200/50 h-96 animate-pulse"
                />
              ))}
            </div>
          ) : filteredRentals.length > 0 ? (
            viewMode === "list" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRentals.map((rental, idx) => (
                  <motion.div
                    key={rental.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <RentalCard
                      rental={rental}
                      onDelete={handleDelete}
                      onEdit={(r) => {
                        setEditingRental(r);
                        setIsModalOpen(true);
                      }}
                      onClick={handleOpenRentalDetails}
                      onMessageOwner={(r) => {
                        if (!user) {
                          setIsLoginModalOpen(true);
                          return;
                        }
                        setStartChatData({
                          rentalId: r.id,
                          rentalTitle: r.title,
                          ownerId: r.ownerId,
                        });
                        setIsChatOpen(true);
                      }}
                      isFavorite={favorites.has(rental.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, borderRadius: "0px" }}
                animate={{ opacity: 1, borderRadius: "1rem" }}
                className="h-[600px] w-full rounded-2xl overflow-hidden shadow-premium border-2 border-gradient-to-r from-pink-200 to-purple-200"
              >
                <RentalsMap
                  rentals={filteredRentals}
                  onMarkerClick={handleOpenRentalDetails}
                />
              </motion.div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-dashed border-slate-300 shadow-soft"
            >
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="mt-2 text-2xl font-display font-black text-slate-900">
                {t("noRentalsFound")}
              </h3>
              <p className="mt-2 text-lg text-slate-600 font-medium">
                Try adjusting your search or check back later.
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>

      <CreateRentalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRental(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingRental(null);
        }}
        rentalToEdit={editingRental}
      />
      <RentalDetailsModal
        isOpen={!!selectedRental}
        rental={selectedRental}
        onClose={() => setSelectedRental(null)}
        onEdit={(r) => {
          setEditingRental(r);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        onMessageOwner={(r) => {
          if (!user) {
            setIsLoginModalOpen(true);
            return;
          }
          setStartChatData({
            rentalId: r.id,
            rentalTitle: r.title,
            ownerId: r.ownerId,
          });
          setIsChatOpen(true);
          setSelectedRental(null);
        }}
        isFavorite={selectedRental ? favorites.has(selectedRental.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />
      <ChatWidget
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setStartChatData(null);
        }}
        startChatWithRental={startChatData}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialMode={loginMode}
      />
    </div>
  );
}
