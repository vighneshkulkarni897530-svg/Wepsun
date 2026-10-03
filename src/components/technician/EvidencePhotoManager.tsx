import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  Video,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  X,
} from 'lucide-react';
import { TechnicianJob } from '../../types';

interface EvidencePhotoManagerProps {
  job: TechnicianJob;
  onUpdateEvidence: (
    beforeEvidence: TechnicianJob['beforeEvidence'],
    afterEvidence: TechnicianJob['afterEvidence']
  ) => void;
  onNavigateToTab: (tab: string) => void;
  showToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const EvidencePhotoManager: React.FC<EvidencePhotoManagerProps> = ({
  job,
  onUpdateEvidence,
  onNavigateToTab,
  showToast,
}) => {
  const [activeStage, setActiveStage] = useState<'before' | 'after'>('before');
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string; desc: string; time: string; type: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, stage: 'before' | 'after', isVideo = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const now = new Date();
    const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newItems: TechnicianJob['beforeEvidence'] = [];

    Array.from(files).forEach((file, idx) => {
      const isVid = file.type.startsWith('video') || isVideo;
      const objectUrl = URL.createObjectURL(file);
      newItems.push({
        id: `ev-${Date.now()}-${idx}`,
        type: isVid ? 'video' : 'photo',
        url: objectUrl,
        description: `${stage === 'before' ? 'Before intervention' : 'Post-repair testing'}: ${file.name}`,
        uploadedAt: timeStr,
      });
    });

    const beforeList = job?.beforeEvidence || [];
    const afterList = job?.afterEvidence || [];

    if (stage === 'before') {
      const updatedBefore = [...beforeList, ...newItems];
      onUpdateEvidence(updatedBefore, afterList);
      showToast('success', 'Before Evidence Uploaded', `Added ${newItems.length} file(s) to Before Work gallery.`);
    } else {
      const updatedAfter = [...afterList, ...newItems];
      onUpdateEvidence(beforeList, updatedAfter);
      showToast('success', 'After Evidence Uploaded', `Added ${newItems.length} file(s) to After Work gallery.`);
    }

    // Reset input
    e.target.value = '';
  };

  const beforeEvidence = job?.beforeEvidence || [];
  const afterEvidence = job?.afterEvidence || [];

  const handleAddSimulatedSample = (stage: 'before' | 'after') => {
    const now = new Date();
    const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const sampleImages = {
      before: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=700&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=700&auto=format&fit=crop&q=80',
      ],
      after: [
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=700&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1574958269340-fa927304f208?w=700&auto=format&fit=crop&q=80',
      ],
    };

    const newItem = {
      id: `ev-sample-${Date.now()}`,
      type: 'photo' as const,
      url: sampleImages[stage][Math.floor(Math.random() * sampleImages[stage].length)],
      description:
        stage === 'before'
          ? 'Pre-service condition: Mechanical wear on landing lock contact points.'
          : 'Post-service test: Cleaned and calibrated OEM interlock mechanism operating in auto mode.',
      uploadedAt: timeStr,
    };

    if (stage === 'before') {
      onUpdateEvidence([...beforeEvidence, newItem], afterEvidence);
    } else {
      onUpdateEvidence(beforeEvidence, [...afterEvidence, newItem]);
    }
    showToast('success', 'Photo Added', `Added sample evidence snapshot to ${stage === 'before' ? 'Before' : 'After'} gallery.`);
  };

  const handleDeleteItem = (id: string, stage: 'before' | 'after') => {
    if (stage === 'before') {
      const updated = beforeEvidence.filter((item) => item.id !== id);
      onUpdateEvidence(updated, afterEvidence);
    } else {
      const updated = afterEvidence.filter((item) => item.id !== id);
      onUpdateEvidence(beforeEvidence, updated);
    }
    showToast('info', 'Item Removed', 'Evidence media deleted from draft report.');
  };

  const currentGallery = activeStage === 'before' ? beforeEvidence : afterEvidence;

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFileUpload(e, activeStage)}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileUpload(e, activeStage)}
        className="hidden"
      />

      {/* Header & Stage Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Before & After Photo/Video Evidence</h2>
              <p className="text-xs text-slate-500">
                Timestamped digital proof of initial breakdown condition & post-repair operational testing
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Take Camera Photo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Upload from Gallery</span>
            </button>
          </div>
        </div>

        {/* Dual Tab Switcher: Before Work vs After Work */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setActiveStage('before')}
            className={`p-3.5 rounded-xl border-2 font-bold text-xs transition-all flex items-center justify-between ${
              activeStage === 'before'
                ? 'border-[#1976D2] bg-blue-50/50 text-[#123B5D] shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1976D2] flex items-center justify-center font-black text-[11px]">
                1
              </span>
              <div className="text-left">
                <span className="block font-black text-sm">Before Work Evidence</span>
                <span className="text-[10px] text-slate-500 font-normal">Initial defect / breakdown photos</span>
              </div>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-100 text-[#1976D2] font-black">
              {beforeEvidence.length} items
            </span>
          </button>

          <button
            onClick={() => setActiveStage('after')}
            className={`p-3.5 rounded-xl border-2 font-bold text-xs transition-all flex items-center justify-between ${
              activeStage === 'after'
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[11px]">
                2
              </span>
              <div className="text-left">
                <span className="block font-black text-sm">After Work Evidence</span>
                <span className="text-[10px] text-slate-500 font-normal">Completed repair & safe operation photos</span>
              </div>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">
              {afterEvidence.length} items
            </span>
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {currentGallery.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No {activeStage === 'before' ? 'Before Work' : 'After Work'} Evidence Uploaded
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Capture photos of {activeStage === 'before' ? 'the faulty components or hoistway condition' : 'the replaced OEM parts and functioning elevator'} to include in the client service report.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs"
            >
              📷 Open Camera
            </button>
            <button
              onClick={() => handleAddSimulatedSample(activeStage)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              + Add Sample Image
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentGallery.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              {/* Media Preview Container */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                {item.type === 'video' ? (
                  <video src={item.url} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={item.url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                )}

                {/* Timestamp & Job Watermark Badge */}
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md rounded-lg px-2.5 py-1 text-[10px] text-white flex items-center justify-between font-mono">
                  <span className="font-bold text-amber-300">{job.jobId}</span>
                  <span className="text-slate-300">{item.uploadedAt}</span>
                </div>

                {/* Quick Expand Button */}
                <button
                  onClick={() =>
                    setPreviewMedia({
                      url: item.url,
                      title: `${activeStage.toUpperCase()} WORK - ${job.jobId}`,
                      desc: item.description,
                      time: item.uploadedAt,
                      type: item.type,
                    })
                  }
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Caption & Controls */}
              <div className="p-4 space-y-2 text-xs flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    {item.type === 'video' ? '🎬 Video Record' : '📸 Photo Evidence'}
                  </span>
                  <p className="font-medium text-slate-800 leading-snug line-clamp-2">{item.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {item.uploadedAt}
                  </span>

                  <button
                    onClick={() => handleDeleteItem(item.id, activeStage)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200">{previewMedia.title}</h3>
                <p className="text-[11px] text-slate-400 font-mono">{previewMedia.time}</p>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
              {previewMedia.type === 'video' ? (
                <video src={previewMedia.url} controls autoPlay className="max-h-full max-w-full" />
              ) : (
                <img src={previewMedia.url} alt="Full preview" className="max-h-full max-w-full object-contain" />
              )}
            </div>

            <p className="text-xs text-slate-300 italic">{previewMedia.desc}</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => onNavigateToTab('parts')}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
        >
          ← Back to Spare Parts
        </button>

        <button
          onClick={() => onNavigateToTab('signature_otp')}
          className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center gap-2"
        >
          <span>Proceed to Client Sign-off & OTP</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
