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
import { Search, Heart, List, Map, Bell, BookmarkCheck } from "lucide-react";
import { motion } from "motion/react";
import { RentalDetailsModal } from "@/components/RentalDetailsModal";
import { ChatWidget } from "@/components/ChatWidget";
import { RentalsMap } from "@/components/DynamicMap";

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<Array<{ id: string; searchTerm: string; filterType: string; filterAmenities: string[]; alertsEnabled: boolean }>>([]);
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
    if (!user) {
      setSavedSearches([]);
      return;
    }

    const q = query(collection(db, "users", user.uid, "savedSearches"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      setSavedSearches(snapshot.docs.map((savedDoc: any) => ({
        id: savedDoc.id,
        ...savedDoc.data(),
      })));
    }, (error: any) => {
      console.error("Error fetching saved searches:", error);
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

  const handleSaveSearch = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const existingSearch = savedSearches.find((savedSearch) =>
      savedSearch.searchTerm === searchTerm.trim()
      && savedSearch.filterType === filterType
      && JSON.stringify(savedSearch.filterAmenities || []) === JSON.stringify(filterAmenities),
    );

    try {
      if (existingSearch) return;

      await addDoc(collection(db, "users", user.uid, "savedSearches"), {
        searchTerm: searchTerm.trim(),
        filterType,
        filterAmenities,
        alertsEnabled: true,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to save search:", error);
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
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      <Header onPostClick={() => setIsModalOpen(true)} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="mb-14 overflow-hidden rounded-[32px] border border-[#eadfd5] bg-[linear-gradient(135deg,#fffaf7_0%,#f7f1eb_35%,#f1e7df_100%)] p-6 shadow-[0_25px_80px_rgba(17,24,39,0.08)] sm:p-8 lg:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className=""
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e9d8c7] bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#7a5a46] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#b8754a]"></span>
                Curated homes for modern living
              </div>

              <h1 className="mb-6 max-w-xl font-display text-5xl font-black leading-[0.9] tracking-[-0.08em] text-[#1f2937] md:text-6xl lg:text-7xl">
                Find a place that feels like yours.
              </h1>

              <p className="max-w-lg text-base text-slate-600 md:text-lg">
                {t("homeSubtitle")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -left-6 top-4 h-24 w-24 rounded-full bg-[#d6a57a]/20 blur-3xl" />
              <div className="absolute -right-5 bottom-8 h-20 w-20 rounded-full bg-[#d9776d]/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-[#eadfd5] bg-white/80 p-4 shadow-[0_30px_60px_rgba(17,24,39,0.08)] backdrop-blur-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] bg-[#1f2937] p-4 text-[#f7f2ee]">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d6a57a]">
                        Featured
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em]">
                        24h
                      </span>
                    </div>
                    <div className="mb-3 h-28 overflow-hidden rounded-[18px] bg-[url('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-display text-2xl font-black tracking-[-0.08em]">$2,450</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f0d0b1]">/month</span>
                    </div>
                    <p className="text-sm text-[#e8e0d8]">Bright apartment in Midtown</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[22px] bg-[#f4e9df] p-4">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#7a5a46]">Live match</p>
                      <div className="flex items-end justify-between">
                        <span className="font-display text-3xl font-black tracking-[-0.08em] text-[#1f2937]">92%</span>
                        <span className="text-xs font-bold text-[#58715f]">Top match</span>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[#e9dfd6] bg-[#fffdfb] p-4">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#7a5a46]">This week</p>
                      <div className="space-y-2 text-sm text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>New listings</span>
                          <span className="font-black text-[#1f2937]">128</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Verified homes</span>
                          <span className="font-black text-[#1f2937]">86%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative mx-auto mb-10 max-w-5xl"
        >
          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-[#d6a57a]/20 via-[#f5e5d7]/30 to-[#d9776d]/20 blur-xl" />
          <div className="relative flex flex-col items-center gap-4 rounded-[28px] border border-[#eadfd5] bg-white/80 p-3 backdrop-blur-xl shadow-[0_20px_50px_rgba(17,24,39,0.08)] md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-3 rounded-[20px] bg-[#f7f2ee] px-4 py-3 md:flex-1">
              <Search className="h-5 w-5 text-[#b8754a]" />
              <input
                type="text"
                className="w-full bg-transparent text-base font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => void handleSaveSearch()}
              className="w-full rounded-[18px] bg-[#1f2937] px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#f7f2ee] shadow-[0_18px_35px_rgba(31,41,55,0.2)] transition-all md:w-auto"
            >
              <span className="inline-flex items-center gap-2"><Bell className="h-4 w-4" />Save & alert</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-10 flex max-w-5xl flex-col items-center justify-center gap-3"
        >
          <motion.select
            whileHover={{ scale: 1.01 }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full cursor-pointer rounded-[18px] border border-[#eadfd5] bg-[#fffaf7] px-5 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition-all focus:border-[#d6a57a] md:w-auto"
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
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  setFilterAmenities((prev) =>
                    prev.includes(amenity)
                      ? prev.filter((a) => a !== amenity)
                      : [...prev, amenity],
                  )
                }
                className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${filterAmenities.includes(amenity) ? "border-[#1f2937] bg-[#1f2937] text-[#f7f2ee] shadow-[0_16px_28px_rgba(31,41,55,0.12)]" : "border-[#eadfd5] bg-white text-slate-600 hover:border-[#d6a57a] hover:text-[#1f2937]"}`}
              >
                {amenity}
              </motion.button>
            ))}
          </div>
          {user && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <BookmarkCheck className="h-4 w-4 text-[#8aa58d]" />
              {savedSearches.length > 0
                ? `${savedSearches.length} saved search${savedSearches.length === 1 ? "" : "es"} with alerts`
                : "Save this search to get alerted about matching homes"}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-[#eadfd5] pb-6 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-3">
            <h2 className="font-display text-3xl font-black tracking-[-0.06em] text-[#1f2937]">
              {t("allRentals")}
            </h2>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="rounded-full bg-[#1f2937] px-4 py-2 text-sm font-black text-[#f7f2ee] shadow-[0_12px_24px_rgba(31,41,55,0.2)]"
            >
              {filteredRentals.length} listings
            </motion.span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user && (
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center rounded-full border border-[#eadfd5] bg-white p-1 shadow-sm"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setFilterMode("all")}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${filterMode === "all" ? "bg-[#1f2937] text-[#f7f2ee]" : "text-slate-600 hover:text-[#1f2937]"}`}
                >
                  All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setFilterMode("favorites")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${filterMode === "favorites" ? "bg-[#d6a57a] text-[#1f2937]" : "text-slate-600 hover:text-[#1f2937]"}`}
                >
                  <Heart className={`h-4 w-4 ${filterMode === "favorites" ? "fill-current" : ""}`} />
                  Favorites
                </motion.button>
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="flex items-center rounded-full border border-[#eadfd5] bg-white p-1 shadow-sm"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${viewMode === "list" ? "bg-[#1f2937] text-[#f7f2ee]" : "text-slate-600 hover:text-[#1f2937]"}`}
              >
                <List className="h-4 w-4" />
                List
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${viewMode === "map" ? "bg-[#8aa58d] text-white" : "text-slate-600 hover:text-[#1f2937]"}`}
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
