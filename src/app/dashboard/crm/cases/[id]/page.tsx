"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n_context";
import {
    getCase, updateCase,
    getTimeEntries, startTimeEntry, stopTimeEntry,
    getCRMDocuments, uploadCRMDocument,
    getChatRoom, getChatMessages, importChatDocument,
    Case, TimeEntry, CRMDocument, ChatMessage
} from "@/lib/services";
import { FaBriefcase, FaClock, FaFolder, FaPlay, FaStop, FaUpload, FaFileAlt, FaArrowLeft, FaComments } from "react-icons/fa";
import Link from "next/link";

export default function CaseDetailPage() {
    const { id } = useParams();
    const { user, userProfile } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();

    const [caseData, setCaseData] = useState<Case | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'time' | 'documents'>('overview');

    // Time Tracking
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerDuration, setTimerDuration] = useState(0); // seconds
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

    // Documents
    const [documents, setDocuments] = useState<CRMDocument[]>([]);
    const [uploading, setUploading] = useState(false);

    // Error Handling
    const [error, setError] = useState<string | null>(null);
    const [showChatImport, setShowChatImport] = useState(false);

    const loadTimeEntries = useCallback(() => {
        if (!id) return;
        getTimeEntries(id as string)
            .then(setTimeEntries)
            .catch(err => {
                console.error("Error loading time entries:", err);
                setError(err.message);
            });
    }, [id]);

    const loadDocuments = useCallback(() => {
        if (!id) return;
        getCRMDocuments(id as string)
            .then(setDocuments)
            .catch(err => {
                console.error("Error loading documents:", err);
                setError(err.message);
            });
    }, [id]);

    useEffect(() => {
        if (!user || !id) return;

        // Fetch Case
        getCase(id as string).then(data => {
            if (data) setCaseData(data);
            else router.push('/dashboard/crm'); // Redirect if not found
        })
            .catch(err => {
                console.error("Error loading case:", err);
                setError(err.message);
            });

        // Fetch Sub-collections
        loadTimeEntries();
        loadDocuments();
    }, [user, id, loadTimeEntries, loadDocuments, router]);

    const handleStartTimer = async () => {
        if (!user) return;
        setIsTimerRunning(true);
        await startTimeEntry(id as string, user.id);

        // Start local counter
        const interval = setInterval(() => {
            setTimerDuration(prev => prev + 1);
        }, 1000);
        setTimerInterval(interval);

        loadTimeEntries();
    };

    const handleStopTimer = async () => {
        if (timerInterval) clearInterval(timerInterval);
        setIsTimerRunning(false);
        setTimerDuration(0);

        const runningEntry = timeEntries.find(e => !e.endTime);
        if (runningEntry) {
            const rate = (userProfile as unknown as { price: number })?.price || 100;
            await stopTimeEntry(runningEntry.id, rate);
            loadTimeEntries();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;

        setUploading(true);
        try {
            await uploadCRMDocument(e.target.files[0], id as string);
            loadDocuments();
        } catch (err) {
            console.error(err);
            alert("Upload failed");
            setError("Document upload failed: " + (err as Error).message);
        } finally {
            setUploading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!caseData) return;
        await updateCase(caseData.id, { status: newStatus as Case['status'] });
        setCaseData({ ...caseData, status: newStatus as Case['status'] });
    };

    if (!caseData) return <div className="p-8 text-center">Loading...</div>;

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/dashboard/crm" className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-4">
                    <FaArrowLeft className="mr-2" /> {t('crm.back_to_cases')}
                </Link>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6">
                        <p className="font-semibold">Error loading data:</p>
                        <p className="text-sm">{error}</p>
                        {error.includes("index") && (
                            <p className="mt-2 text-sm">
                                <span className="font-bold">Action Required:</span> Firestore needs an index for this query.
                                Open your browser console (F12) and click the link provided in the error message to create it.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {caseData.title}
                            <span className={`text-sm px-3 py-1 rounded-full border ${caseData.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>
                                {t(`crm.status.${caseData.status}`)}
                            </span>
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-1">
                            {t('crm.client')}: <span className="font-medium text-gray-900 dark:text-white">{caseData.clientName}</span>
                        </p>
                    </div>

                    {/* Status Actions */}
                    <div className="flex gap-2">
                        {['new', 'in_progress', 'court', 'completed'].map(s => (
                            <button
                                key={s}
                                onClick={() => handleStatusUpdate(s)}
                                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${caseData.status === s
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                                    : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {t(`crm.status.${s}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-800 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                >
                    <FaBriefcase className="inline mr-2" /> {t('crm.overview')}
                </button>
                <button
                    onClick={() => setActiveTab('time')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'time'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                >
                    <FaClock className="inline mr-2" /> {t('crm.time_tracking')}
                </button>
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'documents'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                >
                    <FaFolder className="inline mr-2" /> {t('crm.documents')}
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 animate-in fade-in">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('crm.description')}</h2>
                        <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{caseData.description}</p>

                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm text-gray-500">{t('crm.created')}</p>
                                <p className="font-medium dark:text-white">
                                    {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{t('crm.status')}</p>
                                <p className="font-medium dark:text-white capitalize">{t(`crm.status.${caseData.status}`)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'time' && (
                    <div className="space-y-6 animate-in fade-in">
                        {/* Timer Widget */}
                        <div className="bg-slate-900 dark:bg-black p-8 rounded-2xl shadow-lg border border-slate-800 text-center text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-4">{t('crm.timer')}</h3>
                                <div className="text-6xl font-mono font-bold tracking-wider mb-8 tabular-nums">
                                    {formatDuration(timerDuration)}
                                </div>
                                <div className="flex justify-center gap-4">
                                    {!isTimerRunning ? (
                                        <button
                                            onClick={handleStartTimer}
                                            aria-label="Start Timer"
                                            className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center transition-all shadow-lg hover:scale-105"
                                        >
                                            <FaPlay size={24} className="ml-1" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStopTimer}
                                            aria-label="Stop Timer"
                                            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center transition-all shadow-lg hover:scale-105"
                                        >
                                            <FaStop size={24} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-slate-500 mt-4 text-sm animate-pulse">
                                    {isTimerRunning ? 'Timer is running...' : 'Ready to track'}
                                </p>
                            </div>
                        </div>

                        {/* Recent Entries */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-4 text-sm font-medium text-gray-500 dark:text-slate-400">{t('crm.date')}</th>
                                        <th className="p-4 text-sm font-medium text-gray-500 dark:text-slate-400">{t('crm.duration')}</th>
                                        <th className="p-4 text-sm font-medium text-gray-500 dark:text-slate-400 text-right">{t('crm.cost')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {timeEntries.map(entry => (
                                        <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 text-gray-900 dark:text-white">
                                                {entry.startTime ? new Date(entry.startTime).toLocaleDateString() : 'Pending'}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-slate-300">
                                                {entry.durationMinutes ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m` : 'Running...'}
                                            </td>
                                            <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                                                {entry.totalAmount ? `$${entry.totalAmount.toFixed(2)}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {timeEntries.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-gray-500">
                                                No time entries recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                {activeTab === 'documents' && (
                    <div className="space-y-6 animate-in fade-in">
                        {/* Upload Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{t('crm.documents')}</h3>
                                <p className="text-sm text-gray-500">Manage files related to this case</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setShowChatImport(!showChatImport)}
                                    className="px-4 py-2 rounded-lg font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-2"
                                >
                                    <FaComments /> {t('crm.import_from_chat')}
                                </button>
                                <label className={`cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploading ? 'Uploading...' : t('crm.upload')}
                                    <FaUpload />
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Chat Import Panel */}
                        {showChatImport && (
                            <ChatFileImporter
                                clientId={caseData.clientId}
                                lawyerId={user!.id}
                                caseId={id as string}
                                onImportComplete={() => {
                                    loadDocuments();
                                    setShowChatImport(false);
                                }}
                            />
                        )}

                        {/* ... document grid omitted for brevity if unchanged ... */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documents.map(doc => (
                                <a
                                    key={doc.id}
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-primary transition-all group"
                                >
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                        <FaFileAlt size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">{doc.fileName}</p>
                                        <p className="text-xs text-gray-500">
                                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Just now'}
                                            {doc.source === 'chat' && <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">CHAT</span>}
                                        </p>
                                    </div>
                                </a>
                            ))}
                            {documents.length === 0 && (
                                <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-500">
                                    <FaFolder size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>{t('crm.no_docs')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ChatFileImporter({ clientId, lawyerId, caseId, onImportComplete }: { clientId?: string, lawyerId: string, caseId: string, onImportComplete: () => void }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState<string | null>(null);

    useEffect(() => {
        if (!clientId) {
            // Fix synchronous set state
            setTimeout(() => setLoading(false), 0);
            return;
        }

        // Find chat
        getChatRoom(lawyerId, clientId).then(chat => {
            if (chat) {
                getChatMessages(chat.id).then(msgs => {
                    const files = msgs.filter(m => m.type === 'image' || m.type === 'file' || m.fileUrl); // Ensure we catch anything with a file
                    setMessages(files);
                }).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });
    }, [clientId, lawyerId]);

    const handleImport = async (msg: ChatMessage) => {
        setImporting(msg.id);
        try {
            await importChatDocument(caseId, lawyerId, msg);
            onImportComplete();
        } catch (e) {
            console.error(e);
            alert("Import failed");
            setImporting(null);
        }
    };

    if (!clientId) return <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl mb-4 text-sm">No client associated with this case.</div>;
    if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading chat history...</div>;
    if (messages.length === 0) return <div className="p-4 bg-gray-50 text-gray-500 rounded-xl mb-4 text-sm text-center">No files found in chat with this client.</div>;

    return (
        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl mb-6 border border-gray-200 dark:border-slate-700">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Select files to import</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {messages.map(msg => (
                    <div key={msg.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                            {msg.type === 'image' ? <FaFileAlt className="text-purple-500 flex-shrink-0" /> : <FaFileAlt className="text-blue-500 flex-shrink-0" />}
                            <div className="truncate">
                                <p className="text-xs font-medium truncate dark:text-white">{msg.fileName || 'Unnamed File'}</p>
                                <p className="text-[10px] text-gray-400">{msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleImport(msg)}
                            disabled={!!importing}
                            className="text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-2 py-1 rounded hover:opacity-90 disabled:opacity-50"
                        >
                            {importing === msg.id ? '...' : 'Import'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
