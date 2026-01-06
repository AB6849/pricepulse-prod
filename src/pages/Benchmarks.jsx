import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Benchmarks() {
  const { currentBrand, isAdmin, canEdit } = useAuth();
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
  const [existingCalendar, setExistingCalendar] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [successPopup, setSuccessPopup] = useState(null);
  const hasNotFound = uploadedRows.some(
    r => r.product_id === 'NOT_FOUND'
  );


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
        .neq('platform', 'swiggy');

      if (baseError) throw baseError;

      const { data: swiggyProducts, error: swiggyError } = await supabase
        .from('products')
        .select('brand, platform, name')
        .eq('brand', currentBrand.brand_slug)
        .eq('platform', 'swiggy');

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

      setUploadedRows(rows);
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
        Swiggy: 'EVENT',
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

        ['Amazon', 'Blinkit', 'Swiggy', 'Zepto'].forEach(platform => {
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

  async function confirmUpload() {
    if (!currentBrand) return;

    try {
      setSaving(true);

      const payload = uploadedRows.map(row => ({
        product_id: row.product_id,
        name: row.name,
        brand: row.brand,
        platform: row.platform,
        bau_price: row['BAU Price'] || null,
        event_price: row['Event Price'] || null,
        updated_at: new Date().toISOString()
      }));

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

  const filteredBenchmarks = existingBenchmarks
    .filter(row => {
      if (platformFilter !== 'all' && row.platform !== platformFilter) {
        return false;
      }

      if (
        searchQuery &&
        !row.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'updated_at') {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const availablePlatforms = Array.from(
    new Set(existingBenchmarks.map(b => b.platform).filter(Boolean))
  );
  const calendarMatrix = (() => {
    if (!existingCalendar.length) return [];

    const map = {};

    existingCalendar.forEach(({ date, platform, mode }) => {
      if (!map[date]) {
        map[date] = { date };
      }
      map[date][platform] = mode;
    });

    return Object.values(map).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  })();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Hidden file input for Excel upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx"
          onChange={handleFileSelected}
          className="hidden"
        />
        <input
          type="file"
          ref={calendarFileRef}
          accept=".xlsx"
          className="hidden"
          onChange={handleCalendarFile}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Price Benchmarks</h1>
            <p className="text-gray-400">Set target prices for {currentBrand?.brand_name || 'your brand'}</p>
          </div>
          {canEdit && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

              {/* Benchmark Upload */}
              <div className="bg-white/10 border border-white/20 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Benchmark Upload
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Upload BAU & Event benchmark prices
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadBenchmarkTemplate}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Download Template
                  </button>
                  <button
                    onClick={handleUploadClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Upload
                  </button>
                </div>
              </div>

              {/* Event Pricing Calendar */}
              <div className="bg-white/10 border border-white/20 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Event Pricing Calendar
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Define BAU / Event days per platform
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={downloadCalendarTemplate}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Download Template
                  </button>
                  <button
                    onClick={() => calendarFileRef.current?.click()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Upload
                  </button>
                </div>
              </div>

            </div>
          )}



        </div>
        {/* Upload error message */}
        {uploadError && (
          <div className="mt-4 mb-4 bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-2 rounded">
            ❌ {uploadError}
          </div>
        )}
        <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Platform filter */}
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className="bg-white/10 text-white px-3 py-2 rounded border border-white/20"
            >
              <option value="all">All Platforms</option>
              {availablePlatforms.map(p => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search product name…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/10 text-white px-3 py-2 rounded border border-white/20 w-64"
            />

            {/* Sort */}
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={e => {
                const [field, dir] = e.target.value.split(':');
                setSortBy(field);
                setSortDir(dir);
              }}
              className="bg-white/10 text-white px-3 py-2 rounded border border-white/20"
            >
              <option value="updated_at:desc">Last Updated ↓</option>
              <option value="updated_at:asc">Last Updated ↑</option>
              <option value="bau_price:desc">BAU Price ↓</option>
              <option value="bau_price:asc">BAU Price ↑</option>
              <option value="event_price:desc">Event Price ↓</option>
              <option value="event_price:asc">Event Price ↑</option>
            </select>
          </div>

          {/* TOGGLE — always visible */}
          <div className="flex bg-white/10 border border-white/20 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('benchmarks')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${previewMode === 'benchmarks'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Benchmarks
            </button>

            <button
              onClick={() => setPreviewMode('calendar')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${previewMode === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Event Calendar
            </button>
          </div>
        </div>

        {/* ===== PREVIEW AREA ===== */}

        {/* ===== PREVIEW AREA ===== */}
        <div className="mt-8">

          {previewMode === 'benchmarks' && uploadedRows.length > 0 && (
            <>
              <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Uploaded Benchmark Preview
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-white/20 text-white">
                        <th className="px-3 py-2 text-left">Product ID</th>
                        <th className="px-3 py-2 text-left">Brand</th>
                        <th className="px-3 py-2 text-left">Platform</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-right">BAU Price</th>
                        <th className="px-3 py-2 text-right">Event Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-white/10 ${row.product_id === 'NOT_FOUND' ? 'bg-red-500/10' : ''
                            }`}
                        >
                          <td className="px-3 py-2 text-white">{row.product_id}</td>
                          <td className="px-3 py-2 text-white">{row.brand}</td>
                          <td className="px-3 py-2 text-white">{row.platform}</td>
                          <td className="px-3 py-2 text-white">{row.name}</td>
                          <td className="px-3 py-2 text-right text-white">
                            {row['BAU Price']}
                          </td>
                          <td className="px-3 py-2 text-right text-white">
                            {row['Event Price']}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={confirmUpload}
                    disabled={hasNotFound || saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Confirm & Save'}
                  </button>
                </div>
              </div>
            </>
          )}

          {previewMode === 'calendar' && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Event Pricing Calendar
              </h2>

              {calendarPreview.length > 0 ? (
                <>
                  <p className="text-gray-400 mb-2">Uploaded Preview</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-white/20 text-white">
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-center">Amazon</th>
                          <th className="px-3 py-2 text-center">Blinkit</th>
                          <th className="px-3 py-2 text-center">Swiggy</th>
                          <th className="px-3 py-2 text-center">Zepto</th>
                        </tr>
                      </thead>

                      <tbody>
                        {calendarPreview.map((row, idx) => (
                          <tr key={idx} className="border-b border-white/10">
                            <td className="px-3 py-2 text-white">
                              {row.Date}
                            </td>

                            {['Amazon', 'Blinkit', 'Swiggy', 'Zepto'].map(p => (
                              <td
                                key={p}
                                className="px-3 py-2 text-center text-white"
                              >
                                {row[p] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={confirmCalendarUpload}
                      disabled={uploadingCalendar}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                    >
                      {uploadingCalendar ? 'Saving…' : 'Confirm & Save Calendar'}
                    </button>
                  </div>
                </>
              ) : loadingCalendar ? (
                <p className="text-gray-400">Loading calendar…</p>
              ) : existingCalendar.length === 0 ? (
                <p className="text-gray-400">No event calendar configured.</p>
              ) : (
                <>
                  <p className="text-gray-400 mb-2">Existing Calendar</p>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-white text-sm">
                      <tbody>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[700px] text-white text-sm">
                            <thead>
                              <tr className="border-b border-white/20">
                                <th className="px-3 py-2 text-left">Date</th>
                                <th className="px-3 py-2 text-center">Amazon</th>
                                <th className="px-3 py-2 text-center">Blinkit</th>
                                <th className="px-3 py-2 text-center">Swiggy</th>
                                <th className="px-3 py-2 text-center">Zepto</th>
                              </tr>
                            </thead>

                            <tbody>
                              {calendarMatrix.map((row, idx) => (
                                <tr key={idx} className="border-b border-white/10">
                                  <td className="px-3 py-2">{row.date}</td>

                                  {['amazon', 'blinkit', 'swiggy', 'zepto'].map(p => (
                                    <td
                                      key={p}
                                      className="px-3 py-2 text-center text-white"
                                    >
                                      {row[p] || '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* ===== EXISTING BENCHMARKS ===== */}
        <div className="mt-10 bg-white/10 border border-white/20 rounded-xl p-4">
          <h2 className="text-xl font-semibold text-white mb-4">
            Existing Benchmarks
          </h2>

          {loadingExisting ? (
            <p className="text-gray-400">Loading existing benchmarks…</p>
          ) : filteredBenchmarks.length === 0 ? (
            <p className="text-gray-400">No benchmarks found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/20 text-white">
                    <th className="px-3 py-2 text-left">Product ID</th>
                    <th className="px-3 py-2 text-left">Platform</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-right">BAU</th>
                    <th className="px-3 py-2 text-right">Event</th>
                    <th className="px-3 py-2 text-left">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBenchmarks.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/10">
                      <td className="px-3 py-2 text-white text-xs">
                        {row.product_id}
                      </td>
                      <td className="px-3 py-2 text-white">
                        {row.platform}
                      </td>
                      <td className="px-3 py-2 text-white">
                        {row.name}
                      </td>
                      <td className="px-3 py-2 text-right text-white">
                        {row.bau_price ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-white">
                        {row.event_price ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-400 text-sm">
                        {new Date(row.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showStatus && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-6">
            {showStatus === 'benchmarks' && 'Benchmarks saved successfully!'}
            {showStatus === 'calendar' && 'Event calendar saved successfully!'}
          </div>
        )}


        {!canEdit && (
          <div className="mt-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded-lg">
            ⚠️ You have view-only access. Contact an admin to edit benchmarks.
          </div>
        )}
        {successPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl px-8 py-6 flex flex-col items-center animate-scale-in">

              {/* Animated check */}
              <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center mb-4 animate-check">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <p className="text-white text-lg font-semibold">
                {successPopup === 'benchmarks'
                  ? 'Benchmarks uploaded successfully'
                  : 'Event calendar uploaded successfully'}
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}