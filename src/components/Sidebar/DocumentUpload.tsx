import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  isUploading,
  uploadProgress,
}) => {
  const [isDragover, setIsDragover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragover(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragover(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragover(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onUpload(file);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={`upload-section border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
        isDragover
          ? 'border-amber-400 bg-amber-950/20'
          : 'border-[#2e2e2e] bg-[#141414] hover:border-[#444444]'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
      />
      <div>
        <UploadCloud
          size={28}
          className="text-amber-200/80 mb-2 mx-auto"
        />
        <p className="font-medium text-xs text-neutral-200 mb-0.5">
          Upload Legal Document
        </p>
        <p className="text-[11px] text-neutral-500">
          Drag & drop or click to select (PDF)
        </p>
      </div>

      {isUploading && (
        <div className="mt-3">
          <div className="progress-bar h-1.5 w-full bg-[#222222] rounded-full overflow-hidden">
            <div
              className="progress-bar__fill h-full bg-amber-400/90 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-amber-300/80 mt-1.5 font-medium">
            {uploadProgress === 100 ? 'Finalizing analysis...' : `Uploading... ${uploadProgress}%`}
          </p>
        </div>
      )}
    </div>
  );
};
