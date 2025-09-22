
import React, { useRef, useCallback } from 'react';

interface ImageUploaderProps {
  title: string;
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
}

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload, imagePreview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg h-96 flex flex-col justify-center items-center">
      <h3 className="text-xl font-semibold text-gray-300 mb-4">{title}</h3>
      <div 
        className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex justify-center items-center cursor-pointer hover:border-indigo-500 transition-colors duration-300 relative overflow-hidden"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
        ) : (
          <div className="text-center text-gray-500">
            <UploadIcon />
            <p>Click or drag & drop to upload</p>
          </div>
        )}
      </div>
    </div>
  );
};
