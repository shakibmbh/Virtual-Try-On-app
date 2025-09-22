import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { Spinner } from './components/Spinner';
import { performVirtualTryOn, refineImage } from './services/geminiService';
import type { ImageState } from './types';

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ImageState | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageState | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');


  const handleImageUpload = useCallback((file: File, type: 'person' | 'clothing') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const imageData = { preview: reader.result, file };
        if (type === 'person') {
          setPersonImage(imageData);
        } else {
          setClothingImage(imageData);
        }
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });

  const handleVirtualTryOn = useCallback(async () => {
    if (!personImage?.file || !clothingImage?.file) {
      setError("Please upload both a person and a clothing image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const personBase64 = await toBase64(personImage.file);
      const clothingBase64 = await toBase64(clothingImage.file);

      const result = await performVirtualTryOn(
        personBase64,
        clothingBase64,
        personImage.file.type,
        clothingImage.file.type
      );
      
      if (result.imageBase64) {
         setResultImage(`data:image/png;base64,${result.imageBase64}`);
      } else {
        throw new Error("The AI model did not return an image. Please try again with different images.");
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(errorMessage);
      setError(`Failed to generate image: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [personImage, clothingImage]);

  const handleRefine = async () => {
    if (!resultImage || !refinePrompt.trim()) {
      setError("Cannot refine without a result image and a prompt.");
      return;
    }

    setIsRefining(true);
    setError(null);

    try {
      const currentImageBase64 = resultImage.split(',')[1];
      const result = await refineImage(currentImageBase64, 'image/png', refinePrompt);

      if (result.imageBase64) {
        setResultImage(`data:image/png;base64,${result.imageBase64}`);
        setRefinePrompt(''); // Clear prompt on success
      } else {
        throw new Error("The AI model did not return a refined image.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(errorMessage);
      setError(`Failed to refine image: ${errorMessage}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'virtual-try-on-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartOver = useCallback(() => {
    setPersonImage(null);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
    setRefinePrompt('');
    setIsLoading(false);
    setIsRefining(false);
  }, []);


  const isButtonDisabled = useMemo(() => !personImage || !clothingImage || isLoading, [personImage, clothingImage, isLoading]);

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans antialiased">
      <main className="container mx-auto px-4 py-8">
        <Header />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <ImageUploader
            title="Upload Person Image"
            onImageUpload={(file) => handleImageUpload(file, 'person')}
            imagePreview={personImage?.preview ?? null}
          />
          <ImageUploader
            title="Upload Clothing Image"
            onImageUpload={(file) => handleImageUpload(file, 'clothing')}
            imagePreview={clothingImage?.preview ?? null}
          />
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleVirtualTryOn}
            disabled={isButtonDisabled}
            className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-indigo-600/30 transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
          >
            {isLoading ? 'Generating...' : 'Virtual Try-On'}
          </button>
        </div>

        {isLoading && (
          <div className="mt-12 flex flex-col items-center justify-center">
            <Spinner />
            <p className="mt-4 text-indigo-400 text-lg animate-pulse">AI is working its magic...</p>
          </div>
        )}

        {error && (
          <div className="mt-12 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg max-w-2xl mx-auto">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {resultImage && !isLoading && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
              Result
            </h2>
            <div className="bg-gray-800 p-4 rounded-2xl shadow-2xl max-w-2xl mx-auto border border-gray-700">
              <img
                src={resultImage}
                alt="Generated virtual try-on result"
                className="w-full h-auto rounded-lg object-contain"
              />
            </div>
            
            <div className="mt-8 max-w-2xl mx-auto" aria-labelledby="refine-heading">
              <h3 id="refine-heading" className="text-lg font-medium text-gray-300 mb-2 text-center">
                Want to make a change?
              </h3>
              <textarea
                id="refine-prompt"
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g., 'Change the color of the shirt to red', 'Make the sleeves shorter'"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                aria-label="Refinement instructions"
              />
              <div className="mt-4 flex flex-wrap justify-center items-center gap-4">
                <button
                  onClick={handleRefine}
                  disabled={isRefining || !refinePrompt.trim()}
                  className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full text-md shadow-lg shadow-purple-600/30 transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                >
                  {isRefining ? 'Refining...' : 'Refine Image'}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-green-600 text-white font-bold py-3 px-8 rounded-full text-md shadow-lg shadow-green-600/30 transform hover:scale-105 transition-all duration-300 ease-in-out"
                  aria-label="Download generated image"
                >
                  Download Image
                </button>
                <button
                  onClick={handleStartOver}
                  className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-md shadow-lg shadow-gray-600/30 transform hover:scale-105 transition-all duration-300 ease-in-out"
                  aria-label="Start over with new images"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;