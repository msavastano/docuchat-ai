import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadedFile } from '../types';
import { UploadCloudIcon, FileTextIcon, Trash2Icon } from './icons';

// The worker is needed for pdf.js to work in the browser.
// Using a CDN for the worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.4.168/build/pdf.worker.min.mjs`;

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onProcessingError: (error: string) => void;
}

const SUPPORTED_MIME_TYPES = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/javascript',
    'text/html',
    'text/xml',
    'application/pdf',
];

const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesChange, onProcessingError }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      processFiles(Array.from(selectedFiles));
    }
  };

  const processFiles = (fileList: File[]) => {
    const newFiles: Promise<UploadedFile>[] = [];

    for (const file of fileList) {
      if (!SUPPORTED_MIME_TYPES.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.pdf')) {
        onProcessingError(`File type for "${file.name}" is not supported. Please upload text-based files or PDFs.`);
        continue;
      }
      
      const promise = new Promise<UploadedFile>((resolve, reject) => {
        const reader = new FileReader();

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            reader.onload = async (e) => {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    return reject(new Error("Failed to read PDF file."));
                }
                try {
                    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
                    const pdf = await loadingTask.promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        // The `getTextContent` result has an `items` array. Each item is either a `TextItem` (with `str` property) or `TextMarkedContent`. We extract the `str` from `TextItem`s.
                        textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                    }
                    resolve({ name: file.name, content: textContent, size: file.size });
                } catch (pdfError) {
                    console.error("Error parsing PDF:", pdfError);
                    let message = "An error occurred while parsing the PDF.";
                    if (pdfError instanceof Error) {
                        message = `Error parsing PDF "${file.name}": ${pdfError.message}`;
                    }
                    onProcessingError(message);
                    reject(pdfError);
                }
            };
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (e) => {
              const content = e.target?.result as string;
              resolve({ name: file.name, content, size: file.size });
            };
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        }
      });
      newFiles.push(promise);
    }

    Promise.allSettled(newFiles).then(results => {
      const successfullyProcessedFiles = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<UploadedFile>).value);

      if (successfullyProcessedFiles.length > 0) {
        onFilesChange([...files, ...successfullyProcessedFiles]);
      }
    }).catch(err => {
        console.error("Error reading files:", err);
        onProcessingError("An error occurred while reading the files.");
    });
  };

  const removeFile = (fileName: string) => {
    onFilesChange(files.filter(f => f.name !== fileName));
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-400', 'bg-gray-800');
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles) {
      processFiles(Array.from(droppedFiles));
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-indigo-400', 'bg-gray-800');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-400', 'bg-gray-800');
  };


  return (
    <div className="bg-gray-800/50 p-6 rounded-2xl h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-indigo-300">Your Documents</h2>
      <div className="flex-grow flex flex-col">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={SUPPORTED_MIME_TYPES.join(',')}
        />
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-gray-800/70 transition-all duration-300"
        >
          <UploadCloudIcon className="w-12 h-12 text-gray-500 mb-3" />
          <p className="font-semibold text-indigo-400">Click to upload or drag & drop</p>
          <p className="text-xs text-gray-400 mt-1">TXT, MD, PDF, JSON, CSV, etc.</p>
        </label>
        
        <div className="mt-6 flex-grow overflow-y-auto pr-2 -mr-2">
            {files.length > 0 ? (
                <ul className="space-y-3">
                {files.map((file) => (
                    <li key={file.name} className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center overflow-hidden">
                            <FileTextIcon className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        <button onClick={() => removeFile(file.name)} className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full">
                            <Trash2Icon className="w-5 h-5" />
                        </button>
                    </li>
                ))}
                </ul>
            ) : (
                <div className="text-center text-gray-500 pt-8">
                    <p>No documents uploaded yet.</p>
                </div>
            )}
        </div>
        
        {files.length > 0 && (
          <button 
            onClick={() => onFilesChange([])}
            className="mt-6 w-full bg-red-500/80 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <Trash2Icon className="w-5 h-5 mr-2"/>
            Clear All Documents
          </button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;