'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Rental } from './RentalCard';
import { X, BedDouble, Bath, Square, MapPin, Phone, Clock, FileEdit, Trash2, MessageCircle, Heart, Navigation, Shield, GraduationCap, TrainFront } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { SingleRentalMap } from './DynamicMap';
import { useAuth } from '@/context/AuthContext';

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

export function RentalDetailsModal({ rental, isOpen, onClose, onEdit, onDelete, onMessageOwner, isFavorite, onToggleFavorite }: { rental: Rental | null, isOpen: boolean, onClose: () => void, onEdit?: (r: Rental) => void, onDelete?: (id: string) => void, onMessageOwner?: (r: Rental) => void, isFavorite?: boolean, onToggleFavorite?: (rental: Rental) => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  if (!isOpen || !rental) return null;

  const isOwner = user?.uid === rental.ownerId;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(rental.id);
      onClose();
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(rental);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-xl"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto sm:overflow-hidden bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-premium flex flex-col sm:flex-row border border-white/50"
        >
          {/* Mobile close button */}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose} 
            className="sm:hidden absolute top-4 right-4 p-3 bg-white/90 hover:bg-white backdrop-blur-md rounded-full z-10 transition-all shadow-lg"
          >
            <X className="h-5 w-5 text-slate-600" />
          </motion.button>

          {/* Main Content */}
          <div className="w-full sm:w-[60%] p-8 lg:p-10 flex flex-col bg-white sm:overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="mb-4">
                  {rental.status === 'rented' ? (
                    <motion.span 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="bg-red-500/95 text-white shadow-lg shadow-red-500/30 text-[11px] font-black px-4 py-2 rounded-full uppercase tracking-widest backdrop-blur-md"
                    >
                      {t('rented')}
                    </motion.span>
                  ) : (
                    <motion.span 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="bg-emerald-500/95 text-white shadow-lg shadow-emerald-500/30 text-[11px] font-black px-4 py-2 rounded-full uppercase tracking-widest backdrop-blur-md"
                    >
                      {t('available')}
                    </motion.span>
                  )}
                </div>
                <h2 className="text-4xl lg:text-5xl font-display font-black text-slate-900 mb-3 leading-tight">{rental.title}</h2>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center text-slate-600 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-4 py-2.5 rounded-lg self-start inline-flex mt-2 border border-amber-200/50 shadow-soft"
                >
                  <MapPin className="h-5 w-5 mr-2 text-amber-500" />
                  <span className="font-bold tracking-wide text-sm">{rental.location}</span>
                </motion.div>
              </div>
              
              {(!isOwner) && onToggleFavorite && (
                <motion.button 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onToggleFavorite(rental)}
                  className="p-3 bg-white hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 rounded-full transition-all flex-shrink-0 border border-slate-200/50 shadow-soft hover:shadow-glow-pink"
                >
                  <Heart className={`h-6 w-6 transition-all ${isFavorite ? 'fill-red-500 text-red-500 animate-pulse' : 'text-slate-400 hover:text-red-500'}`} />
                </motion.button>
              )}
            </div>

            {/* Price */}
            <div className="text-5xl lg:text-6xl font-display font-black text-gradient-primary mb-8 border-b-2 border-gradient-to-r from-pink-200 to-purple-200 pb-6">
              ${rental.price.toLocaleString()} 
              <span className="text-base font-sans font-bold tracking-widest uppercase text-slate-500 ml-3 align-middle">{t('priceAmount')}</span>
            </div>
            
            {/* Property Features Grid */}
            <div className="grid grid-cols-3 gap-3 py-4 mb-8 px-1">
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200/50 rounded-2xl p-5 shadow-soft hover:shadow-glow-blue"
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg mb-3 text-white shadow-lg"
                >
                  <BedDouble className="h-5 w-5" />
                </motion.div>
                <span className="font-black text-indigo-900 text-2xl">{rental.bedrooms}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 mt-2">{t('bedrooms')}</span>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200/50 rounded-2xl p-5 shadow-soft hover:shadow-glow-blue"
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg mb-3 text-white shadow-lg"
                >
                  <Bath className="h-5 w-5" />
                </motion.div>
                <span className="font-black text-cyan-900 text-2xl">{rental.bathrooms}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-600 mt-2">{t('bathrooms')}</span>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200/50 rounded-2xl p-5 shadow-soft hover:shadow-glow-purple"
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg mb-3 text-white shadow-lg"
                >
                  <Square className="h-5 w-5" />
                </motion.div>
                <span className="font-black text-purple-900 text-2xl">{rental.sizeSqft}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 mt-2">{t('sqft')}</span>
              </motion.div>
            </div>

            {/* Content Section */}
            <div className="flex-1">
              {/* Amenities */}
              {rental.amenities && rental.amenities.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-display font-black text-slate-900 mb-4 text-xl">✨ Amenities</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {rental.amenities.map((amenity, idx) => (
                      <motion.span 
                        key={`${amenity}-${idx}`}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="px-4 py-2.5 bg-gradient-to-r from-pink-100 to-pink-50 text-pink-700 text-sm rounded-full font-bold border-2 border-pink-200/50 shadow-soft hover:shadow-glow-pink"
                      >
                        {amenity}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Gallery */}
              {rental.photoUrls && rental.photoUrls.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-display font-black text-slate-900 mb-4 text-xl">📸 Photos</h3>
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                    {rental.photoUrls.map((url, idx) => (
                      <motion.div 
                        key={idx} 
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedImage(url)} 
                        className="shrink-0 w-64 h-48 rounded-2xl overflow-hidden snap-center border-2 border-slate-200/50 shadow-soft relative group cursor-pointer hover:shadow-lg"
                      >
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                          <motion.span 
                            initial={{ scale: 0.9 }}
                            whileHover={{ scale: 1 }}
                            className="bg-white/95 text-slate-900 text-sm font-bold px-4 py-2 rounded-lg shadow-lg"
                          >
                            View Full
                          </motion.span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="font-display font-black text-slate-900 mb-4 text-xl">📝 Description</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-base bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200/50">{rental.description}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t-2 border-slate-200/50 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                {!rental.hidePhone ? (
                  <motion.a 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`tel:${rental.contactPhone}`}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3.5 rounded-xl font-black transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 text-sm uppercase tracking-wide"
                  >
                    <Phone className="h-5 w-5" />
                    {t('call')}
                  </motion.a>
                ) : (
                  <div className="bg-slate-100 text-slate-500 px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 border-2 border-slate-200">
                    <Phone className="h-5 w-5 opacity-50" />
                    {t('hiddenPhone')}
                  </div>
                )}
                
                {(!isOwner) && onMessageOwner && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMessageOwner(rental)}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-3.5 rounded-xl font-black transition-all shadow-lg shadow-pink-500/30 flex items-center gap-2 text-sm uppercase tracking-wide"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Message
                  </motion.button>
                )}
                
                {isOwner && (
                  <>
                    {onEdit && (
                       <motion.button 
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={handleEdit} 
                         className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 hover:bg-indigo-200 rounded-xl transition-all font-black shadow-soft hover:shadow-glow-blue" 
                         title={t('edit')}
                       >
                         <FileEdit className="h-5 w-5" />
                       </motion.button>
                    )}
                    {onDelete && (
                       <motion.button 
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={handleDelete} 
                         className="p-3 bg-gradient-to-br from-red-100 to-red-50 border-2 border-red-200 text-red-600 hover:bg-red-200 rounded-xl transition-all font-black shadow-soft hover:shadow-glow-pink" 
                         title={t('delete')}
                       >
                         <Trash2 className="h-5 w-5" />
                       </motion.button>
                    )}
                  </>
                )}
              </div>
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="text-sm text-slate-500 font-black uppercase tracking-wider flex items-center bg-slate-100/50 px-4 py-2.5 rounded-lg border border-slate-200/50"
              >
                <Clock className="h-4 w-4 mr-2" />
                {rental.createdAt?.seconds ? formatDistanceToNow(rental.createdAt.seconds * 1000, { addSuffix: true }) : 'Just now'}
              </motion.span>
            </div>
          </div>

          {/* Sidebar - Map and Insights */}
          <div className="w-full sm:w-[40%] bg-gradient-to-br from-slate-50 to-slate-100 border-l-2 border-slate-200/50 flex flex-col">
             {/* Desktop close button */}
             <div className="hidden sm:flex justify-end p-4 pb-0 z-10 absolute top-0 right-0">
               <motion.button 
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={onClose} 
                 className="p-3 bg-white hover:bg-gradient-to-br hover:from-slate-100 hover:to-slate-50 rounded-full shadow-soft hover:shadow-lg transition-all border border-slate-200/50 z-10"
               >
                 <X className="h-5 w-5 text-slate-600" />
               </motion.button>
             </div>

             {/* Map Section */}
             <div className="h-[280px] w-full bg-gradient-to-br from-blue-200 to-purple-200 z-0 rounded-b-none sm:rounded-none overflow-hidden">
               <SingleRentalMap rental={rental} />
             </div>

             {/* Insights Section */}
             <div className="p-6 overflow-y-auto flex-1">
               <h3 className="font-display text-lg font-black text-slate-900 mb-5 pl-1">🏘️ Location Insights</h3>
               
               {/* Commute Card */}
               <motion.div 
                 whileHover={{ scale: 1.02, y: -2 }}
                 className="bg-white rounded-2xl p-5 shadow-soft border-2 border-slate-200/50 mb-4 hover:shadow-lg transition-all"
               >
                 <h4 className="flex items-center gap-2 font-display font-bold text-slate-900 mb-3">
                   <Navigation className="w-5 h-5 text-violet-500" /> Commute
                 </h4>
                 <div className="space-y-2.5 text-sm text-slate-700 pl-7 font-medium">
                   <p className="flex justify-between"><span>To Downtown</span> <span className="font-bold text-slate-900">~25 min MTA</span></p>
                   <p className="flex justify-between"><span>Nearest Subway</span> <span className="font-bold text-slate-900">3 blocks</span></p>
                   <p className="text-xs text-slate-500 mt-2 italic font-normal">*Estimates based on typical times</p>
                 </div>
               </motion.div>

               {/* Neighborhood Card */}
               <motion.div 
                 whileHover={{ scale: 1.02, y: -2 }}
                 className="bg-white rounded-2xl p-5 shadow-soft border-2 border-slate-200/50 hover:shadow-lg transition-all"
               >
                 <h4 className="font-display font-bold text-slate-900 mb-4">Neighborhood Vibe</h4>
                 <ul className="space-y-3.5 text-sm text-slate-700">
                   <li className="flex items-start gap-3">
                     <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 font-bold" />
                     <span><strong className="text-slate-900">Safety:</strong> Generally highly rated. Vibrant streets after dark.</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <GraduationCap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 font-bold" />
                     <span><strong className="text-slate-900">Schools:</strong> District highly ranked for elementary education.</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <TrainFront className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5 font-bold" />
                     <span><strong className="text-slate-900">Transit:</strong> Excellent access to major bus and subway lines.</span>
                   </li>
                 </ul>
                 <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-200 italic font-normal">*AI-generated generic insight, API expanding soon.</p>
               </motion.div>
             </div>
          </div>
        </motion.div>
      </div>
                  </a>
                ) : (
                  <div className="bg-slate-50 text-slate-400 px-5 py-2.5 rounded-full font-bold flex items-center gap-2 border border-slate-200">
                    <Phone className="h-5 w-5 opacity-50" />
                    {t('hiddenPhone')}
                  </div>
                )}
                
                {(!isOwner) && onMessageOwner && (
                  <button 
                    onClick={() => onMessageOwner(rental)}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 shadow-md"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Message
                  </button>
                )}
                
                {isOwner && (
                  <>
                    {onEdit && (
                       <button onClick={handleEdit} className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors font-bold" title={t('edit')}>
                         <FileEdit className="h-5 w-5" />
                       </button>
                    )}
                    {onDelete && (
                       <button onClick={handleDelete} className="p-3 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-full transition-colors font-bold" title={t('delete')}>
                         <Trash2 className="h-5 w-5" />
                       </button>
                    )}
                  </>
                )}
              </div>
              <span className="text-sm text-slate-400 font-bold uppercase tracking-wider flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {rental.createdAt?.seconds ? formatDistanceToNow(rental.createdAt.seconds * 1000, { addSuffix: true }) : 'Just now'}
              </span>
            </div>
          </div>

          {/* Map and Insights Sidebar */}
          <div className="w-full sm:w-[40%] bg-gray-50 border-l border-gray-200 flex flex-col">
             {/* Desktop close button */}
             <div className="hidden sm:flex justify-end p-4 pb-0 z-10 absolute top-0 right-0">
               <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors z-10">
                 <X className="h-5 w-5 text-gray-500" />
               </button>
             </div>

             <div className="h-[300px] w-full bg-gray-200 z-0">
               <SingleRentalMap rental={rental} />
             </div>

             <div className="p-6 overflow-y-auto">
               <h3 className="font-display text-lg font-bold text-gray-900 mb-4 pl-1">Location Insights</h3>
               
               <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                 <h4 className="flex items-center gap-2 font-display font-bold text-gray-800 mb-2">
                   <Navigation className="w-4 h-4 text-violet-500" /> Commute
                 </h4>
                 <div className="space-y-2 text-sm text-gray-600 pl-6">
                   <p className="flex justify-between"><span>To Downtown</span> <span className="font-medium text-gray-900">~25 min MTA</span></p>
                   <p className="flex justify-between"><span>Nearest Subway</span> <span className="font-medium text-gray-900">3 blocks</span></p>
                   <p className="text-xs text-gray-400 mt-1 italic">*Estimates based on typical times</p>
                 </div>
               </div>

               <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                 <h4 className="flex items-center gap-2 font-display font-bold text-gray-800 mb-3">
                   Neighborhood Vibe
                 </h4>
                 <ul className="space-y-3 text-sm text-gray-600">
                   <li className="flex items-start gap-2">
                     <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                     <span><strong>Safety:</strong> Generally highly rated. Vibrant streets after dark.</span>
                   </li>
                   <li className="flex items-start gap-2">
                     <GraduationCap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                     <span><strong>Schools:</strong> District highly ranked for elementary education.</span>
                   </li>
                   <li className="flex items-start gap-2">
                     <TrainFront className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                     <span><strong>Transit:</strong> Excellent access to major bus and subway lines.</span>
                   </li>
                 </ul>
                 <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 italic">*AI-generated generic insight, API expanding soon.</p>
               </div>
             </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[200] flex flex-col bg-black/95">
            <div className="absolute top-0 w-full p-4 flex justify-end z-[210] pointer-events-none">
              <button 
                onClick={() => setSelectedImage(null)} 
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors pointer-events-auto shadow-lg backdrop-blur-sm"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 w-full h-full">
              <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <React.Fragment>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-full z-[210] shadow-2xl border border-white/20">
                      <button onClick={() => zoomOut()} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"><ZoomOut className="w-5 h-5" /></button>
                      <button onClick={() => resetTransform()} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"><Maximize className="w-5 h-5" /></button>
                      <button onClick={() => zoomIn()} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"><ZoomIn className="w-5 h-5" /></button>
                    </div>
                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                      <motion.img 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.9 }}
                        src={selectedImage} 
                        alt="Full size" 
                        className="max-w-[100vw] max-h-[100vh] object-contain cursor-grab active:cursor-grabbing"
                        draggable={false}
                      />
                    </TransformComponent>
                  </React.Fragment>
                )}
              </TransformWrapper>
            </div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
