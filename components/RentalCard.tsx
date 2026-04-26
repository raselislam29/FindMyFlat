'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { BedDouble, Bath, Square, MapPin, Phone, Clock, FileEdit, Trash2, MessageCircle, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';

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
  status: 'available' | 'rented';
  createdAt: any;
  updatedAt: any;
  lat?: number;
  lng?: number;
  hidePhone?: boolean;
  photoUrls?: string[];
  propertyType?: string;
  amenities?: string[];
}

export function RentalCard({ rental, onDelete, onEdit, onClick, onMessageOwner, isFavorite, onToggleFavorite }: { rental: Rental, onDelete?: (id: string) => void, onEdit?: (rental: Rental) => void, onClick?: (rental: Rental) => void, onMessageOwner?: (rental: Rental) => void, isFavorite?: boolean, onToggleFavorite?: (rental: Rental) => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const isOwner = user?.uid === rental.ownerId;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick && onClick(rental)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 relative cursor-pointer group/card hover:-translate-y-1"
    >
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {rental.status === 'rented' ? (
          <div className="bg-red-500/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider backdrop-blur-md">
            {t('rented')}
          </div>
        ) : (
          <div className="bg-emerald-500/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider backdrop-blur-md">
            {t('available')}
          </div>
        )}
      </div>
      
      {(!isOwner) && onToggleFavorite && (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(rental); }}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-sm transition-all hover:scale-110 active:scale-95"
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
      )}
      
      <div className="aspect-[4/3] w-full bg-slate-100 relative group overflow-hidden">
        <img 
          src={rental.photoUrls && rental.photoUrls.length > 0 ? rental.photoUrls[0] : `https://picsum.photos/seed/${rental.id}/800/600`} 
          alt={rental.title}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 ${rental.status === 'rented' ? 'grayscale opacity-70' : ''}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-purple-900/40 to-transparent flex flex-col justify-end p-5">
          <div className="text-white font-medium flex items-baseline gap-1.5">
            <span className="font-display text-4xl">${rental.price.toLocaleString()}</span> <span className="text-sm font-bold text-indigo-200 tracking-wide uppercase">{t('priceAmount')}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display font-bold text-xl text-slate-800 mb-2 line-clamp-1 group-hover/card:text-pink-600 transition-colors">{rental.title}</h3>
        
        <div className="flex items-center text-slate-500 text-sm mb-4">
          <MapPin className="h-4 w-4 mr-1.5 shrink-0 text-amber-500" />
          <span className="truncate">{rental.location}</span>
        </div>
        
        <div className="flex justify-between items-center py-4 border-t border-b border-indigo-50 mb-4 px-2">
          <div className="flex flex-col items-center justify-center text-center">
            <BedDouble className="h-5 w-5 text-indigo-500 mb-1" />
            <span className="text-sm font-bold text-slate-800">{rental.bedrooms}</span>
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mt-0.5">{t('bedrooms')}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-l border-r border-indigo-50 px-6">
            <Bath className="h-5 w-5 text-cyan-500 mb-1" />
            <span className="text-sm font-bold text-slate-800">{rental.bathrooms}</span>
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mt-0.5">{t('bathrooms')}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <Square className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-sm font-bold text-slate-800">{rental.sizeSqft}</span>
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mt-0.5">{t('sqft')}</span>
          </div>
        </div>
        
        {rental.amenities && rental.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {rental.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={`${amenity}-${idx}`} className="px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded-full font-bold">
                {amenity}
              </span>
            ))}
            {rental.amenities.length > 3 && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-bold">
                +{rental.amenities.length - 3}
              </span>
            )}
          </div>
        )}
        
        <div className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px] leading-relaxed">
          {rental.description}
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-2">
            {!rental.hidePhone ? (
              <a 
                href={`tel:${rental.contactPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center bg-cyan-50 text-cyan-600 hover:bg-cyan-500 hover:text-white h-9 w-9 rounded-full transition-all duration-300"
                title={t('contactOwner')}
              >
                <Phone className="h-4 w-4" />
              </a>
            ) : (
              <div 
                className="inline-flex items-center justify-center bg-slate-50 text-slate-300 h-9 w-9 rounded-full cursor-not-allowed border border-slate-100"
                title={t('hiddenPhone')}
              >
                <Phone className="h-4 w-4" />
              </div>
            )}
            {(!isOwner) && onMessageOwner && (
              <button 
                onClick={(e) => { e.stopPropagation(); onMessageOwner(rental); }}
                className="inline-flex items-center justify-center bg-pink-50 text-pink-600 hover:bg-pink-500 hover:text-white h-9 w-9 rounded-full transition-all duration-300"
                title="Message Owner"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <span className="text-[11px] text-slate-400 font-bold tracking-wide flex items-center uppercase">
            <Clock className="h-3 w-3 mr-1.5" />
            {rental.createdAt?.seconds ? formatDistanceToNow(rental.createdAt.seconds * 1000, { addSuffix: true }) : 'Just now'}
          </span>

          {isOwner && (
            <div className="flex gap-2">
              {onEdit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(rental); }}
                  className="p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors"
                  title={t('edit')}
                >
                  <FileEdit className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(rental.id); }}
                  className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                  title={t('delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
