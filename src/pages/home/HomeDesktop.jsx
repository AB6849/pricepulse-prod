import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Particles from '../../components/Particles';
import Toast from '../../components/Toast';
import feather from 'feather-icons';

export default function HomeDesktop() {
  const { brands, currentBrand, switchBrand, loading } = useAuth();
const [selectedBrand, setSelectedBrand] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  feather.replace();
}, []);

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    if (switchBrand) {
      switchBrand(brand.brand_id);
    }
  };

  const handlePlatformClick = (platform) => {
    if (!selectedBrand) {
      setShowToast(true);
      return;
    }

    navigate(`/${platform}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  const platforms = [
    { key: 'blinkit', name: 'Blinkit', logo: '/Blinkit-yellow-rounded.svg', bgColor: 'bg-indigo-500/20', borderColor: 'border-indigo-500/30', textColor: 'text-indigo-300', badgeBg: 'bg-indigo-500/20', badgeText: 'text-indigo-300', badgeBorder: 'border-indigo-500/30' },
    { key: 'swiggy', name: 'Instamart', logo: '/instamart_logo.webp', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30', textColor: 'text-red-300', badgeBg: 'bg-red-500/20', badgeText: 'text-red-300', badgeBorder: 'border-red-500/30' },
    { key: 'zepto', name: 'Zepto', logo: '/zeptologo.webp', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30', textColor: 'text-green-300', badgeBg: 'bg-green-500/20', badgeText: 'text-green-300', badgeBorder: 'border-green-500/30' },
    { key: 'amazon', name: 'Amazon', logo: '/amazonlogo.png', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-300', badgeBg: 'bg-yellow-500/20', badgeText: 'text-yellow-300', badgeBorder: 'border-yellow-500/30' }
  ];

  return (
    <div className="min-h-screen">
      <Particles />
      <Header />

      <section className="py-8 relative z-0">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-white mb-4 hero-text">
            Monitor Prices the Smart Way
          </h2>
          <p className="text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
            Compare prices across platforms in real-time!
          </p>
        </div>
      </section>

      <section className="py-8 relative z-0">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-white mb-6 tracking-wide">
            Select Your Brand
          </h3>

          {brands && brands.length > 0 ? (
            <>
              <div
  className="
    grid
    gap-6
    mx-auto
    justify-center
    justify-items-center
    grid-cols-[repeat(auto-fit,minmax(240px,max-content))]
    max-w-5xl
  "
>
                {brands.map((brand) => {
                  const isSelected = selectedBrand?.brand_id === brand.brand_id;
                  const isPepe = brand.brand_slug === 'pepe';
                  return (
                    <div
                      key={brand.brand_id}
                      className={`brand-card group cursor-pointer rounded-2xl px-6 py-4
  w-[260px]
  bg-white/5 backdrop-blur-lg border border-white/10
  hover:bg-white/10 transition-all duration-300
  flex items-center justify-center space-x-4
  ${isSelected ? 'active' : ''}
`}
                      onClick={() => handleBrandSelect(brand)}
                    >
                      <div className={`brand-logo w-14 h-14 rounded-xl shadow-lg flex items-center justify-center ${isPepe ? 'bg-gradient-to-tr from-indigo-500 to-purple-600' : 'bg-gradient-to-tr from-pink-500 to-yellow-400'
                        }`}>
                        <img
                          src={brand.logo_url || (isPepe ? '/pepelogo.png' : '/chumbaklogo.png')}
                          alt={brand.brand_name}
                          className="w-10 h-10 object-contain scale-125 filter-white"
                        />
                      </div>
                      <h4 className={`brand-name text-xl font-semibold text-white group-hover:${isPepe ? 'text-indigo-300' : 'text-pink-300'} transition-colors`}>
                        {brand.brand_name}
                      </h4>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-lg text-gray-300 mt-6 italic">
                {selectedBrand ? (
                  <span className="text-green-400">
                    {selectedBrand.brand_name} selected
                  </span>
                ) : (
                  'No brand selected'
                )}
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No brands available. Contact admin to get access.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 relative z-0">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-white mb-8 animate-fadeIn">
            Choose Your Platform
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {platforms.map((platform) => (
              <div
                key={platform.key}
                className={`platform-card card-glow rounded-2xl overflow-hidden cursor-pointer ${selectedBrand ? 'enabled opacity-100' : 'opacity-50 cursor-not-allowed'
                  }`}
                onClick={() => handlePlatformClick(platform.key)}
                style={{ animationDelay: `${platforms.indexOf(platform) * 2}s` }}
              >
                <div className="p-6 text-center">
                  <div className={`w-20 h-20 ${platform.bgColor} rounded-2xl mx-auto mb-4 flex items-center justify-center border ${platform.borderColor}`}>
                    <img src={platform.logo} alt={platform.name} className="w-16 h-16" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{platform.name}</h4>
                  <div className={`${platform.badgeBg} ${platform.badgeText} px-4 py-1.5 rounded-full text-sm font-semibold inline-block border ${platform.badgeBorder}`}>
                    View Products
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 relative z-0 bg-black/20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-white mb-12">Why Traben?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center animate-fadeInUp">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-indigo-500/30 feature-icon" style={{ color: '#667eea' }}>
                <i data-feather="refresh-cw" className="w-8 h-8"></i>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Real-Time Updates</h4>
              <p className="text-gray-300">Prices refresh every 4 hours</p>
            </div>
            <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-green-500/30 feature-icon" style={{ color: '#10b981' }}>
                <i data-feather="target" className="w-8 h-8"></i>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Smart Benchmarks</h4>
              <p className="text-gray-300">Set your target prices</p>
            </div>
            <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-yellow-500/30 feature-icon" style={{ color: '#f59e0b' }}>
                <i data-feather="search" className="w-8 h-8"></i>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Instant Search</h4>
              <p className="text-gray-300">Find products in seconds</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 gradient-bg relative z-0">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6 text-white">Set Your Price Targets</h3>
          <p className="text-lg mb-1 max-w-2xl mx-auto text-indigo-100">
            Manage benchmarks across all platforms and get notified when prices drop below your target!
          </p>
        </div>
      </section>

      <Footer />
      <Toast
        message="Please select a brand first!"
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}



