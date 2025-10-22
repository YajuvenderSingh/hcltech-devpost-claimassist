import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize2,
  Minimize2,
  Move
} from 'lucide-react';

interface ImagePreviewProps {
  file: { name: string; type: string; url: string; size: number };
  onClose: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onClose }) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  React.useEffect(() => {
    setImageUrl(file.url);
  }, [file]);

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.1, Math.min(prev + delta, 5)));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const downloadFile = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  return (
    <div className={`flex flex-col h-full ${fullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-900 truncate max-w-xs">
            {file.name}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-2 bg-white rounded-lg border hover:bg-gray-100"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleZoom(0.2)}
            className="p-2 bg-white rounded-lg border hover:bg-gray-100"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleRotate}
            className="p-2 bg-white rounded-lg border hover:bg-gray-100"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={resetView}
            className="p-2 bg-white rounded-lg border hover:bg-gray-100"
          >
            <Move className="w-4 h-4" />
          </button>

          <button
            onClick={downloadFile}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Content */}
      <div 
        className="flex-1 flex items-center justify-center p-4 bg-gray-900 overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.img
          src={imageUrl}
          alt={file.name}
          className={`max-w-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`
          }}
        />
      </div>
    </div>
  );
};

export default ImagePreview;