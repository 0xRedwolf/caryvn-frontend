"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { servicesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { formatCurrency, calculatePrice, isValidUrl } from "@/lib/utils";

interface Service {
  id: number;
  external_id: number;
  name: string;
  category_name: string;
  user_rate: string;
  min_quantity: number;
  max_quantity: number;
  has_refill: boolean;
  has_cancel: boolean;
  avg_completion_time: string | null;
  provider_name?: string;
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
    WhatsApp: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
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
  { name: "WhatsApp", dark: "bg-green-600 text-white", light: "bg-green-600 text-white" },
];

// ----- Custom Searchable Dropdown -----
interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  searchPlaceholder,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  // Reset search when closed
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ zIndex: open ? 50 : "auto" }}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-4 h-12 text-sm transition-all ${
          disabled
            ? "opacity-40 cursor-not-allowed bg-surface-darker border-border-dark text-text-secondary"
            : open
            ? "border-primary bg-surface-darker text-white shadow-[0_0_0_2px_rgba(59,130,246,0.3)]"
            : "border-border-dark bg-surface-darker text-white hover:border-primary/50"
        }`}
      >
        <span className={`truncate text-left flex-1 ${!selected ? "text-text-secondary" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-text-secondary flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && !disabled && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] bg-surface-dark border border-border-dark rounded-xl shadow-2xl overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {/* Search box */}
          <div className="p-2 border-b border-border-dark">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder || "Search…"}
                className="w-full bg-surface-darker border border-border-dark rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto" style={{ maxHeight: "380px" }}>
            {filtered.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-6">No results found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-border-dark/50 last:border-0 ${
                    opt.value === value ? "bg-primary/15 text-primary" : "text-white"
                  }`}
                >
                  <span className="block text-sm leading-snug">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="block text-xs text-text-secondary mt-0.5">{opt.sublabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

  const [providerCheckLoading, setProviderCheckLoading] = useState(false);
  const [providerCheckError, setProviderCheckError] = useState("");
  const [providerCanFulfill, setProviderCanFulfill] = useState(true);

  const { isAuthenticated, token, refreshUser } = useAuth();
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

  // Debounced API check for mother provider capacity
  useEffect(() => {
    if (!selectedService || !orderQuantity || !token) {
      setProviderCanFulfill(true);
      setProviderCheckError("");
      return;
    }
    
    const qty = parseInt(orderQuantity);
    if (isNaN(qty) || qty < selectedService.min_quantity) {
      return;
    }

    setProviderCheckLoading(true);
    setProviderCheckError("");

    const timeoutId = setTimeout(async () => {
      const { ordersApi } = await import("@/lib/api");
      const result = await ordersApi.checkProviderBalance(
        { service_id: selectedService.id, quantity: qty },
        token
      );
      
      setProviderCheckLoading(false);
      if (result.data) {
        const data = result.data as { can_fulfill: boolean; message?: string };
        setProviderCanFulfill(data.can_fulfill);
        if (!data.can_fulfill) {
          setProviderCheckError(data.message || "Apologies, an update is in effect. Please refresh the page or choose another service.");
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedService, orderQuantity, token]);

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
        service_id: selectedService.id,
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
      // Refresh user profile to update sidebar balance
      refreshUser();
      setTimeout(() => {
        router.push("/dashboard/orders?review=1");
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

  // Build dropdown options
  const categoryOptions: DropdownOption[] = categories.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const serviceOptions: DropdownOption[] = servicesInCategory.map((service) => ({
    value: service.id.toString(),
    label: `${service.name} — ${formatCurrency(service.user_rate)}/1000`,
    sublabel: `ID: ${service.external_id} · Min: ${service.min_quantity.toLocaleString()} · Max: ${service.max_quantity.toLocaleString()}`,
  }));

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
        {/* Important Notice */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 mb-6">
          <div>
            <h4 className="text-red-500 font-bold text-sm mb-2 text-center">PLEASE READ!!!</h4>
            <ul className="text-blue-500 text-xs font-semibold leading-relaxed list-disc pl-4 space-y-1">
              <li>For Successful orders, keep your accounts public</li>
              <li>Always double check your order link before placing an order</li>
              <li>Please be very patient, especially for followers orders, if after 48hrs you haven&apos;t received your order, please contact us</li>
            </ul>
          </div>
        </div>

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
              <SearchableDropdown
                options={categoryOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="— Select a category —"
                searchPlaceholder="Search categories…"
              />
              {categories.length > 0 && (
                <p className="text-text-secondary text-xs mt-1.5">
                  {categories.length} categories available
                </p>
              )}
            </div>

            {/* Service Dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Service
              </label>
              <SearchableDropdown
                options={serviceOptions}
                value={selectedServiceId}
                onChange={setSelectedServiceId}
                placeholder="— Select a service —"
                disabled={!selectedCategory}
                searchPlaceholder="Search services by name or ID…"
              />
              {selectedCategory && servicesInCategory.length > 0 && (
                <p className="text-text-secondary text-xs mt-1.5">
                  {servicesInCategory.length} services in this category
                </p>
              )}
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
                placeholder="Paste your link here"
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
                    ID: {selectedService.external_id}
                  </span>
                </div>
                <p className="text-text-secondary text-sm mb-3">
                  {selectedService.name}
                </p>
                <div className="flex items-center gap-3 mb-3">
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
                <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-text-secondary text-sm">Average time:</span>
                  <span className="text-white text-sm font-medium">
                    {selectedService.avg_completion_time || "N/A"}
                  </span>
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

            {/* Duplicate Order Warning */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-red-500 font-medium text-sm mb-1">IMPORTANT NOTICE</h4>
                <p className="text-red-400/80 font-bold text-xs leading-relaxed">
                  <li>FOR FOLLOWERS: Delivery time may vary depending on volume, for the best result, place your order in batches. Eg, if you want 1000 followers, place 4 orders of 250 followers each.</li>
                  <li>Do not submit a second order to the same link.</li>
                  <li>WAIT until the first order is <strong className="text-red-400">COMPLETED</strong> before placing another order on that link.</li>
                  <li>Admin is always active, if you face issues or have any questions, open the live chat or open a ticket</li>
                </p>
              </div>
            </div>

            {/* Provider Balance Error Message */}
            {!providerCanFulfill && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p>{providerCheckError}</p>
                  <button onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="underline font-medium mt-1 hover:text-red-300">
                    Refresh the page
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedService || orderLoading || providerCheckLoading || !providerCanFulfill}
              className="w-full btn-primary disabled:opacity-50"
            >
              {orderLoading ? "Processing..." : providerCheckLoading ? "Verifying availability..." : "Submit Order"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
