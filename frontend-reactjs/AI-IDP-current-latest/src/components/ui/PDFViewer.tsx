import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';

interface PDFViewerProps {
  file: File | { name: string; type: string; url: string; size: number };
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onClose }) => {
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if ('url' in file) {
      setPdfUrl(file.url);
    } else {
      console.error('PDFViewer: Only URL-based files are supported');
    }
  }, [file]);

  const changeScale = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(prev + delta, 3.0)));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const downloadFile = () => {
    if ('url' in file) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.click();
    } else {
      console.error('Download: Only URL-based files are supported');
    }
  };

  return (
    <div className={`flex flex-col h-full ${fullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <FileText className="w-6 h-6 text-red-600" />
          <h3 className="font-semibold text-gray-900">
            📄 Document Preview
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-white rounded-lg border">
            <button
              onClick={() => changeScale(-0.2)}
              disabled={scale <= 0.5}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-sm font-medium border-x">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => changeScale(0.2)}
              disabled={scale >= 3.0}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotation */}
          <button
            onClick={rotate}
            className="p-2 bg-white rounded-lg border hover:bg-gray-100"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 bg-white rounded-lg border hover:bg-gray-100"
            title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Download */}
          <button
            onClick={downloadFile}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 overflow-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white shadow-lg rounded-lg overflow-hidden relative"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center'
          }}
        >
          <div className="relative">
            <iframe
              src={pdfUrl ? `${pdfUrl}#view=Fit&toolbar=0&navpanes=0&scrollbar=0` : ''}
              className="w-full h-full border-0"
              style={{ 
                minHeight: '100%',
                height: '80vh'
              }}
              title="Document Preview"
              sandbox="allow-same-origin"
              frameBorder="0"
              scrolling="no"
              referrerPolicy="no-referrer"
            />
            {/* Complete URL mask overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white via-white/80 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10"></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info Panel */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
            <span>Type: PDF Document</span>
            <span>Zoom: {Math.round(scale * 100)}%</span>
          </div>
          <div className="text-xs text-gray-500">
            Use controls to zoom and rotate • Click download to save
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;