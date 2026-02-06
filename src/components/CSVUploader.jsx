import { useState, useRef } from 'react';
import feather from 'feather-icons';
import { useEffect } from 'react';

export default function CSVUploader({
    onUpload,
    type = 'sales',
    disabled = false,
    onCheckOverlap = null,  // Optional: function to check for date overlaps
    platform = 'blinkit'    // Platform name for overlap check
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [overlapWarning, setOverlapWarning] = useState(null);
    const [pendingUpload, setPendingUpload] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        feather.replace();
    }, [uploading, success, error, overlapWarning]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (file) => {
        setError(null);
        setSuccess(null);
        setOverlapWarning(null);
        setPendingUpload(false);

        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setFile(file);
    };

    const handleUpload = async (forceUpload = false) => {
        if (!file || !onUpload) return;

        // If we have an overlap check function and haven't confirmed yet
        if (onCheckOverlap && !forceUpload && !pendingUpload) {
            setUploading(true);
            try {
                const overlapResult = await onCheckOverlap(file, type);

                if (overlapResult && overlapResult.hasOverlap) {
                    // Show warning with overlap details
                    const dateList = overlapResult.overlappingDates
                        .slice(0, 5)
                        .map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))
                        .join(', ');

                    const moreText = overlapResult.overlappingDates.length > 5
                        ? ` and ${overlapResult.overlappingDates.length - 5} more`
                        : '';

                    setOverlapWarning({
                        dates: overlapResult.overlappingDates,
                        message: `Data already exists for: ${dateList}${moreText}`,
                        recordCount: overlapResult.existingRecordCount,
                        newDates: overlapResult.newDates.length
                    });
                    setPendingUpload(true);
                    setUploading(false);
                    return;
                }
            } catch (err) {
                console.error('Error checking overlap:', err);
                // Continue with upload even if check fails
            }
        }

        setUploading(true);
        setError(null);
        setOverlapWarning(null);

        try {
            const result = await onUpload(file, type);
            setSuccess(`Successfully uploaded ${result.inserted} records!`);
            setFile(null);
            setPendingUpload(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const cancelUpload = () => {
        setOverlapWarning(null);
        setPendingUpload(false);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const typeConfig = {
        sales: {
            title: 'Sales Data',
            icon: 'trending-up',
            color: 'emerald',
            description: 'Upload daily sales CSV'
        },
        inventory: {
            title: 'Inventory Data',
            icon: 'package',
            color: 'indigo',
            description: 'Upload inventory snapshot CSV'
        }
    };

    const config = typeConfig[type] || typeConfig.sales;

    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-${config.color}-500/20 flex items-center justify-center`}>
                    <i data-feather={config.icon} className={`w-5 h-5 text-${config.color}-400`}></i>
                </div>
                <div>
                    <h3 className="text-white text-sm font-bold">{config.title}</h3>
                    <p className="text-zinc-500 text-xs">{config.description}</p>
                </div>
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled}
                />

                {file ? (
                    <div className="flex flex-col items-center gap-2">
                        <i data-feather="file-text" className="w-8 h-8 text-indigo-400"></i>
                        <p className="text-white text-sm font-medium">{file.name}</p>
                        <p className="text-zinc-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <i data-feather="upload-cloud" className="w-8 h-8 text-zinc-400"></i>
                        <p className="text-zinc-400 text-sm">Drag & drop or click to upload</p>
                        <p className="text-zinc-600 text-xs">CSV files only, max 10MB</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs font-medium flex items-center gap-2">
                        <i data-feather="alert-circle" className="w-4 h-4"></i>
                        {error}
                    </p>
                </div>
            )}

            {overlapWarning && (
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-start gap-3">
                        <i data-feather="alert-triangle" className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"></i>
                        <div className="flex-1">
                            <p className="text-amber-400 text-sm font-bold mb-1">Data Already Exists</p>
                            <p className="text-amber-300/80 text-xs mb-2">{overlapWarning.message}</p>
                            <p className="text-zinc-400 text-xs">
                                {overlapWarning.recordCount} existing records will be updated.
                                {overlapWarning.newDates > 0 && ` ${overlapWarning.newDates} new dates will be added.`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => handleUpload(true)}
                            disabled={uploading}
                            className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white transition-all"
                        >
                            {uploading ? 'Uploading...' : 'Update Existing Data'}
                        </button>
                        <button
                            onClick={cancelUpload}
                            disabled={uploading}
                            className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-zinc-300 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 text-xs font-medium flex items-center gap-2">
                        <i data-feather="check-circle" className="w-4 h-4"></i>
                        {success}
                    </p>
                </div>
            )}

            {file && !success && !overlapWarning && (
                <button
                    onClick={() => handleUpload(false)}
                    disabled={uploading || disabled}
                    className={`
                        mt-4 w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all
                        ${uploading
                            ? 'bg-indigo-500/50 text-white/50 cursor-wait'
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                        }
                    `}
                >
                    {uploading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Checking...
                        </span>
                    ) : (
                        'Upload Data'
                    )}
                </button>
            )}
        </div>
    );
}
