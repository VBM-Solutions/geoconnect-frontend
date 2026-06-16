import React from 'react';

interface FilePickerLabelProps {
  id: string;
  accept?: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  labelClassName?: string;
  children: React.ReactNode;
}

export function FilePickerLabel({
  id,
  accept,
  multiple = false,
  onChange,
  labelClassName = '',
  children,
}: Readonly<FilePickerLabelProps>) {
  return (
    <>
      <label htmlFor={id} className={labelClassName}>
        {children}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = e.target.files ? [...e.target.files] : [];
          if (files.length > 0) {
            onChange(files);
          }
          // Reset pour permettre la re-sélection du même fichier
          e.target.value = '';
        }}
      />
    </>
  );
}
