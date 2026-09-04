"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { servicesApi, ordersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { formatCurrency, calculatePrice } from "@/lib/utils";
import Navbar from "@/components/Navbar";

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
}

// Platform SVG icons with dynamic active contrast
const PlatformIcon = ({ name, selected }: { name: string; selected?: boolean }) => {
  const icons: Record<string, React.ReactNode> = {
    All: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    Instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    TikTok: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 461 512.235" fill="none">
        <g fillRule="nonzero">
          <path fill="#2DCCD3" d="M370.934 98.964c19.378 19.981 43.543 32.158 67.898 37.7v-15.005c-22.884-1.621-46.823-8.822-67.898-22.695zM230.952 0v335.533c0 43.959-31.593 72.234-70.009 72.234-12.743 0-24.844-2.978-35.363-8.483 13.346 17.041 34.421 26.843 57.531 26.843 38.417 0 70.01-28.275 70.01-72.272V18.322h60.886C312.348 12.479 310.99 6.371 309.934 0h-78.982zM181 195.062v-16.627c-7.691-1.281-15.382-1.696-21.753-1.696C72.573 176.739 0 246.296 0 332.555c0 56.626 27.559 105.033 69.444 133.685-29.18-28.953-47.276-69.481-47.276-115.362 0-86.109 72.347-155.628 158.832-155.816z" />
          <path fill="#F1204A" d="M318.87 329.991c0 107.144-81.96 163.921-159.209 163.921-33.44 0-64.505-10.103-90.217-27.672 28.879 28.652 68.616 45.995 112.385 45.995 77.248 0 159.208-56.777 159.208-163.921V173.723c-7.69-5.203-15.08-11.272-22.167-18.36v174.628zm-193.289 69.294c-9.426-11.914-15.043-27.334-15.043-45.43 0-50.782 39.698-77.624 92.629-72.045v-85.052c-7.69-1.282-15.381-1.697-21.79-1.697H181v68.389c-52.931-5.542-92.63 21.263-92.63 72.083 0 29.707 15.193 52.252 37.211 63.752zm313.251-262.621v63.525c-35.174 0-68.464-6.711-97.795-26.466 34.157 34.157 75.59 44.826 119.963 44.826v-78.567a137.713 137.713 0 01-22.168-3.318zm-67.898-37.701c-18.737-19.265-33.026-45.806-38.832-80.641h-18.095c10.329 37.663 31.592 63.94 56.927 80.641z" />
          <path fill={selected ? "#ffffff" : "#0f172a"} d="M159.661 493.912c77.248 0 159.209-56.777 159.209-163.921V155.364c7.088 7.087 14.477 13.157 22.168 18.359 29.33 19.755 62.62 26.466 97.794 26.466v-63.525c-24.354-5.542-48.52-17.72-67.898-37.7-25.335-16.702-46.597-42.979-56.928-80.641H253.12v335.533c0 43.996-31.593 72.271-70.009 72.271-23.111 0-44.185-9.801-57.531-26.842-22.017-11.499-37.21-34.044-37.21-63.751 0-50.821 39.698-77.626 92.63-72.084v-68.388c-86.485.189-158.832 69.708-158.832 155.815 0 45.882 18.096 86.409 47.277 115.363 25.711 17.569 56.776 27.672 90.216 27.672z" />
        </g>
      </svg>
    ),
    YouTube: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    Facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    Twitter: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={selected ? "#ffffff" : "#0f172a"}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    Threads: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 512 512" fill={selected ? "#ffffff" : "#0f172a"}>
        <g transform="translate(51, 51) scale(0.8, 0.8)">
          <path d="M 377.433594 237.300781 C 375.226562 236.246094 372.988281 235.226562 370.71875 234.253906 C 366.765625 161.433594 326.976562 119.746094 260.164062 119.320312 C 259.863281 119.316406 259.5625 119.316406 259.257812 119.316406 C 219.296875 119.316406 186.0625 136.375 165.605469 167.414062 L 202.347656 192.621094 C 217.632812 169.433594 241.613281 164.492188 259.277344 164.492188 C 259.480469 164.492188 259.683594 164.492188 259.886719 164.496094 C 281.886719 164.636719 298.484375 171.03125 309.230469 183.503906 C 317.046875 192.585938 322.277344 205.132812 324.867188 220.96875 C 305.363281 217.65625 284.269531 216.636719 261.71875 217.929688 C 198.199219 221.585938 157.363281 258.632812 160.105469 310.113281 C 161.496094 336.222656 174.507812 358.6875 196.734375 373.363281 C 215.527344 385.769531 239.730469 391.835938 264.886719 390.460938 C 298.105469 388.640625 324.167969 375.964844 342.347656 352.789062 C 356.15625 335.1875 364.890625 312.382812 368.746094 283.644531 C 384.578125 293.199219 396.3125 305.769531 402.792969 320.886719 C 413.8125 346.578125 414.453125 388.800781 380.003906 423.222656 C 349.820312 453.375 313.535156 466.421875 258.703125 466.824219 C 197.878906 466.375 151.875 446.867188 121.96875 408.84375 C 93.960938 373.242188 79.488281 321.820312 78.945312 256 C 79.488281 190.179688 93.960938 138.757812 121.96875 103.152344 C 151.875 65.132812 197.878906 45.625 258.703125 45.175781 C 319.96875 45.628906 366.769531 65.230469 397.824219 103.433594 C 413.050781 122.167969 424.53125 145.730469 432.097656 173.199219 L 475.15625 161.710938 C 465.984375 127.898438 451.550781 98.761719 431.90625 74.597656 C 392.097656 25.617188 333.871094 0.519531 258.851562 0 L 258.550781 0 C 183.683594 0.519531 126.113281 25.710938 87.433594 74.878906 C 53.019531 118.628906 35.265625 179.507812 34.667969 255.820312 L 34.667969 256.179688 C 35.265625 332.492188 53.019531 393.371094 87.433594 437.121094 C 126.113281 486.289062 183.683594 511.484375 258.550781 512 L 258.851562 512 C 325.414062 511.539062 372.332031 494.113281 410.980469 455.496094 C 461.550781 404.976562 460.027344 341.652344 443.359375 302.777344 C 431.402344 274.898438 408.605469 252.257812 377.433594 237.300781 Z M 262.507812 345.351562 C 234.667969 346.921875 205.746094 334.425781 204.320312 307.660156 C 203.261719 287.8125 218.441406 265.667969 264.214844 263.03125 C 269.457031 262.730469 274.601562 262.582031 279.65625 262.582031 C 296.28125 262.582031 311.835938 264.195312 325.980469 267.289062 C 320.703125 333.160156 289.765625 343.855469 262.507812 345.351562 Z M 262.507812 345.351562" />
        </g>
      </svg>
    ),
    Discord: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 512 388.049" fill="none">
        <path fill={selected ? "#ffffff" : "#5865F2"} fillRule="nonzero" d="M433.713 32.491A424.231 424.231 0 00328.061.005c-4.953 8.873-9.488 18.156-13.492 27.509a393.937 393.937 0 00-58.629-4.408c-19.594 0-39.284 1.489-58.637 4.37-3.952-9.33-8.543-18.581-13.525-27.476-36.435 6.212-72.045 17.196-105.676 32.555-66.867 98.92-84.988 195.368-75.928 290.446a425.967 425.967 0 00129.563 65.03c10.447-14.103 19.806-29.116 27.752-44.74a273.827 273.827 0 01-43.716-20.862c3.665-2.658 7.249-5.396 10.712-8.055 40.496 19.019 84.745 28.94 129.514 28.94 44.77 0 89.019-9.921 129.517-28.943 3.504 2.86 7.088 5.598 10.712 8.055a275.576 275.576 0 01-43.796 20.918 311.49 311.49 0 0027.752 44.705 424.235 424.235 0 00129.65-65.019l-.011.011c10.632-110.26-18.162-205.822-76.11-290.55zM170.948 264.529c-25.249 0-46.11-22.914-46.11-51.104 0-28.189 20.135-51.304 46.029-51.304 25.895 0 46.592 23.115 46.15 51.304-.443 28.19-20.336 51.104-46.069 51.104zm170.102 0c-25.29 0-46.069-22.914-46.069-51.104 0-28.189 20.135-51.304 46.069-51.304s46.472 23.115 46.029 51.304c-.443 28.19-20.296 51.104-46.029 51.104z" />
      </svg>
    ),
    Kick: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 512 512" fill="none">
        <path
          d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z"
          fill={selected ? "#0f172a" : "#53fc18"}
        />
      </svg>
    ),
    Telegram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    Spotify: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    WhatsApp: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
  };
  return <>{icons[name] || (name.includes("Twitter") || name.includes("X") ? icons["Twitter"] : icons["All"])}</>;
};

// Platform config with clean light-friendly active styles
const platformConfig = [
  { name: "All", color: "bg-primary" },
  { name: "Instagram", color: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045]" },
  { name: "TikTok", color: "bg-slate-900" },
  { name: "YouTube", color: "bg-red-600" },
  { name: "Facebook", color: "bg-blue-600" },
  { name: "Twitter", color: "bg-slate-900" },
  { name: "Threads", color: "bg-slate-900" },
  { name: "Discord", color: "bg-[#5865F2]" },
  { name: "Kick", color: "bg-[#53FC18]" },
  { name: "Telegram", color: "bg-sky-500" },
  { name: "Spotify", color: "bg-emerald-600" },
  { name: "WhatsApp", color: "bg-green-600" },
];

export default function ServicesPage() {
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
    const p = selectedPlatform.toLowerCase();
    return services.filter((s) => {
      const cat = s.category_name.toLowerCase();
      const name = s.name.toLowerCase();
      if (p.includes("twitter") || p.includes("x")) {
        return (
          cat.includes("twitter") ||
          cat.includes(" x ") ||
          cat.startsWith("x ") ||
          name.includes("twitter") ||
          name.includes(" x ")
        );
      }
      return cat.includes(p) || name.includes(p);
    });
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
    } else {
      setOrderQuantity("");
    }
  }, [selectedService]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      router.push("/login");
      return;
    }

    if (!selectedService) {
      setOrderError("Please select a service");
      return;
    }

    if (!orderLink.trim()) {
      setOrderError("Please enter a link");
      return;
    }

    const quantity = parseInt(orderQuantity);
    if (!quantity || quantity < selectedService.min_quantity) {
      setOrderError(`Minimum quantity is ${selectedService.min_quantity}`);
      return;
    }

    if (quantity > selectedService.max_quantity) {
      setOrderError(`Maximum quantity is ${selectedService.max_quantity}`);
      return;
    }

    setOrderLoading(true);
    setOrderError("");
    setOrderSuccess("");

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Services & Pricing</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              Explore high-performance social growth services. Select a platform to view available packages.
            </p>
          </div>

          {/* Platform Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            {platformConfig.map((platform) => {
              const isSelected = selectedPlatform === platform.name;
              const isKick = platform.name === "Kick";
              return (
                <button
                  key={platform.name}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.name)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? `${platform.color} ${isKick ? "platform-pill-active-dark" : "platform-pill-active-white"} shadow-md shadow-slate-300/50 scale-102`
                      : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                  }`}
                  title={platform.name}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    <PlatformIcon name={platform.name} selected={isSelected} />
                  </span>
                  <span>
                    {platform.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Order Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {loading ? (
              <div className="py-14 text-center">
                <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-semibold">Loading available services...</p>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Select Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 text-sm text-slate-900 font-medium focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">— Choose a category ({categories.length} available) —</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Dropdown */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    2. Select Service
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    disabled={!selectedCategory}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 text-sm text-slate-900 font-medium focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer ${
                      !selectedCategory ? "opacity-50 cursor-not-allowed bg-slate-100" : ""
                    }`}
                  >
                    <option value="">
                      {!selectedCategory ? "— Select a category first —" : "— Choose a service —"}
                    </option>
                    {servicesInCategory.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {formatCurrency(parseFloat(service.user_rate))} per 1K
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Specs Details */}
                {selectedService && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200/60">
                        ID: {selectedService.external_id}
                      </span>
                      {selectedService.has_refill && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                          Refill Available
                        </span>
                      )}
                      {selectedService.has_cancel && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200/60">
                          Cancelable
                        </span>
                      )}
                      {selectedService.avg_completion_time && (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-200/70 text-slate-700 font-semibold">
                          Avg: {selectedService.avg_completion_time}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-between font-medium">
                      <span>Min: {selectedService.min_quantity.toLocaleString()}</span>
                      <span>Max: {selectedService.max_quantity.toLocaleString()}</span>
                      <span className="font-bold text-slate-900">
                        Rate: {formatCurrency(parseFloat(selectedService.user_rate))} / 1K
                      </span>
                    </div>
                  </div>
                )}

                {/* Target Link */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    3. Target Link / URL
                  </label>
                  <input
                    type="url"
                    value={orderLink}
                    onChange={(e) => setOrderLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
                    required
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    4. Quantity
                  </label>
                  <input
                    type="number"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    placeholder={
                      selectedService
                        ? `${selectedService.min_quantity} - ${selectedService.max_quantity}`
                        : "Enter quantity"
                    }
                    min={selectedService?.min_quantity || 1}
                    max={selectedService?.max_quantity || 1000000}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
                    required
                  />
                </div>

                {/* Total Price & Submit */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Total Price</span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(orderPrice)}
                    </span>
                  </div>

                  {orderError && (
                    <p className="text-xs font-bold text-red-600">{orderError}</p>
                  )}
                  {orderSuccess && (
                    <p className="text-xs font-bold text-emerald-600">{orderSuccess}</p>
                  )}

                  <button
                    type="submit"
                    disabled={orderLoading || !selectedService}
                    className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 cursor-pointer"
                  >
                    {orderLoading ? "Placing Order..." : isAuthenticated ? "Place Order" : "Login to Order"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
