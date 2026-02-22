"use client";

import { useState, useEffect, useMemo } from "react";
import { servicesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { formatCurrency, calculatePrice, isValidUrl } from "@/lib/utils";

interface Service {
  id: number;
  provider_id: number;
  name: string;
  category_name: string;
  user_rate: string;
  min_quantity: number;
  max_quantity: number;
  has_refill: boolean;
  has_cancel: boolean;
}

// Platform SVG icons
const PlatformIcon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    All: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    Instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    TikTok: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.2a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.81.07 4.84 4.84 0 01-2.88-.95v6.24a6.34 6.34 0 01-6.34 6.34"/>
      </svg>
    ),
    YouTube: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    Facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    Twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    Telegram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    Spotify: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
  };
  return <>{icons[name] || name}</>;
};

// Platform config with colors
const platformConfig = [
  { name: "All", dark: "bg-primary text-white", light: "bg-primary text-white" },
  { name: "Instagram", dark: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white", light: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white" },
  { name: "TikTok", dark: "bg-white text-black", light: "bg-black text-[#ffffff]" },
  { name: "YouTube", dark: "bg-red-600 text-white", light: "bg-red-600 text-white" },
  { name: "Facebook", dark: "bg-blue-600 text-white", light: "bg-blue-600 text-white" },
  { name: "Twitter", dark: "bg-white text-black", light: "bg-black text-[#ffffff]" },
  { name: "Telegram", dark: "bg-blue-500 text-white", light: "bg-blue-500 text-white" },
  { name: "Spotify", dark: "bg-green-500 text-white", light: "bg-green-500 text-white" },
];

export default function NewOrderPage() {
  const { theme } = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  // Order form
  const [orderLink, setOrderLink] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [orderComments, setOrderComments] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");

  const { isAuthenticated, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const result = await servicesApi.getServices({});

    if (result.data) {
      const data = result.data as { services: Service[] };
      setServices(data.services || []);
    }
    setLoading(false);
  };

  // Filter services by platform
  const filteredByPlatform = useMemo(() => {
    if (selectedPlatform === "All") return services;
    return services.filter(
      (s) =>
        s.category_name
          .toLowerCase()
          .includes(selectedPlatform.toLowerCase()) ||
        s.name.toLowerCase().includes(selectedPlatform.toLowerCase()),
    );
  }, [services, selectedPlatform]);

  // Get unique categories from filtered services
  const categories = useMemo(() => {
    const cats = [...new Set(filteredByPlatform.map((s) => s.category_name))];
    return cats.sort();
  }, [filteredByPlatform]);

  // Filter services by category
  const servicesInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return filteredByPlatform.filter(
      (s) => s.category_name === selectedCategory,
    );
  }, [filteredByPlatform, selectedCategory]);

  // Get selected service object
  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return services.find((s) => s.id.toString() === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  // Reset category when platform changes
  useEffect(() => {
    setSelectedCategory("");
    setSelectedServiceId("");
  }, [selectedPlatform]);

  // Reset service when category changes
  useEffect(() => {
    setSelectedServiceId("");
  }, [selectedCategory]);

  // Set default quantity when service changes
  useEffect(() => {
    if (selectedService) {
      setOrderQuantity(selectedService.min_quantity.toString());
      setOrderComments("");
      setOrderError("");
    }
  }, [selectedService]);

  // Check if service requires custom comments
  const requiresComments = selectedService?.name.toLowerCase().includes('custom');

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!selectedService || !token) return;

    setOrderError("");
    setOrderSuccess("");

    if (!isValidUrl(orderLink)) {
      setOrderError("Please enter a valid URL");
      return;
    }

    const quantity = parseInt(orderQuantity);
    if (
      quantity < selectedService.min_quantity ||
      quantity > selectedService.max_quantity
    ) {
      setOrderError(
        `Quantity must be between ${selectedService.min_quantity} and ${selectedService.max_quantity}`,
      );
      return;
    }

    setOrderLoading(true);

    const { ordersApi } = await import("@/lib/api");
    
    // Validate comments for custom comment services
    if (requiresComments && !orderComments.trim()) {
      setOrderError("Please enter your custom comments");
      setOrderLoading(false);
      return;
    }
    
    const result = await ordersApi.createOrder(
      {
        service_id: selectedService.provider_id,
        link: orderLink,
        quantity,
        ...(orderComments.trim() && { comments: orderComments.trim() }),
      },
      token,
    );

    if (result.data) {
      setOrderSuccess("Order placed successfully!");
      setOrderLink("");
      setOrderQuantity(selectedService.min_quantity.toString());
      setTimeout(() => {
        router.push("/dashboard/orders");
      }, 1500);
    } else {
      setOrderError(result.error || "Failed to create order");
    }

    setOrderLoading(false);
  };

  const orderPrice = selectedService
    ? calculatePrice(
        parseFloat(selectedService.user_rate),
        parseInt(orderQuantity) || 0,
      )
    : 0;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Order</h1>
        <p className="text-text-secondary text-sm mt-1">Place a new order for social media services</p>
      </div>

      {/* Platform Icons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {platformConfig.map((platform) => (
          <button
            key={platform.name}
            onClick={() => setSelectedPlatform(platform.name)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
              selectedPlatform === platform.name
                ? `${theme === 'dark' ? platform.dark : platform.light} scale-110 shadow-lg`
                : "bg-surface-dark text-text-secondary hover:text-white border border-border-dark"
            }`}
            title={platform.name}
          >
            <PlatformIcon name={platform.name} />
          </button>
        ))}
      </div>

      {/* Order Form Card */}
      <div className="bg-surface-dark rounded-2xl border border-border-dark p-6">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading services...</p>
          </div>
        ) : (
          <form onSubmit={handleOrderSubmit} className="space-y-6">
            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select"
              >
                <option value="">-- Select a category --</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Service
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="select"
                disabled={!selectedCategory}
              >
                <option value="">-- Select a service --</option>
                {servicesInCategory.map((service) => (
                  <option key={service.id} value={service.id.toString()}>
                    {service.provider_id} - {service.name} -{" "}
                    {formatCurrency(service.user_rate)} per 1000
                  </option>
                ))}
              </select>
            </div>

            {/* Link Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Link
              </label>
              <input
                type="url"
                value={orderLink}
                onChange={(e) => setOrderLink(e.target.value)}
                className="input"
                placeholder="Paste link here"
                disabled={!selectedService}
              />
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                min={selectedService?.min_quantity || 0}
                max={selectedService?.max_quantity || 0}
                className="input"
                disabled={!selectedService}
              />
              {selectedService && (
                <p className="text-text-secondary text-xs mt-1">
                  Min: {selectedService.min_quantity.toLocaleString()} -
                  Max: {selectedService.max_quantity.toLocaleString()}
                </p>
              )}
            </div>

            {/* Custom Comments Textarea - Shows only for custom comment services */}
            {requiresComments && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Custom Comments
                  <span className="text-primary ml-1">*</span>
                </label>
                <textarea
                  value={orderComments}
                  onChange={(e) => setOrderComments(e.target.value)}
                  className="input min-h-[120px] py-3 resize-y"
                  placeholder={"Enter each comment on a new line\nExample:\nGreat post!\nLove this content!\nAmazing work!"}
                  disabled={!selectedService}
                />
                <p className="text-text-secondary text-xs mt-1">
                  Enter one comment per line. The number of comments should match your quantity.
                </p>
              </div>
            )}

            {/* Service Info Box */}
            {selectedService && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary font-medium">
                    ID: {selectedService.provider_id}
                  </span>
                </div>
                <p className="text-text-secondary text-sm mb-3">
                  {selectedService.name}
                </p>
                <div className="flex items-center gap-3">
                  {selectedService.has_refill && (
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs">
                      ♻️ Refill
                    </span>
                  )}
                  {selectedService.has_cancel && (
                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-xs">
                      ❌ Cancel
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Price Summary */}
            {selectedService && (
              <div className="bg-surface-darker rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">
                    Rate per 1000:
                  </span>
                  <span className="text-white">
                    {formatCurrency(selectedService.user_rate)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">Quantity:</span>
                  <span className="text-white">
                    {parseInt(orderQuantity).toLocaleString() || 0}
                  </span>
                </div>
                <div className="border-t border-border-dark pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total:</span>
                    <span className="text-primary text-xl font-bold">
                      {formatCurrency(orderPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {orderError && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {orderError}
              </div>
            )}

            {/* Success Message */}
            {orderSuccess && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {orderSuccess}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedService || orderLoading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {orderLoading ? "Processing..." : "Submit Order"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
