'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, LayoutGrid, ArrowUp, ArrowDown, Trash2, Loader2, Plus } from 'lucide-react';
import { adminBlogApi } from '@/lib/api';

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
}

interface InsertGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  token: string;
}

const GALLERY_ASPECT_OPTIONS = [
  { value: '16:10', label: '16:10 Landscape', sub: 'Standard wide showcase' },
  { value: '1:1', label: '1:1 Square', sub: 'Clean square collage' },
  { value: '3:4', label: '3:4 Portrait', sub: 'Vertical editorial' },
  { value: '4:3', label: '4:3 Standard', sub: 'Classic photo' },
];

export default function InsertGalleryModal({
  isOpen,
  onClose,
  onInsert,
  token,
}: InsertGalleryModalProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>('16:10');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (items.length + files.length > 8) {
      setErrorMessage('Galleries look best with up to 6 images.');
    }

    setIsUploading(true);
    setErrorMessage('');

    const newItems: GalleryItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading photo ${i + 1} of ${files.length}...`);

      try {
        const res = await adminBlogApi.uploadImage(file, token);
        if (res.url) {
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            url: res.url,
            caption: '',
          });
        }
      } catch (err: any) {
        setErrorMessage(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    setIsUploading(false);
    setUploadProgress('');

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setItems(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setItems(next);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateCaption = (index: number, text: string) => {
    const next = [...items];
    next[index].caption = text;
    setItems(next);
  };

  const handleInsert = () => {
    if (items.length < 2) {
      setErrorMessage('Please add at least 2 photos for an image gallery.');
      return;
    }

    let html = `<div class="blog-gallery" data-gallery="true" data-aspect="${aspectRatio}">\n`;
    items.forEach((item, idx) => {
      const cap = item.caption.trim();
      const alt = cap || `Gallery photo ${idx + 1}`;
      html += `  <figure>\n    <img src="${item.url}" alt="${alt}" />\n`;
      if (cap) {
        html += `    <figcaption>${cap}</figcaption>\n`;
      }
      html += `  </figure>\n`;
    });
    html += `</div>`;

    onInsert(html);
    handleClose();
  };

  const handleClose = () => {
    setItems([]);
    setAspectRatio('16:10');
    setErrorMessage('');
    setUploadProgress('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Insert Swipeable Photo Gallery</h3>
              <p className="text-xs text-slate-500">Upload 2 to 6 images (mobile carousel + desktop side-by-side)</p>
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />

          {/* Upload Drop Zone */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/20 p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
                <span className="text-xs font-bold text-slate-700">{uploadProgress}</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:border-purple-200 transition-all mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click to select photos for this gallery
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select multiple files at once. Each will upload to Cloudinary.
                </p>
              </>
            )}
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 font-medium">
              {errorMessage}
            </p>
          )}

          {/* Gallery Items List */}
          {items.length > 0 && (
            <div className="space-y-4">
              {/* Aspect Ratio Picker */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Collage Card Aspect Ratio
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Controls thumbnail shape & carousel proportions
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GALLERY_ASPECT_OPTIONS.map((opt) => {
                    const isSelected = aspectRatio === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAspectRatio(opt.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-500/30 font-bold'
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

              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                <span>Gallery Photos ({items.length})</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline flex items-center gap-1 cursor-pointer normal-case font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add more photos</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-slate-300 transition-colors"
                  >
                    <span className="text-xs font-black text-slate-400 w-4 text-center">
                      {index + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                      <Image
                        src={item.url}
                        alt="Photo preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    {/* Caption Input */}
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => handleUpdateCaption(index, e.target.value)}
                      placeholder="Optional photo caption..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />

                    {/* Reorder and Delete Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1}
                        aria-label="Move down"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        aria-label="Remove image"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <span className="text-[11px] text-slate-400">
            {items.length === 0
              ? 'No photos added yet'
              : items.length === 1
              ? '1 photo (add at least 1 more for a gallery)'
              : `${items.length} photos ready`}
          </span>

          <div className="flex items-center gap-2.5">
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
              disabled={items.length < 2 || isUploading}
              className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-black hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-600/20 cursor-pointer"
            >
              Insert ({items.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
