"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  BedDouble,
  Bath,
  Square,
  MapPin,
  Phone,
  Clock,
  FileEdit,
  Trash2,
  MessageCircle,
  Heart,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface Rental {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  contactPhone: string;
  ownerId: string;
  status: "available" | "rented";
  createdAt: any;
  updatedAt: any;
  lat?: number;
  lng?: number;
  hidePhone?: boolean;
  photoUrls?: string[];
  propertyType?: string;
  amenities?: string[];
  monthlyUtilities?: number;
  moveInCost?: number;
  commuteMinutes?: number;
  neighborhoodScore?: number;
  bestFor?: string;
}

export function RentalCard({
  rental,
  onDelete,
  onEdit,
  onClick,
  onMessageOwner,
  isFavorite,
  onToggleFavorite,
}: {
  rental: Rental;
  onDelete?: (id: string) => void;
  onEdit?: (rental: Rental) => void;
  onClick?: (rental: Rental) => void;
  onMessageOwner?: (rental: Rental) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (rental: Rental) => void;
}) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const isOwner = user?.uid === rental.ownerId;
  const [isHovered, setIsHovered] = React.useState(false);
  const [ownerProfile, setOwnerProfile] = React.useState<any>(null);
  const monthlyTotal = (rental.price || 0) + (rental.monthlyUtilities || 0);
  const neighborhoodScore = rental.neighborhoodScore ?? 85;

  React.useEffect(() => {
    let mounted = true;
    const loadOwner = async () => {
      try {
        const ref = doc(db, "users", rental.ownerId);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) setOwnerProfile(snap.data());
      } catch (e) {
        // ignore
      }
    };

    if (rental.ownerId) void loadOwner();
    return () => {
      mounted = false;
    };
  }, [rental.ownerId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => onClick && onClick(rental)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="card-gradient group/card relative flex h-full cursor-pointer flex-col overflow-hidden"
    >
      <div className="group relative aspect-[4/3] w-full overflow-hidden bg-[#ede3d8]">
        <img
          src={
            rental.photoUrls && rental.photoUrls.length > 0
              ? rental.photoUrls[0]
              : `https://picsum.photos/seed/${rental.id}/800/600`
          }
          alt={rental.title}
          className={`h-full w-full object-cover transition-transform duration-700 ${isHovered ? "scale-105" : "scale-100"} ${rental.status === "rented" ? "grayscale opacity-70" : ""}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f2937]/90 via-[#1f2937]/10 to-transparent"></div>

        <div className="absolute left-4 top-4 z-10 flex gap-2">
          {rental.status === "rented" ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="rounded-full bg-[#d9776d]/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg"
            >
              {t("rented")}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 rounded-full bg-[#8aa58d]/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg"
            >
              <Zap className="h-3 w-3" />
              {t("available")}
            </motion.div>
          )}
        </div>

        {!isOwner && onToggleFavorite && (
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(rental);
            }}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/85 p-2.5 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${isFavorite ? "fill-[#d9776d] text-[#d9776d]" : "text-slate-500 hover:text-[#d9776d]"}`}
            />
          </motion.button>
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          <div className="flex items-end gap-2">
            <span className="font-display text-4xl font-black tracking-[-0.08em] text-white">
              ${rental.price.toLocaleString()}
            </span>
            <span className="pb-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#f3e7dc]">
              {t("priceAmount")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="line-clamp-1 font-display text-lg font-black text-[#1f2937] transition-colors group-hover/card:text-[#b8754a]">
              {rental.title}
            </h3>
            {ownerProfile?.verified && (
              <span className="rounded-full bg-[#e9f5ee] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-[#2a7d5a]">
                Verified
              </span>
            )}
          </div>
          {ownerProfile && (
            <div className="mb-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Owner:</span> {ownerProfile.displayName || ownerProfile.email}
              {typeof ownerProfile.profileCompletion === "number" && (
                <span className="ml-2 text-[10px] font-bold text-slate-600">· {Math.round(ownerProfile.profileCompletion)}% profile</span>
              )}
              {typeof ownerProfile.responseRate === "number" && (
                <span className="ml-2 text-[10px] font-bold text-slate-600">· {Math.round(ownerProfile.responseRate * 100)}% response</span>
              )}
            </div>
          )}
          {ownerProfile && (ownerProfile.verified || typeof ownerProfile.responseRate === "number") && (
            <div className="mb-3 flex flex-wrap gap-2">
              {ownerProfile.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#edf5ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#2a7d5a]">
                  Trusted profile
                </span>
              )}
              {typeof ownerProfile.responseRate === "number" && ownerProfile.responseRate >= 0.8 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f3e7dc] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#7a5a46]">
                  Fast responder
                </span>
              )}
            </div>
          )}
          <div className="mb-2 flex items-center text-sm font-semibold text-slate-600">
            <MapPin className="mr-2 h-4 w-4 text-[#b8754a]" />
            <span className="truncate">{rental.location}</span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {typeof rental.commuteMinutes === "number" && (
              <span className="rounded-full bg-[#f3e7dc] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7a5a46]">
                {rental.commuteMinutes} min commute
              </span>
            )}
            {typeof rental.neighborhoodScore === "number" && (
              <span className="rounded-full bg-[#edf5ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#2a7d5a]">
                {neighborhoodScore}/100 area
              </span>
            )}
            {rental.bestFor && (
              <span className="rounded-full bg-[#f7f2ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#1f2937]">
                Best for {rental.bestFor}
              </span>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-[#eadfd5] bg-[#f9f4f0] p-3 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              monthly total
            </span>
            <span className="font-black text-[#1f2937]">
              ${monthlyTotal.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Rent + utilities</span>
            <span>{typeof rental.monthlyUtilities === "number" ? `$${rental.monthlyUtilities.toLocaleString()}` : "Included"}</span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3 rounded-2xl border border-[#efe3d9] bg-[#f9f4f0] p-3">
          <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-2 text-center">
            <motion.div whileHover={{ rotate: 8 }} className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#1f2937] text-white shadow-md">
              <BedDouble className="h-4 w-4" />
            </motion.div>
            <span className="text-base font-black text-[#1f2937]">{rental.bedrooms}</span>
            <span className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              {t("bedrooms")}
            </span>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center border-x border-[#e8ddd2] p-2 text-center">
            <motion.div whileHover={{ rotate: 8 }} className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#d6a57a] text-white shadow-md">
              <Bath className="h-4 w-4" />
            </motion.div>
            <span className="text-base font-black text-[#1f2937]">{rental.bathrooms}</span>
            <span className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              {t("bathrooms")}
            </span>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-2 text-center">
            <motion.div whileHover={{ rotate: 8 }} className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#b8754a] text-white shadow-md">
              <Square className="h-4 w-4" />
            </motion.div>
            <span className="text-base font-black text-[#1f2937]">{rental.sizeSqft}</span>
            <span className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              {t("sqft")}
            </span>
          </motion.div>
        </div>

        {/* Amenities */}
        {rental.amenities && rental.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {rental.amenities.slice(0, 3).map((amenity, idx) => (
              <motion.span
                key={`${amenity}-${idx}`}
                whileHover={{ scale: 1.05 }}
                className="px-2.5 py-1 bg-gradient-to-r from-pink-100 to-pink-50 text-pink-700 text-xs rounded-full font-bold border border-pink-200/50 shadow-sm"
              >
                {amenity}
              </motion.span>
            ))}
            {rental.amenities.length > 3 && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 text-xs rounded-full font-bold border border-indigo-200/50">
                +{rental.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <div className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed flex-1">
          {rental.description}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/50">
          <div className="flex items-center gap-2">
            {!rental.hidePhone ? (
              <motion.a
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                href={`tel:${rental.contactPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center bg-gradient-to-br from-cyan-400 to-cyan-600 text-white h-9 w-9 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                title={t("contactOwner")}
              >
                <Phone className="h-4 w-4" />
              </motion.a>
            ) : (
              <div
                className="inline-flex items-center justify-center bg-slate-100 text-slate-300 h-9 w-9 rounded-full cursor-not-allowed border border-slate-200"
                title={t("hiddenPhone")}
              >
                <Phone className="h-4 w-4" />
              </div>
            )}
            {!isOwner && onMessageOwner && (
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMessageOwner(rental);
                }}
                className="inline-flex items-center justify-center bg-gradient-to-br from-pink-400 to-pink-600 text-white h-9 w-9 rounded-full transition-all duration-300 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
                title="Message Owner"
              >
                <MessageCircle className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase flex items-center shrink-0">
            <Clock className="h-3 w-3 mr-1" />
            {rental.createdAt?.seconds
              ? formatDistanceToNow(rental.createdAt.seconds * 1000, {
                  addSuffix: true,
                })
              : "Just now"}
          </span>

          {isOwner && (
            <div className="flex gap-1">
              {onEdit && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(rental);
                  }}
                  className="p-2 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg transition-all"
                  title={t("edit")}
                >
                  <FileEdit className="h-4 w-4" />
                </motion.button>
              )}
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(rental.id);
                  }}
                  className="p-2 text-slate-400 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all"
                  title={t("delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
