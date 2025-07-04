import React, { useState, useRef, ChangeEvent } from 'react';
import Button from './Button';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface FileInputProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  name: string;
  label: string;
  language: string;
  readOnly?: boolean;
}

const FileInput: React.FC<FileInputProps> = ({ onChange, name, label, language, readOnly }) => {
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : (language === 'ar' ? 'لم يتم اختيار ملف' : 'No file chosen'));
    onChange(event);
  };

  const handleClick = () => {
    if (!readOnly) {
      inputRef.current?.click();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex items-center">
        <input
          type="file"
          name={name}
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={readOnly}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleClick}
          leftIcon={ArrowUpTrayIcon}
          disabled={readOnly}
        >
          {language === 'ar' ? 'اختر ملف' : 'Choose File'}
        </Button>
        <span className={`mx-3 text-sm text-gray-600 dark:text-gray-400 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          {fileName || (language === 'ar' ? 'لم يتم اختيار ملف' : 'No file chosen')}
        </span>
      </div>
    </div>
  );
};

export default FileInput;
