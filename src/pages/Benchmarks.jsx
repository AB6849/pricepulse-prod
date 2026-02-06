import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import FeatherIcon from '../components/FeatherIcon';

export default function Benchmarks() {
  const { currentBrand, isAdmin, canEdit, loading: authLoading } = useAuth();
  const [platformFilter, setPlatformFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const [showStatus, setShowStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [existingBenchmarks, setExistingBenchmarks] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [uploadedRows, setUploadedRows] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const calendarFileRef = useRef(null);
  const [calendarPreview, setCalendarPreview] = useState([]);
  const [calendarError, setCalendarError] = useState(null);
  const [uploadingCalendar, setUploadingCalendar] = useState(false);
  const [previewMode, setPreviewMode] = useState('benchmarks');
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [successPopup, setSuccessPopup] = useState(null);
  const [existingCalendar, setExistingCalendar] = useState([]);
  const [isBenchmarkDropdownOpen, setIsBenchmarkDropdownOpen] = useState(false);
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const benchmarkDropdownRef = useRef(null);
  const calendarDropdownRef = useRef(null);
  const hasNotFound = uploadedRows.some(
    r => r.product_id === 'NOT_FOUND'
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (benchmarkDropdownRef.current && !benchmarkDropdownRef.current.contains(e.target)) {
        setIsBenchmarkDropdownOpen(false);
      }
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(e.target)) {
        setIsCalendarDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // NOTE: Removed feather.replace() - it conflicts with React's virtual DOM
  // Icons will be rendered using inline SVG or a React-compatible icon component

  useEffect(() => {
    if (currentBrand) {
      loadExistingBenchmarks();
      loadExistingCalendar();
    }
  }, [currentBrand]);

  async function downloadBenchmarkTemplate() {
    if (!currentBrand) return;

    try {
      // ✅ FIXED IMPORT
      const XLSX = await import('xlsx');

      const { data: baseProducts, error: baseError } = await supabase
        .from('products')
        .select('product_id, brand, platform, name')
        .eq('brand', currentBrand.brand_slug)
        .neq('platform', 'Instamart');

      if (baseError) throw baseError;

      const { data: swiggyProducts, error: swiggyError } = await supabase
        .from('products')
        .select('brand, platform, name')
        .eq('brand', currentBrand.brand_slug)
        .eq('platform', 'Instamart');

      if (swiggyError) throw swiggyError;

      const { data: instamartData, error: instamartError } = await supabase
        .from('instamart_catalog')
        .select('product_id, name')
        .eq('brand', currentBrand.brand_slug);

      if (instamartError) throw instamartError;

      const normalize = (str) =>
        str?.toLowerCase().replace(/\s+/g, ' ').trim();

      const instamartMap = new Map(
        (instamartData || []).map(i => [
          normalize(i.name),
          i.product_id
        ])
      );

      const rows = [
        ...(baseProducts || []).map(p => ({
          product_id: p.product_id,
          brand: p.brand,
          platform: p.platform,
          name: p.name,
          'BAU Price': '',
          'Event Price': ''
        })),
        ...(swiggyProducts || []).map(p => ({
          product_id: instamartMap.get(normalize(p.name)) || 'NOT_FOUND',
          brand: p.brand,
          platform: p.platform,
          name: p.name,
          'BAU Price': '',
          'Event Price': ''
        }))
      ];

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Benchmarks');

      XLSX.writeFile(
        workbook,
        `${currentBrand.brand_slug}_benchmark_template.xlsx`
      );
    } catch (err) {
      console.error('❌ Benchmark Excel download failed:', err);
      alert(
        err?.message ||
        err?.details ||
        JSON.stringify(err)
      );
    }

  }

  async function downloadExistingBenchmarks() {
    if (!currentBrand || !existingBenchmarks.length) return;

    try {
      const XLSX = await import('xlsx');
      const rows = existingBenchmarks.map(b => ({
        product_id: b.product_id,
        brand: b.brand,
        platform: b.platform,
        name: b.name,
        'BAU Price': b.bau_price || '',
        'Event Price': b.event_price || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Current Benchmarks');

      XLSX.writeFile(
        workbook,
        `${currentBrand.brand_slug}_benchmarks_export.xlsx`
      );
      setIsBenchmarkDropdownOpen(false);
    } catch (err) {
      console.error('❌ Benchmark export failed:', err);
      alert('Failed to export benchmarks');
    }
  }

  async function downloadExistingCalendar() {
    if (!currentBrand || !existingCalendar.length) return;

    try {
      const XLSX = await import('xlsx');

      // Convert matrix back to flat rows if needed, or just export existingCalendar
      const rows = existingCalendar.map(c => ({
        Date: c.date,
        Platform: c.platform,
        Mode: c.mode
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing Calendar');

      XLSX.writeFile(
        workbook,
        `${currentBrand.brand_slug}_calendar_export.xlsx`
      );
      setIsCalendarDropdownOpen(false);
    } catch (err) {
      console.error('❌ Calendar export failed:', err);
      alert('Failed to export calendar');
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      alert('Please upload a valid .xlsx file');
      e.target.value = '';
      return;
    }

    try {
      const XLSX = await import('xlsx');

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: ''
      });

      // ---- basic validation ----
      const requiredCols = [
        'product_id',
        'brand',
        'platform',
        'name',
        'BAU Price',
        'Event Price'
      ];

      const missingCols = requiredCols.filter(
        col => !Object.keys(rows[0] || {}).includes(col)
      );

      if (missingCols.length) {
        throw new Error(
          `Missing columns: ${missingCols.join(', ')}`
        );
      }

      const cleanedRows = rows.map(r => ({
        ...r,
        'BAU Price': r['BAU Price'] !== ''
          ? Math.round(Number(r['BAU Price']))
          : '',
        'Event Price': r['Event Price'] !== ''
          ? Math.round(Number(r['Event Price']))
          : ''
      }));

      setUploadedRows(cleanedRows);

      setUploadError(null);
      setPreviewMode('benchmarks');
    } catch (err) {
      console.error('❌ Excel parse failed:', err);
      setUploadedRows([]);
      setUploadError(err.message || 'Failed to parse Excel');
    } finally {
      e.target.value = '';
    }
  }

  async function downloadCalendarTemplate() {
    if (!currentBrand) return;
    const XLSX = await import('xlsx');

    const rows = [
      {
        Date: '2026-01-01',
        Amazon: 'EVENT',
        Blinkit: 'BAU',
        Instamart: 'EVENT',
        Zepto: 'EVENT'
      }
    ];

    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Event Calendar');

    XLSX.writeFile(
      wb,
      `${currentBrand.brand_slug}_event_calendar.xlsx`
    );
  }

  async function handleCalendarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rows.length || !rows[0].Date) {
        throw new Error('Invalid template: Date column missing');
      }

      setCalendarPreview(rows);
      setCalendarError(null);
      setPreviewMode('calendar');
    } catch (err) {
      setCalendarError(err.message);
      setCalendarPreview([]);
    } finally {
      e.target.value = '';
    }
  }

  async function confirmCalendarUpload() {
    if (!currentBrand) return;

    try {
      setUploadingCalendar(true);

      const payloadMap = new Map();

      calendarPreview.forEach(row => {
        let date;
        if (row.Date instanceof Date) {
          date = row.Date.toISOString().slice(0, 10);
        } else {
          date = String(row.Date).trim();
        }

        ['Amazon', 'Blinkit', 'Instamart', 'Zepto'].forEach(platform => {
          const mode = row[platform]?.toString().trim().toUpperCase();
          if (mode === 'BAU' || mode === 'EVENT') {
            const key = `${date}|${currentBrand.brand_slug}|${platform.toLowerCase()}`;

            payloadMap.set(key, {
              brand: currentBrand.brand_slug,
              date,
              platform: platform.toLowerCase(),
              mode
            });
          }
        });
      });

      const payload = Array.from(payloadMap.values());

      if (payload.length === 0) {
        throw new Error('No valid BAU / EVENT rows found in uploaded file');
      }

      const { error } = await supabase
        .from('pricing_calendar')
        .upsert(payload, {
          onConflict: 'date,brand,platform'
        });

      if (error) throw error;

      setSuccessPopup('calendar');
      setTimeout(() => setSuccessPopup(null), 2000);

      await loadExistingCalendar();
      setCalendarPreview([]);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingCalendar(false);
    }
  }


  async function loadExistingCalendar() {
    if (!currentBrand) return;

    try {
      setLoadingCalendar(true);

      const { data, error } = await supabase
        .from('pricing_calendar')
        .select('date, platform, mode')
        .eq('brand', currentBrand.brand_slug)
        .order('date', { ascending: true });

      if (error) throw error;

      setExistingCalendar(data || []);
    } catch (err) {
      console.error('❌ Failed to load calendar:', err);
    } finally {
      setLoadingCalendar(false);
    }
  }

  function dedupeBenchmarks(rows) {
    const map = new Map();

    rows.forEach(row => {
      const key = `${row.product_id}|${row.brand}|${row.platform}`;

      // last row wins (Excel bottom overrides top)
      map.set(key, row);
    });

    return Array.from(map.values());
  }

  async function confirmUpload() {
    if (!currentBrand) return;

    try {
      setSaving(true);

      // 🔹 STEP 1: dedupe uploaded rows
      const dedupedRows = dedupeBenchmarks(uploadedRows);

      // 🔹 STEP 2: warn user if duplicates existed
      if (dedupedRows.length !== uploadedRows.length) {
        alert(
          'Duplicate products found in Excel. Latest row was used for each product.'
        );
      }

      // 🔹 STEP 3: build payload from deduped rows
      const payload = dedupedRows.map(row => ({
        product_id: row.product_id,
        name: row.name,
        brand: row.brand,
        platform: row.platform,
        bau_price:
          row['BAU Price'] !== '' && row['BAU Price'] != null
            ? Math.round(Number(row['BAU Price']))
            : null,
        event_price:
          row['Event Price'] !== '' && row['Event Price'] != null
            ? Math.round(Number(row['Event Price']))
            : null,
        updated_at: new Date().toISOString()
      }));

      // 🔹 STEP 4: upsert
      const { error } = await supabase
        .from('benchmarks')
        .upsert(payload, {
          onConflict: 'product_id,brand,platform'
        });

      if (error) throw error;

      setSuccessPopup('benchmarks');
      setTimeout(() => setSuccessPopup(null), 2000);
      setUploadedRows([]);
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert(err.message || 'Failed to save benchmarks');
    } finally {
      setSaving(false);
    }
  }

  async function loadExistingBenchmarks() {
    if (!currentBrand) return;

    try {
      setLoadingExisting(true);

      const { data, error } = await supabase
        .from('benchmarks')
        .select(`
        product_id,
        brand,
        platform,
        name,
        bau_price,
        event_price,
        updated_at
      `)
        .eq('brand', currentBrand.brand_slug)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setExistingBenchmarks(data || []);
    } catch (err) {
      console.error('❌ Failed to load existing benchmarks:', err);
    } finally {
      setLoadingExisting(false);
    }
  }

  const filteredBenchmarks = (existingBenchmarks || [])
    .filter(row => {
      if (!row) return false;
      if (platformFilter !== 'all' && row.platform !== platformFilter) {
        return false;
      }

      if (searchQuery) {
        const name = String(row?.name || '');
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let valA = a?.[sortBy];
      let valB = b?.[sortBy];

      if (sortBy === 'updated_at') {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        valA = isNaN(timeA) ? 0 : timeA;
        valB = isNaN(timeB) ? 0 : timeB;
      }

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Handle numeric comparisons vs string
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDir === 'asc' ? -1 : 1;
      if (strA > strB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const availablePlatforms = Array.from(
    new Set((existingBenchmarks || []).map(b => b?.platform).filter(Boolean))
  ).map(p => String(p));
  const calendarMatrix = (() => {
    try {
      if (!existingCalendar || !existingCalendar.length) return [];

      const map = {};

      existingCalendar.forEach((row) => {
        if (!row || !row.date) return;
        const { date, platform, mode } = row;
        const platKey = String(platform || 'unknown');
        if (!map[date]) {
          map[date] = { date };
        }
        map[date][platKey] = mode;
      });

      return Object.values(map).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
      });
    } catch (err) {
      console.error('❌ calendarMatrix error:', err);
      return [];
    }
  })();

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-10 pt-[56px] pb-8 flex-1 flex flex-col">
      {/* Hidden file inputs */}
      <input type="file" ref={fileInputRef} accept=".xlsx" onChange={handleFileSelected} className="hidden" />
      <input type="file" ref={calendarFileRef} accept=".xlsx" className="hidden" onChange={handleCalendarFile} />

      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-10">
        <header className="animate-reveal">
          <h1 className="text-4xl font-medium text-white mb-2 tracking-tight">Price Benchmarks</h1>
          <p className="text-zinc-500 font-medium">Set target prices for {currentBrand?.brand_name || 'your brand'}</p>
        </header>

        {canEdit && (
          <div className="flex flex-wrap gap-4 animate-reveal relative z-50" style={{ animationDelay: '0.1s' }}>
            {/* Benchmark Section */}
            <div className="glass-card p-6 flex flex-col justify-between min-w-[280px] transition-transform duration-300 overflow-visible">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Benchmarks</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-4 opacity-70">BAU & Event Prices</p>
              </div>
              <div className="flex gap-2 relative">
                <div className="flex-1 relative" ref={benchmarkDropdownRef}>
                  <button
                    onClick={() => setIsBenchmarkDropdownOpen(!isBenchmarkDropdownOpen)}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all"
                  >
                    <span>Download</span>
                    <FeatherIcon name="chevron-down" className={`w-3 h-3 transition-transform duration-300 ${isBenchmarkDropdownOpen ? 'rotate-180' : ''}`} size={12} />
                  </button>

                  {isBenchmarkDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[100] animate-reveal-down bg-[var(--bg-main)] border border-white/10 rounded-xl shadow-2xl backdrop-blur-3xl overflow-hidden p-1">
                      <button
                        onClick={() => { downloadBenchmarkTemplate(); setIsBenchmarkDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        Download Template
                      </button>
                      <button
                        onClick={() => { downloadExistingBenchmarks(); setIsBenchmarkDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        Existing Data
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleUploadClick} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">Upload</button>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="glass-card p-6 flex flex-col justify-between min-w-[280px] transition-transform duration-300 overflow-visible">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Pricing Calendar</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-4 opacity-70">Define Mode per Platform</p>
              </div>
              <div className="flex gap-2 relative">
                <div className="flex-1 relative" ref={calendarDropdownRef}>
                  <button
                    onClick={() => setIsCalendarDropdownOpen(!isCalendarDropdownOpen)}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all"
                  >
                    <span>Download</span>
                    <FeatherIcon name="chevron-down" className={`w-3 h-3 transition-transform duration-300 ${isCalendarDropdownOpen ? 'rotate-180' : ''}`} size={12} />
                  </button>

                  {isCalendarDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-[100] animate-reveal-down bg-[var(--bg-main)] border border-white/10 rounded-xl shadow-2xl backdrop-blur-3xl overflow-hidden p-1">
                      <button
                        onClick={() => { downloadCalendarTemplate(); setIsCalendarDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        Download Template
                      </button>
                      <button
                        onClick={() => { downloadExistingCalendar(); setIsCalendarDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        Existing Data
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => calendarFileRef.current?.click()} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">Upload</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-sm font-bold animate-reveal flex items-center gap-3">
          <FeatherIcon name="alert-circle" className="w-5 h-5" size={20} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-wrap gap-4 mb-8 items-center justify-between glass-card p-3 animate-reveal" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-xl py-3 px-5 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer appearance-none transition-all"
          >
            <option value="all">ALL PLATFORMS</option>
            {(availablePlatforms || []).map(p => (
              <option key={p} value={p}>{p?.toUpperCase()}</option>
            ))}
          </select>

          <div className="relative">
            <FeatherIcon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" size={14} />
            <input
              type="text"
              placeholder="SEARCH PRODUCTS..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-xl py-3 pl-11 pr-5 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-600 outline-none w-64 transition-all"
            />
          </div>

          <select
            value={`${sortBy}:${sortDir}`}
            onChange={e => {
              const [field, dir] = e.target.value.split(':');
              setSortBy(field);
              setSortDir(dir);
            }}
            className="bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-xl py-3 px-5 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer appearance-none transition-all"
          >
            <option value="updated_at:desc">LATEST UPDATED</option>
            <option value="updated_at:asc">OLDEST UPDATED</option>
            <option value="bau_price:desc">BAU PRICE ↓</option>
            <option value="bau_price:asc">BAU PRICE ↑</option>
            <option value="event_price:desc">EVENT PRICE ↓</option>
            <option value="event_price:asc">EVENT PRICE ↑</option>
          </select>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setPreviewMode('benchmarks')}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${previewMode === 'benchmarks' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Benchmarks
          </button>
          <button
            onClick={() => setPreviewMode('calendar')}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${previewMode === 'calendar' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Event Calendar
          </button>
        </div>
      </div>

      <div className="flex-1 animate-reveal" style={{ animationDelay: '0.3s' }}>
        {previewMode === 'benchmarks' && (
          <>
            {uploadedRows.length > 0 ? (
              <div className="glass-card mb-8 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-indigo-500/[0.03]">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Upload Preview</h2>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Review changes before saving</p>
                  </div>
                  <button
                    onClick={confirmUpload}
                    disabled={hasNotFound || saving}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20"
                  >
                    {saving ? 'SAVING...' : 'CONFIRM & SAVE'}
                  </button>
                </div>
                <div className="overflow-x-auto custom-scrollbar p-2">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        <th className="px-6 py-3">Product ID</th>
                        <th className="px-6 py-3">Details</th>
                        <th className="px-6 py-3 text-right">BAU Price</th>
                        <th className="px-6 py-3 text-right">Event Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedRows.map((row, idx) => (
                        <tr key={idx} className={`text-sm ${row.product_id === 'NOT_FOUND' ? 'bg-red-500/10' : 'bg-white/[0.02]'} hover:bg-white/[0.05] transition-colors overflow-hidden group`}>
                          <td className="px-6 py-4 first:rounded-l-2xl border-y border-l border-white/5 font-mono text-[10px] text-zinc-400 group-hover:text-white uppercase tracking-tighter">{row.product_id}</td>
                          <td className="px-6 py-4 border-y border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-indigo-400 transition-colors">{row.platform} • {row.brand}</span>
                              <span className="text-white font-bold whitespace-normal leading-relaxed mt-1">{row.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 border-y border-white/5 text-right font-black text-emerald-400 text-base">₹{row['BAU Price']}</td>
                          <td className="px-6 py-4 last:rounded-r-2xl border-y border-r border-white/5 text-right font-black text-indigo-400 text-base">₹{row['Event Price']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass-card min-h-[400px] overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                  <h2 className="text-lg font-bold text-white tracking-tight">Existing Benchmarks</h2>
                </div>
                {loadingExisting ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : filteredBenchmarks.length === 0 ? (
                  <div className="text-center py-32">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                      <FeatherIcon name="database" className="w-8 h-8 text-zinc-600" size={32} />
                    </div>
                    <p className="text-zinc-500 uppercase font-black tracking-[0.2em] text-[10px]">No records found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar p-2">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                      <thead>
                        <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]">
                          <th className="px-6 py-3">Source</th>
                          <th className="px-6 py-3">Product Catalog</th>
                          <th className="px-6 py-3 text-right">BAU</th>
                          <th className="px-6 py-3 text-right">Event</th>
                          <th className="px-6 py-3 text-right">Last Sync</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBenchmarks.map((row, idx) => (
                          <tr key={idx} className="bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                            <td className="px-6 py-4 first:rounded-l-2xl border-y border-l border-white/5">
                              <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">{row.platform}</span>
                            </td>
                            <td className="px-6 py-4 border-y border-white/5">
                              <div className="flex flex-col">
                                <span className="font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">{row.name}</span>
                                <span className="text-[9px] font-mono text-zinc-500 mt-1 uppercase tracking-tighter group-hover:text-zinc-400">{row.product_id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 border-y border-white/5 text-right font-black text-white text-base">₹{row.bau_price}</td>
                            <td className="px-6 py-4 border-y border-white/5 text-right font-black text-white text-base">₹{row.event_price}</td>
                            <td className="px-6 py-4 last:rounded-r-2xl border-y border-r border-white/5 text-right">
                              <span className="text-[10px] text-white font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg group-hover:bg-white/10 whitespace-nowrap">
                                {row?.updated_at ? new Date(row.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {previewMode === 'calendar' && (
          <div className="glass-card p-6 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">Event Pricing Calendar</h2>
              {calendarPreview.length > 0 && (
                <button
                  onClick={confirmCalendarUpload}
                  disabled={uploadingCalendar}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
                >
                  {uploadingCalendar ? 'SAVING...' : 'SAVE CALENDAR'}
                </button>
              )}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2 text-center">Amazon</th>
                    <th className="px-4 py-2 text-center">Blinkit</th>
                    <th className="px-4 py-2 text-center">Instamart</th>
                    <th className="px-4 py-2 text-center">Zepto</th>
                  </tr>
                </thead>
                <tbody>
                  {(calendarPreview.length > 0 ? calendarPreview : calendarMatrix).map((row, idx) => (
                    <tr key={idx} className="bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
                      <td className="px-4 py-4 first:rounded-l-xl border-y border-l border-white/5 font-mono text-xs text-white">
                        {row?.date || row?.Date || '—'}
                      </td>
                      {['Amazon', 'Blinkit', 'Instamart', 'Zepto'].map(p => {
                        const valRaw = row?.[p] || row?.[p.toLowerCase()] || '—';
                        const val = String(valRaw).toUpperCase();
                        const isEvent = val === 'EVENT';
                        return (
                          <td key={p} className="px-4 py-4 border-y border-white/5 text-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${isEvent ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)]' : 'bg-white/5 text-zinc-500 border-white/10'}`}>
                              {val}
                            </span>
                          </td>
                        );
                      })}
                      <td className="last:rounded-r-xl border-y border-r border-white/5"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {successPopup && (
        <div className="fixed bottom-8 right-8 animate-reveal-up bg-green-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-green-400/50 z-[100]">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <FeatherIcon name="check" className="w-5 h-5" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest">Success</p>
            <p className="text-[11px] opacity-80 font-medium">Pricing updated successfully</p>
          </div>
        </div>
      )}
    </div>
  );
}