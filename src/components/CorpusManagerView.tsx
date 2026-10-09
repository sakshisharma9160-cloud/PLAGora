import React, { useState, useRef } from 'react';
import { DocumentRecord } from '../types/detector';
import { 
  Database, 
  Plus, 
  Trash2, 
  RotateCcw, 
  FileText, 
  Hash, 
  Search,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  HardDrive
} from 'lucide-react';

interface CorpusManagerViewProps {
  corpus: DocumentRecord[];
  onAddDocument: (doc: { title: string; content: string; author?: string; category?: any }) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onResetCorpus: () => Promise<void>;
}

export const CorpusManagerView: React.FC<CorpusManagerViewProps> = ({
  corpus,
  onAddDocument,
  onDeleteDocument,
  onResetCorpus
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState<'academic' | 'literature' | 'technical' | 'code'>('academic');
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(corpus.length > 0 ? corpus[0].id : null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = corpus.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.author && d.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedDoc = corpus.find(d => d.id === selectedDocId) || (corpus.length > 0 ? corpus[0] : null);

  // Extract text from user's system files (.txt, .md, .py, .pdf, .docx)
  const extractFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.py')) {
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsText(file);
      } else {
        reader.onload = (e) => {
          const buffer = e.target?.result as ArrayBuffer;
          if (buffer) {
            const uint8 = new Uint8Array(buffer);
            let rawString = '';
            for (let i = 0; i < uint8.length && rawString.length < 50000; i++) {
              const byte = uint8[i];
              if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
                rawString += String.fromCharCode(byte);
              }
            }
            const cleaned = rawString.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/ {3,}/g, ' ').trim();
            resolve(cleaned.length > 50 ? cleaned : `[Imported Reference: ${file.name}]\n\nImported file (${(file.size / 1024).toFixed(1)} KB)`);
          } else {
            resolve('');
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Handle files selected from user's own machine
  const handleSystemFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsSubmitting(true);
    setUploadFeedback(null);
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await extractFileContent(file);
      if (content.trim()) {
        const cat = file.name.endsWith('.py') || file.name.endsWith('.js') || file.name.endsWith('.ts')
          ? 'code'
          : 'academic';

        await onAddDocument({
          title: file.name.replace(/\.[^/.]+$/, ''),
          author: 'Local File Import',
          category: cat,
          content: content.trim()
        });
        count++;
      }
    }

    setIsSubmitting(false);
    setUploadFeedback(`Successfully indexed ${count} document${count === 1 ? '' : 's'} from your system into the reference corpus!`);
    setTimeout(() => setUploadFeedback(null), 5000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddDocument({
        title: newTitle.trim(),
        author: newAuthor.trim() || 'Internal Contributor',
        category: newCategory,
        content: newContent.trim()
      });
      setNewTitle('');
      setNewAuthor('');
      setNewContent('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Reference Document Corpus Library
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Add papers and assignments from your own computer to detect plagiarism against your personal or department archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetCorpus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Standard Corpus
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Paste Text Document
          </button>
        </div>
      </div>

      {/* Prominent "Add Documents from Own System" Dropzone */}
      <div
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          handleSystemFilesUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.py"
          onChange={(e) => handleSystemFilesUpload(e.target.files)}
          className="hidden"
        />

        <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
          <HardDrive className="w-5 h-5" />
        </div>

        <div>
          <span className="text-xs font-bold text-white block">
            Add Reference Documents from Your Own System
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Select or drag &amp; drop PDF, DOCX, TXT, or code files from your machine into the comparison index
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Multi-File Supported</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">PDF / DOCX / TXT</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Offline &amp; Private</span>
        </div>
      </div>

      {/* Success feedback alert */}
      {uploadFeedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadFeedback}</span>
        </div>
      )}

      {/* Main Grid: Document List & Selected Document Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search indexed corpus..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-slate-100 line-clamp-1">
                      {doc.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove "${doc.title}" from index?`)) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    {doc.author || 'Unknown'} · <span className="font-mono text-cyan-400">{doc.category}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500">
                    <span>{doc.tokenCount.toLocaleString()} tokens</span>
                    <span>·</span>
                    <span>{doc.fingerprintCount.toLocaleString()} fingerprints</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Document Detail Pane */}
        <div className="lg:col-span-7">
          {selectedDoc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    {selectedDoc.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedDoc.id}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Author: <span className="text-slate-200">{selectedDoc.author || 'Unknown'}</span> · Category: <span className="text-cyan-400 font-mono">{selectedDoc.category}</span>
                </div>
              </div>

              {/* Fingerprint Stats */}
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <div className="text-slate-500 text-[10px]">WORD TOKENS</div>
                  <div className="text-white font-bold text-sm mt-0.5">{selectedDoc.tokenCount.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <div className="text-slate-500 text-[10px]">WINNOW HASHES</div>
                  <div className="text-cyan-400 font-bold text-sm mt-0.5">{selectedDoc.fingerprintCount.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <div className="text-slate-500 text-[10px]">MINHASH SIG</div>
                  <div className="text-indigo-400 font-bold text-sm mt-0.5">64 perms</div>
                </div>
              </div>

              {/* Document Text Box */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Indexed Full Text Content
                </label>
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs font-mono text-slate-300 max-h-[340px] overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                  {selectedDoc.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
              No document selected.
            </div>
          )}
        </div>
      </div>

      {/* Manual Paste Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white">
              Index Document to Reference Corpus
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Raft and Paxos"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Author / Source</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                    placeholder="e.g. Ongaro & Ousterhout (2014)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="academic">Academic Paper</option>
                    <option value="literature">Literature / Essay</option>
                    <option value="technical">Technical Report</option>
                    <option value="code">Source Code</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Document Text</label>
                <textarea
                  required
                  rows={8}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Paste complete paper or code text..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                >
                  {isSubmitting ? 'Computing Fingerprints...' : 'Save & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
