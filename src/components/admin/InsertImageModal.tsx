'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { adminBlogApi } from '@/lib/api';

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  token: string;
}

const ASPECT_OPTIONS = [
  { value: 'auto', label: 'Auto / Natural', sub: 'Original ratio' },
  { value: '1:1', label: '1:1 Square', sub: 'Instagram / Product' },
  { value: '16:9', label: '16:9 Landscape', sub: 'Cinematic wide' },
  { value: '3:4', label: '3:4 Portrait', sub: 'Editorial vertical' },
  { value: '9:16', label: '9:16 Story', sub: 'Phone screen / Reel' },
  { value: '4:3', label: '4:3 Standard', sub: 'Classic photo' },
];

export default function InsertImageModal({
  isOpen,
  onClose,
  onInsert,
  token,
}: InsertImageModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('auto');
  const [detectedAspect, setDetectedAspect] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const detectImageRatio = (url: string) => {
    if (typeof window === 'undefined' || !url) return;
    const img = new window.Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w && h) {
        const ratio = w / h;
        let detected = 'auto';
        if (Math.abs(ratio - 1) <= 0.08) detected = '1:1';
        else if (Math.abs(ratio - 9 / 16) <= 0.08) detected = '9:16';
        else if (Math.abs(ratio - 3 / 4) <= 0.08) detected = '3:4';
        else if (Math.abs(ratio - 4 / 3) <= 0.08) detected = '4:3';
        else if (Math.abs(ratio - 16 / 9) <= 0.12) detected = '16:9';
        
        setDetectedAspect(detected);
        setAspectRatio(detected);
      }
    };
    img.src = url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      const res = await adminBlogApi.uploadImage(file, token);
      if (res.url) {
        setImageUrl(res.url);
        detectImageRatio(res.url);
      } else {
        setUploadError(res.error || 'Failed to upload image.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsert = () => {
    if (!imageUrl.trim()) return;

    const alt = altText.trim() || caption.trim() || 'Blog photo';
    const cap = caption.trim();

    let html = `<figure class="blog-image" data-aspect="${aspectRatio}">\n  <img src="${imageUrl.trim()}" alt="${alt}" />`;
    if (cap) {
      html += `\n  <figcaption>${cap}</figcaption>`;
    }
    html += `\n</figure>`;

    onInsert(html);
    handleClose();
  };

  const handleClose = () => {
    setImageUrl('');
    setAltText('');
    setCaption('');
    setAspectRatio('auto');
    setDetectedAspect(null);
    setUploadError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Insert Single Image</h3>
              <p className="text-xs text-slate-500">Upload to Cloudinary or paste an image URL</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {activeTab === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imageUrl ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                  <Image
                    src={imageUrl}
                    alt="Uploaded preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer transition-all p-6 text-center group"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 text-primary animate-spin" />
                      <span className="text-xs font-bold text-slate-600">Uploading to Cloudinary...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/30 transition-all mb-3">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Click or drag image to upload
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PNG, JPG, WebP up to 10MB
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Direct Image Link
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  detectImageRatio(e.target.value);
                }}
                placeholder="https://res.cloudinary.com/... or https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              {uploadError}
            </p>
          )}

          {/* Aspect Ratio / Dimensions Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Dimensions & Aspect Ratio
              </label>
              {detectedAspect && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ✨ Smart-detected: {ASPECT_OPTIONS.find((o) => o.value === detectedAspect)?.label || detectedAspect}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ASPECT_OPTIONS.map((opt) => {
                const isSelected = aspectRatio === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAspectRatio(opt.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata Inputs */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. 2026 engagement metrics breakdown"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Alt Text (SEO & Accessibility)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Descriptive text for screen readers and Google image search"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-6 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!imageUrl.trim() || isUploading}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
}
