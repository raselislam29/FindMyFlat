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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto sm:overflow-hidden bg-white rounded-2xl shadow-xl flex flex-col sm:flex-row"
        >
          {/* Mobile close button */}
          <button onClick={onClose} className="sm:hidden absolute top-4 right-4 p-2 bg-white/80 hover:bg-gray-100 backdrop-blur rounded-full z-10 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>

          <div className="w-full sm:w-[60%] p-8 flex flex-col bg-white sm:overflow-y-auto style-scrollbar">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="mb-3">
                  {rental.status === 'rented' ? (
                    <span className="bg-red-500 text-white shadow-md text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{t('rented')}</span>
                  ) : (
                    <span className="bg-emerald-500 shadow-md text-white border-transparent text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{t('available')}</span>
                  )}
                </div>
                <h2 className="text-3xl font-display font-bold text-slate-800 mb-2 leading-tight">{rental.title}</h2>
                <div className="flex items-center text-slate-500 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md self-start inline-flex mt-1">
                  <MapPin className="h-4 w-4 mr-1.5" />
                  <span className="font-medium tracking-wide text-sm">{rental.location}</span>
                </div>
              </div>
              
              {(!isOwner) && onToggleFavorite && (
                <button 
                  onClick={() => onToggleFavorite(rental)}
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <Heart className={`h-6 w-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              )}
            </div>

            <div className="text-4xl font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-extrabold mb-8 border-b border-indigo-50 pb-6">
              ${rental.price.toLocaleString()} <span className="text-sm font-sans font-bold tracking-widest uppercase text-slate-400 ml-2">{t('priceAmount')}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 py-2 mb-8">
              <div className="flex flex-col items-center justify-center text-center bg-indigo-50/80 border border-indigo-100/50 rounded-2xl p-4">
                <BedDouble className="h-6 w-6 text-indigo-500 mb-2" />
                <span className="font-bold text-indigo-900 text-lg">{rental.bedrooms}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 mt-1">{t('bedrooms')}</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center bg-cyan-50/80 border border-cyan-100/50 rounded-2xl p-4">
                <Bath className="h-6 w-6 text-cyan-500 mb-2" />
                <span className="font-bold text-cyan-900 text-lg">{rental.bathrooms}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-500 mt-1">{t('bathrooms')}</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center bg-purple-50/80 border border-purple-100/50 rounded-2xl p-4">
                <Square className="h-6 w-6 text-purple-500 mb-2" />
                <span className="font-bold text-purple-900 text-lg">{rental.sizeSqft}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-500 mt-1">{t('sqft')}</span>
              </div>
            </div>

            <div className="flex-1">
              {rental.amenities && rental.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-display font-bold text-slate-800 mb-3 text-lg">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {rental.amenities.map((amenity, idx) => (
                      <span key={`${amenity}-${idx}`} className="px-3 py-1.5 bg-pink-50 text-pink-700 text-sm rounded-full font-bold border border-pink-100">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {rental.photoUrls && rental.photoUrls.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-display font-bold text-gray-900 mb-3 text-lg">Photos</h3>
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x style-scrollbar">
                    {rental.photoUrls.map((url, idx) => (
                      <div key={idx} onClick={() => setSelectedImage(url)} className="shrink-0 w-56 h-40 rounded-xl overflow-hidden snap-center border border-gray-100 shadow-sm relative group cursor-pointer">
                         <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                         <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">View Full Image</span>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h3 className="font-display font-bold text-slate-800 mb-3 text-lg">{t('descriptionLabel')}</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-sans text-base">{rental.description}</p>
            </div>

            <div className="mt-8 pt-6 border-t border-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!rental.hidePhone ? (
                  <a 
                    href={`tel:${rental.contactPhone}`}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-full font-bold transition-all shadow-md flex items-center gap-2"
                  >
                    <Phone className="h-5 w-5" />
                    {t('call')}
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
