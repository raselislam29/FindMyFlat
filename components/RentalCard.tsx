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
      className="card-gradient overflow-hidden relative cursor-pointer group/card h-full flex flex-col"
    >
      {/* Image Container */}
      <div className="aspect-[4/3] w-full bg-gradient-to-br from-slate-200 to-slate-300 relative group overflow-hidden">
        <img
          src={
            rental.photoUrls && rental.photoUrls.length > 0
              ? rental.photoUrls[0]
              : `https://picsum.photos/seed/${rental.id}/800/600`
          }
          alt={rental.title}
          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"} ${rental.status === "rented" ? "grayscale opacity-60" : ""}`}
          referrerPolicy="no-referrer"
        />
        {/* Gradient Overlay */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${isHovered ? "bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" : "bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent"}`}
        ></div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {rental.status === "rented" ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-red-500/95 backdrop-blur-md text-white text-[10px] font-black px-3.5 py-1.5 rounded-full shadow-lg shadow-red-500/30 uppercase tracking-widest"
            >
              {t("rented")}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-emerald-500/95 backdrop-blur-md text-white text-[10px] font-black px-3.5 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 uppercase tracking-widest flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              {t("available")}
            </motion.div>
          )}
        </div>

        {/* Favorite Button */}
        {!isOwner && onToggleFavorite && (
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(rental);
            }}
            className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 hover:bg-white backdrop-blur-md rounded-full shadow-lg transition-all group/fav"
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${isFavorite ? "fill-red-500 text-red-500 animate-pulse" : "text-gray-400 group-hover/fav:text-red-500"}`}
            />
          </motion.button>
        )}

        {/* Price Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${isHovered ? "opacity-100 translate-y-0" : "opacity-90"} p-5`}
        >
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-black text-white drop-shadow-lg">
              ${rental.price.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-gray-200 tracking-wide uppercase drop-shadow">
              {t("priceAmount")}
            </span>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-6 flex flex-col flex-1">
        {/* Title & Location */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-black text-lg text-slate-900 mb-0 line-clamp-1 group-hover/card:text-transparent group-hover/card:bg-gradient-to-r group-hover/card:from-pink-600 group-hover/card:to-purple-600 group-hover/card:bg-clip-text transition-all duration-300">
              {rental.title}
            </h3>
            {ownerProfile?.verified && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                Verified
              </span>
            )}
          </div>
          {ownerProfile && (
            <div className="text-xs text-slate-500 mb-2">
              <span className="font-semibold">Owner:</span> {ownerProfile.displayName || ownerProfile.email}
              {typeof ownerProfile.profileCompletion === 'number' && (
                <span className="ml-2 text-[11px] font-bold text-slate-600">· {Math.round(ownerProfile.profileCompletion)}% profile</span>
              )}
              {typeof ownerProfile.responseRate === 'number' && (
                <span className="ml-2 text-[11px] font-bold text-slate-600">· {Math.round(ownerProfile.responseRate * 100)}% response</span>
              )}
            </div>
          )}
          <div className="flex items-center text-slate-600 text-sm font-semibold mb-2 group-hover/card:text-slate-900 transition-colors">
            <MapPin className="h-4 w-4 mr-2 text-gradient-secondary shrink-0" />
            <span className="truncate">{rental.location}</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-3 py-4 mb-4 px-2 bg-gradient-to-r from-slate-100/50 to-slate-50/50 rounded-xl border border-slate-200/50">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center justify-center text-center p-2"
          >
            <motion.div
              whileHover={{ rotate: 10 }}
              className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg mb-1.5 text-white shadow-lg"
            >
              <BedDouble className="h-4 w-4" />
            </motion.div>
            <span className="text-base font-black text-slate-900">
              {rental.bedrooms}
            </span>
            <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mt-1">
              {t("bedrooms")}
            </span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center justify-center text-center p-2 border-l border-r border-slate-200/70"
          >
            <motion.div
              whileHover={{ rotate: 10 }}
              className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg mb-1.5 text-white shadow-lg"
            >
              <Bath className="h-4 w-4" />
            </motion.div>
            <span className="text-base font-black text-slate-900">
              {rental.bathrooms}
            </span>
            <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mt-1">
              {t("bathrooms")}
            </span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center justify-center text-center p-2"
          >
            <motion.div
              whileHover={{ rotate: 10 }}
              className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg mb-1.5 text-white shadow-lg"
            >
              <Square className="h-4 w-4" />
            </motion.div>
            <span className="text-base font-black text-slate-900">
              {rental.sizeSqft}
            </span>
            <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mt-1">
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
