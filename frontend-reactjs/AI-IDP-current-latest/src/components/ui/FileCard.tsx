import { FileText, Image, FileSpreadsheet } from "lucide-react";

interface FileCardProps {
  file: any;
}

const FileCard: React.FC<FileCardProps> = ({ file }) => {
  const getIcon = () => {
    if (file.type.includes("pdf")) return <FileText className="w-6 h-6 text-red-500" />;
    if (file.type.includes("image")) return <Image className="w-6 h-6 text-blue-500" />;
    if (file.type.includes("csv")) return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div className="border rounded-lg p-3 flex items-center space-x-3 bg-white shadow hover:shadow-lg transition">
      {getIcon()}
      <div className="flex-1">
        <p className="font-medium text-sm">{file.name}</p>
        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
      </div>
    </div>
  );
};

export default FileCard;
