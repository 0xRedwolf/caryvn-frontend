'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { X, Play, Video, CheckCircle2, Upload, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react';
import { adminBlogApi } from '@/lib/api';

interface InsertVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  token?: string;
}

// Extract YouTube 11-char ID from various link formats
function extractYouTubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // URLs
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

export default function InsertVideoModal({
  isOpen,
  onClose,
  onInsert,
  token,
}: InsertVideoModalProps) {
  const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube');

  // YouTube tab state
  const [videoInput, setVideoInput] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  // Direct Upload tab state
  const [directVideoUrl, setDirectVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const youtubeId = useMemo(() => extractYouTubeId(videoInput), [videoInput]);

  if (!isOpen) return null;

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Check size limit: warn if above 100MB
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Video file exceeds 100MB. Please compress the video before uploading.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(`Uploading "${file.name}" to Cloudinary CDN...`);

    try {
      const res = await adminBlogApi.uploadVideo(file, token);
      if (res.url) {
        setDirectVideoUrl(res.url);
        if (res.poster_url) setPosterUrl(res.poster_url);
      } else {
        setUploadError(res.error || 'Failed to upload video to Cloudinary.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading video.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleInsert = () => {
    if (activeTab === 'youtube') {
      if (!youtubeId) return;

      const titleAttr = videoTitle.trim() ? ` data-title="${videoTitle.trim().replace(/"/g, '&quot;')}"` : '';
      const html = `<div class="blog-video" data-video-id="${youtubeId}"${titleAttr}>\n  <iframe src="https://www.youtube.com/embed/${youtubeId}" allowfullscreen></iframe>\n</div>`;

      onInsert(html);
    } else {
      if (!directVideoUrl.trim()) return;

      const titleAttr = videoTitle.trim() ? ` data-title="${videoTitle.trim().replace(/"/g, '&quot;')}"` : '';
      const posterAttr = posterUrl.trim() ? ` poster="${posterUrl.trim()}"` : '';

      const html = `<div class="blog-video" data-provider="cloudinary" data-video-url="${directVideoUrl.trim()}"${titleAttr}>\n  <video controls playsinline preload="metadata"${posterAttr}>\n    <source src="${directVideoUrl.trim()}" type="video/mp4" />\n  </video>\n</div>`;

      onInsert(html);
    }

    handleClose();
  };

  const handleClose = () => {
    setVideoInput('');
    setVideoTitle('');
    setDirectVideoUrl('');
    setPosterUrl('');
    setUploadError('');
    setUploadProgress('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Insert Video</h3>
              <p className="text-xs text-slate-500">YouTube embed or Cloudinary direct video</p>
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
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'youtube'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>YouTube Embed</span>
          </button>
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
            <span>Direct Video (Cloudinary)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'youtube' ? (
            <>
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  YouTube URL or Video ID
                </label>
                <input
                  type="text"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports full youtube.com URLs, youtu.be links, and raw 11-digit IDs.
                </p>
              </div>

              {/* YouTube Live Preview Card */}
              {youtubeId ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valid YouTube Video Detected (ID: {youtubeId})</span>
                  </div>

                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs">
                    <Image
                      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                      alt="YouTube Preview"
                      fill
                      className="object-cover opacity-90"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    {videoTitle && (
                      <div className="absolute bottom-2 inset-x-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[11px] font-bold truncate">
                        {videoTitle}
                      </div>
                    )}
                  </div>
                </div>
              ) : videoInput.trim() ? (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  Could not detect a valid YouTube video ID from this link. Please check the URL.
                </p>
              ) : null}
            </>
          ) : (
            <>
              {/* Cloudinary Direct Video Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/ogg"
                onChange={handleVideoFileChange}
                className="hidden"
              />

              {directVideoUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Video Ready on Cloudinary CDN</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDirectVideoUrl('')}
                      className="text-xs text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      Change Video
                    </button>
                  </div>

                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                    <video
                      src={directVideoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer transition-all p-6 text-center group"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-xs font-bold text-slate-800">{uploadProgress}</span>
                      <span className="text-[11px] text-slate-400">Transcoding and optimizing for streaming...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/30 transition-all mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Click or drag video to upload
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        MP4, MOV, WebM up to 100MB (routed through Cloudinary)
                      </p>
                    </>
                  )}
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 font-medium">
                  {uploadError}
                </p>
              )}

              {/* Or paste direct URL */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Or Paste Direct Video URL (.mp4 / .webm)
                </label>
                <input
                  type="url"
                  value={directVideoUrl}
                  onChange={(e) => setDirectVideoUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../video.mp4"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                />
              </div>
            </>
          )}

          {/* Common Video Title Input */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Video Title / Caption (Optional)
            </label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="e.g. 2-Minute Feature Walkthrough"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
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
            disabled={activeTab === 'youtube' ? !youtubeId : !directVideoUrl.trim() || isUploading}
            className={`px-5 py-2 rounded-xl text-white text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                : 'bg-primary hover:bg-primary-hover shadow-primary/20'
            }`}
          >
            {activeTab === 'youtube' ? 'Insert YouTube Video' : 'Insert Cloudinary Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
