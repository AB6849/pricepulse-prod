import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function HomeMobile() {
    const { brands, currentBrand, switchBrand } = useAuth();
    const [selectedBrand, setSelectedBrand] = useState(currentBrand);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentBrand) {
            setSelectedBrand(currentBrand);
        }
    }, [currentBrand]);

    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand);
        switchBrand?.(brand.brand_id);
    };

    const handlePlatformClick = (platform) => {
        if (!selectedBrand) return;
        navigate(`/${platform}`);
    };

    const platforms = [
        { key: "blinkit", name: "Blinkit", logo: "/Blinkit-yellow-rounded.svg" },
        { key: "swiggy", name: "Swiggy", logo: "/instamart_logo.webp" },
        { key: "zepto", name: "Zepto", logo: "/zeptologo.webp" },
        { key: "amazon", name: "Amazon", logo: "/amazonlogo.png" }
    ];

    return (
        <div className="min-h-screen bg-[#0f0f23] text-white">
            <Header />

            <div className="px-4 py-2 bg-black/30 text-xs text-gray-300 md:hidden">
                Monitor prices across quick commerce platforms
            </div>


            {/* Brand Selector */}
            <section className="px-4 pt-6">
                <h2 className="text-xl font-semibold mb-4">Select Brand</h2>

                <div className="grid grid-cols-2 gap-4">
                    {brands?.map((brand) => {
                        const isSelected = selectedBrand?.brand_id === brand.brand_id;

                        return (
                            <button
                                key={brand.brand_id}
                                onClick={() => handleBrandSelect(brand)}
                                className={`rounded-xl px-3 py-3 border transition active:scale-95 ${isSelected
                                    ? "bg-indigo-600 border-indigo-400 ring-2 ring-indigo-300"
                                    : "bg-white/5 border-white/10"
                                    }`}
                            >
                                <img
                                    src={brand.logo_url}
                                    alt={brand.brand_name}
                                    className="w-8 h-8 mx-auto mb-2 object-contain"
                                    onError={(e) => {
                                        e.currentTarget.src = "/logo.png";
                                    }}
                                />

                                <p className="text-sm font-medium">{brand.brand_name}</p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Platforms */}
            {selectedBrand && (
                <section className="px-4 pt-8">
                    <h2 className="text-xl font-semibold mb-4">Choose Platform</h2>

                    <div className="grid grid-cols-2 gap-4">
                        {platforms.map((p) => (
                            <button
                                key={p.key}
                                onClick={() => handlePlatformClick(p.key)}
                                className="rounded-xl p-3 bg-white/5 border border-white/10 active:scale-95 active:bg-white/10"
                            >
                                <img
                                    src={p.logo}
                                    alt={p.name}
                                    className="w-10 h-10 mx-auto mb-2 object-contain"
                                />
                                <p className="text-sm font-medium">{p.name}</p>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <div className="h-16" />
            <Footer />
        </div>
    );
}