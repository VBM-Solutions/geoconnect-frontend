import React, { useRef } from 'react';
import { Paperclip, Plus, X as XIcon } from 'lucide-react';

interface FileUploaderProps {
  id: string;
  docFiles: File[];
  setDocFiles: React.Dispatch<React.SetStateAction<File[]>>;
  labelClassName?: string;
  fileListClassName?: string;
  showEmptyDropzone?: boolean;
  dropzoneClassName?: string;
}

export function FileUploader({
  id,
  docFiles,
  setDocFiles,
  labelClassName = 'block text-sm font-medium text-slate-700',
  fileListClassName = '',
  showEmptyDropzone = true,
  dropzoneClassName = 'flex items-center gap-3 border border-dashed border-slate-300 rounded-md px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors',
}: Readonly<FileUploaderProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = () => fileInputRef.current?.click();
  const handleRemoveFile = (index: number) =>
    setDocFiles(prev => prev.filter((_, i) => i !== index));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (newFiles.length > 0) {
      setDocFiles(prev => [...prev, ...newFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelClassName}>
        Documents joints (plans, cahier des charges…)
      </label>
      {docFiles.length === 0 ? (
        showEmptyDropzone ? (
          <button
            type="button"
            className={dropzoneClassName.replace('cursor-pointer', 'bg-white text-left w-full')}
            onClick={handleAddFiles}
          >
            <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 truncate">
              Joindre un ou plusieurs fichiers (PDF, image…)
            </span>
          </button>
        ) : null
      ) : (
        <div className={`space-y-2 ${fileListClassName}`}>
          <ul className="space-y-1">
            {docFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-700 min-w-0">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={file.name}>
                    {file.name}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  title="Supprimer ce fichier"
                  aria-label={`Supprimer ${file.name}`}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleAddFiles}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Ajouter d'autres fichiers"
          >
            <Plus className="w-4 h-4" />
            Ajouter d'autres fichiers
          </button>
        </div>
      )}
      <input
        id={id}
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
