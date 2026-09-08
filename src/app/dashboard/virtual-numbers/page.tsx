'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OTPOrder, OTPServiceItem, otpApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import OtpVerificationModal from '@/components/OtpVerificationModal';
import DashboardPromoBanner from '@/components/DashboardPromoBanner';

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AX', name: 'Åland Islands' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AS', name: 'American Samoa' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguilla' },
  { code: 'AQ', name: 'Antarctica' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AW', name: 'Aruba' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BM', name: 'Bermuda' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BQ', name: 'Bonaire, Sint Eustatius and Saba' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BV', name: 'Bouvet Island' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IO', name: 'British Indian Ocean Territory' },
  { code: 'BN', name: 'Brunei Darussalam' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' },
  { code: 'KY', name: 'Cayman Islands' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CX', name: 'Christmas Island' },
  { code: 'CC', name: 'Cocos (Keeling) Islands' },
  { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Congo (DRC)' },
  { code: 'CK', name: 'Cook Islands' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CW', name: 'Curaçao' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FK', name: 'Falkland Islands' },
  { code: 'FO', name: 'Faroe Islands' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GF', name: 'French Guiana' },
  { code: 'PF', name: 'French Polynesia' },
  { code: 'TF', name: 'French Southern Territories' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GI', name: 'Gibraltar' },
  { code: 'GR', name: 'Greece' },
  { code: 'GL', name: 'Greenland' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'GU', name: 'Guam' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GG', name: 'Guernsey' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HM', name: 'Heard & McDonald Islands' },
  { code: 'VA', name: 'Holy See (Vatican)' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IM', name: 'Isle of Man' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' },
  { code: 'JE', name: 'Jersey' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KP', name: 'North Korea' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MO', name: 'Macao' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MS', name: 'Montserrat' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NC', name: 'New Caledonia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NU', name: 'Niue' },
  { code: 'NF', name: 'Norfolk Island' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'MP', name: 'Northern Mariana Islands' },
  { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PW', name: 'Palau' },
  { code: 'PS', name: 'Palestine' },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PN', name: 'Pitcairn' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RE', name: 'Réunion' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'BL', name: 'Saint Barthélemy' },
  { code: 'SH', name: 'Saint Helena' },
  { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'MF', name: 'Saint Martin' },
  { code: 'PM', name: 'Saint Pierre and Miquelon' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'Sao Tome and Principe' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SX', name: 'Sint Maarten' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GS', name: 'South Georgia' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' },
  { code: 'TK', name: 'Tokelau' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'TC', name: 'Turks and Caicos Islands' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UM', name: 'United States Minor Outlying Islands' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'VG', name: 'Virgin Islands (British)' },
  { code: 'VI', name: 'Virgin Islands (U.S.)' },
  { code: 'WF', name: 'Wallis and Futuna' },
  { code: 'EH', name: 'Western Sahara' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
];

// Clean SVG Country Flag with automatic code badge fallback
function CountryFlag({
  code,
  name,
  className = 'w-5 h-3.5',
}: {
  code: string;
  name?: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const lc = (code || '').toLowerCase();

  if (imgError || !code) {
    return (
      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
        {code}
      </span>
    );
  }

  return (
    <img
      src={`/flags/${lc}.svg`}
      alt={name || code}
      onError={() => setImgError(true)}
      className={`${className} object-cover rounded-xs border border-slate-200/80 shrink-0 shadow-2xs`}
      loading="lazy"
    />
  );
}

// Authentic Caryvn SVG Platform Icons (zero emojis, un-skewed TikTok)
const PlatformIcon = ({ name, className = 'w-4 h-4' }: { name: string; className?: string }) => {
  const n = String(name || '').toLowerCase();
  if (n.includes('whatsapp')) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    );
  }
  if (n.includes('telegram')) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }
  if (n.includes('instagram')) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="2" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (n.includes('tiktok')) {
    return (
      <svg className={className} viewBox="0 0 461 512.235" fill="none">
        <g fillRule="nonzero">
          <path fill="#2DCCD3" d="M370.934 98.964c19.378 19.981 43.543 32.158 67.898 37.7v-15.005c-22.884-1.621-46.823-8.822-67.898-22.695zM230.952 0v335.533c0 43.959-31.593 72.234-70.009 72.234-12.743 0-24.844-2.978-35.363-8.483 13.346 17.041 34.421 26.843 57.531 26.843 38.417 0 70.01-28.275 70.01-72.272V18.322h60.886C312.348 12.479 310.99 6.371 309.934 0h-78.982zM181 195.062v-16.627c-7.691-1.281-15.382-1.696-21.753-1.696C72.573 176.739 0 246.296 0 332.555c0 56.626 27.559 105.033 69.444 133.685-29.18-28.953-47.276-69.481-47.276-115.362 0-86.109 72.347-155.628 158.832-155.816z" />
          <path fill="#F1204A" d="M318.87 329.991c0 107.144-81.96 163.921-159.209 163.921-33.44 0-64.505-10.103-90.217-27.672 28.879 28.652 68.616 45.995 112.385 45.995 77.248 0 159.208-56.777 159.208-163.921V173.723c-7.69-5.203-15.08-11.272-22.167-18.36v174.628zm-193.289 69.294c-9.426-11.914-15.043-27.334-15.043-45.43 0-50.782 39.698-77.624 92.629-72.045v-85.052c-7.69-1.282-15.381-1.697-21.79-1.697H181v68.389c-52.931-5.542-92.63 21.263-92.63 72.083 0 29.707 15.193 52.252 37.211 63.752zm313.251-262.621v63.525c-35.174 0-68.464-6.711-97.795-26.466 34.157 34.157 75.59 44.826 119.963 44.826v-78.567a137.713 137.713 0 01-22.168-3.318zm-67.898-37.701c-18.737-19.265-33.026-45.806-38.832-80.641h-18.095c10.329 37.663 31.592 63.94 56.927 80.641z" />
          <path fill="#0f172a" d="M159.661 493.912c77.248 0 159.209-56.777 159.209-163.921V155.364c7.088 7.087 14.477 13.157 22.168 18.359 29.33 19.755 62.62 26.466 97.794 26.466v-63.525c-24.354-5.542-48.52-17.72-67.898-37.7-25.335-16.702-46.597-42.979-56.928-80.641H253.12v335.533c0 43.996-31.593 72.271-70.009 72.271-23.111 0-44.185-9.801-57.531-26.842-22.017-11.499-37.21-34.044-37.21-63.751 0-50.821 39.698-77.626 92.63-72.084v-68.388c-86.485.189-158.832 69.708-158.832 155.815 0 45.882 18.096 86.409 47.277 115.363 25.711 17.569 56.776 27.672 90.216 27.672z" />
        </g>
      </svg>
    );
  }
  if (n.includes('facebook')) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
};

// Popular Platforms Config — pure light theme styling, zero dark blobs
const POPULAR_SERVICES = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    idle: 'bg-emerald-50 text-emerald-600 border-emerald-200/90 hover:bg-emerald-100/70',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/25',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    idle: 'bg-sky-50 text-sky-600 border-sky-200/90 hover:bg-sky-100/70',
    active: 'bg-sky-100 text-sky-800 border-sky-500 ring-2 ring-sky-500/25',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    idle: 'bg-pink-50 text-pink-600 border-pink-200/90 hover:bg-pink-100/70',
    active: 'bg-pink-100 text-pink-800 border-pink-500 ring-2 ring-pink-500/25',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    idle: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200',
    active: 'bg-slate-200 text-slate-900 border-slate-400 ring-2 ring-slate-400/25',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    idle: 'bg-blue-50 text-blue-600 border-blue-200/90 hover:bg-blue-100/70',
    active: 'bg-blue-100 text-blue-800 border-blue-500 ring-2 ring-blue-500/25',
  },
];

// Custom Searchable Country Dropdown
function CountryDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold text-slate-800 transition-all shadow-2xs cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CountryFlag code={selected.code} name={selected.name} className="w-5 h-3.5" />
          <span className="font-bold text-slate-900 truncate">{selected.name}</span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-xl z-40 overflow-hidden p-2">
          <div className="relative mb-2">
            <input
              type="text"
              autoFocus
              placeholder="Search country name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 pl-8"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  value === c.code
                    ? 'bg-blue-50 text-primary'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CountryFlag code={c.code} name={c.name} className="w-5 h-3.5" />
                <span className="font-medium text-slate-800 truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Collapsible Service Dropdown
function ServiceDropdown({
  services,
  selectedService,
  onSelect,
  loading,
  disabled,
  durationMultiplier = 1,
}: {
  services: OTPServiceItem[];
  selectedService: OTPServiceItem | null;
  onSelect: (svc: OTPServiceItem) => void;
  loading: boolean;
  disabled: boolean;
  durationMultiplier?: number;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase().trim();
    return services.filter((s) => {
      const sname = String(s?.service_name ?? '').toLowerCase();
      const sid = String(s?.service_id ?? '').toLowerCase();
      return sname.includes(q) || sid.includes(q);
    });
  }, [services, search]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all shadow-2xs text-left ${
          disabled || loading
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800 cursor-pointer'
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 py-0.5">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading available services...</span>
          </div>
        ) : selectedService ? (
          <div className="flex items-center justify-between w-full gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center font-bold text-slate-700 shrink-0">
                <PlatformIcon name={selectedService.service_name} className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">
                  {selectedService.service_name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  Instant disposable SMS code
                </p>
              </div>
            </div>
            <span className="font-black text-slate-900 text-sm shrink-0">
              {formatCurrency(Number(selectedService.price) * durationMultiplier)}
            </span>
          </div>
        ) : (
          <span className="text-sm font-semibold text-slate-400">
            Select or Search a service e.g. WhatsApp, Telegram...
          </span>
        )}

        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-xl z-40 overflow-hidden p-2">
          <div className="relative mb-2">
            <input
              type="text"
              autoFocus
              placeholder="Search 500+ services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 pl-8"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No services found for &ldquo;{search}&rdquo;
              </div>
            ) : (
              filtered.map((svc, idx) => {
                const isSelected =
                  selectedService &&
                  String(selectedService.service_id) === String(svc.service_id);
                return (
                  <button
                    key={`${svc.service_id}_${idx}`}
                    type="button"
                    onClick={() => {
                      onSelect(svc);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between p-3 text-left transition-colors rounded-xl cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 text-primary'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <PlatformIcon name={svc.service_name} className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-bold text-xs truncate">
                        {svc.service_name}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-slate-900 shrink-0 ml-2">
                      {formatCurrency(Number(svc.price) * durationMultiplier)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VirtualNumbersPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'short' | 'long'>('short');
  const [rentalDays, setRentalDays] = useState<number>(3);

  // Service availability gatekeeper
  const [isServiceActive, setIsServiceActive] = useState<boolean | null>(null);

  // Selector state
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [services, setServices] = useState<OTPServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<OTPServiceItem | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);

  // Active Session and Modal state
  const [modalOrder, setModalOrder] = useState<OTPOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ordersHistory, setOrdersHistory] = useState<OTPOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isRenting, setIsRenting] = useState(false);
  const [rentError, setRentError] = useState<string | null>(null);

  // Service drilldown options & server pools state
  const [options, setOptions] = useState<OTPServiceItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<OTPServiceItem | null>(null);

  // Synchronous double-click guard ref
  const isSubmittingRef = useRef(false);

  // Check if virtual number service is active globally
  useEffect(() => {
    otpApi.getStatus().then((res) => {
      if (res.data && typeof res.data.is_active === 'boolean') {
        setIsServiceActive(res.data.is_active);
      } else {
        setIsServiceActive(true);
      }
    }).catch(() => {
      setIsServiceActive(true);
    });
  }, []);

  // Step 1: When country or mode changes, fetch services for that country & provider
  useEffect(() => {
    if (isServiceActive === false) return;
    let isMounted = true;
    const loadServices = async () => {
      setLoadingServices(true);
      setSelectedService(null); // Reset service when country/mode changes so user explicitly selects
      setRentError(null);
      try {
        const token = localStorage.getItem('caryvn_token') || undefined;
        const provider = activeTab === 'long' ? 'usa_long' : 'global';
        const res = await otpApi.getServices(selectedCountry, provider, undefined, token);
        if (isMounted && res.data?.services) {
          const list = Array.isArray(res.data.services) ? res.data.services : [];
          setServices(list);
          // Do NOT auto-select WhatsApp or list[0] — leave clean for user to choose
          setSelectedService(null);
        }
      } catch (err) {
        console.error('Error fetching OTP services:', err);
      } finally {
        if (isMounted) setLoadingServices(false);
      }
    };
    loadServices();
    return () => {
      isMounted = false;
    };
  }, [selectedCountry, isServiceActive, activeTab]);

  // Fetch Order History
  const loadOrderHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('caryvn_token') || undefined;
      const res = await otpApi.getOrders({ page: 1 }, token);
      if (res.data?.results) {
        setOrdersHistory(res.data.results);
      }
    } catch (err) {
      console.error('Error loading OTP order history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadOrderHistory();
  }, []);

  // Toggle or select popular platform
  const handlePopularClick = (pId: string) => {
    const currentId = String(selectedService?.service_id ?? '').toLowerCase();
    const currentName = String(selectedService?.service_name ?? '').toLowerCase();

    // Toggle off if already selected (allows unclicking)
    if (currentId === pId.toLowerCase() || currentName.includes(pId.toLowerCase())) {
      setSelectedService(null);
      setRentError(null);
      return;
    }

    // Match service in available list for current country
    const matched = services.find((s) => {
      const sid = String(s?.service_id ?? '').toLowerCase();
      const sname = String(s?.service_name ?? '').toLowerCase();
      return sid === pId.toLowerCase() || sname.includes(pId.toLowerCase());
    });

    if (matched) {
      setSelectedService(matched);
      setRentError(null);
    } else {
      setRentError(`This platform is not available for ${selectedCountry}. Please select another service or country.`);
    }
  };

  // Fetch available route / pool options when service is selected
  useEffect(() => {
    if (!selectedService) {
      setOptions([]);
      setSelectedOption(null);
      return;
    }
    let isMounted = true;
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const token = localStorage.getItem('caryvn_token') || undefined;
        const provider = activeTab === 'long' ? 'usa_long' : 'global';
        const res = await otpApi.getServices(selectedCountry, provider, String(selectedService.service_id), token);
        if (isMounted && res.data?.services) {
          const list = Array.isArray(res.data.services) ? res.data.services : [];
          if (list.length > 0) {
            setOptions(list);
            setSelectedOption(list[0]);
          } else {
            setOptions([selectedService]);
            setSelectedOption(selectedService);
          }
        } else if (isMounted) {
          setOptions([selectedService]);
          setSelectedOption(selectedService);
        }
      } catch (err) {
        console.error('Error fetching service options:', err);
        if (isMounted) {
          setOptions([selectedService]);
          setSelectedOption(selectedService);
        }
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };
    loadOptions();
    return () => {
      isMounted = false;
    };
  }, [selectedCountry, selectedService?.service_id, activeTab]);

  // Duration multiplier for long-term numbers: 3D=1x, 7D=2.33x, 14D=4.67x, 30D=10x
  const durationMultiplier = activeTab === 'long' ? Math.max(1, rentalDays / 3) : 1;
  const activeItem = selectedOption || selectedService;
  const basePrice = activeItem ? Number(activeItem.price) : 0;
  const currentPrice = basePrice * durationMultiplier;

  // Buy number action with synchronous rapid double-click guard
  const handleRent = async () => {
    if (isSubmittingRef.current || isRenting || !selectedService) return;
    isSubmittingRef.current = true;
    setIsRenting(true);
    setRentError(null);

    const activePool = selectedOption?.pool_id;
    const activeProvider = selectedOption?.provider || (activeTab === 'long' ? 'usa_long' : 'global');

    try {
      const token = localStorage.getItem('caryvn_token') || undefined;
      const res = await otpApi.rentNumber(
        {
          country: selectedCountry,
          service: String(selectedService.service_id),
          service_name: String(selectedService.service_name || selectedService.service_id),
          provider: activeProvider,
          pool: activePool || undefined,
          rental_type: activeTab,
          days: activeTab === 'long' ? rentalDays : 0,
        },
        token
      );

      if (res.error) {
        setRentError(res.error);
      } else if (res.data?.order) {
        setModalOrder(res.data.order);
        setIsModalOpen(true);
        setOrdersHistory((prev) => [res.data!.order, ...prev]);
        refreshUser();
      }
    } catch (err: any) {
      setRentError(err.message || 'Failed to buy virtual number.');
    } finally {
      isSubmittingRef.current = false;
      setIsRenting(false);
    }
  };

  const handleOrderUpdated = (updated: OTPOrder) => {
    setModalOrder(updated);
    setOrdersHistory((prev) =>
      prev.map((o) => (o.id === updated.id ? updated : o))
    );
    if (updated.status !== 'PENDING') {
      refreshUser();
    }
  };

  const userBalance = Number(user?.balance || 0);
  const hasEnoughFunds = userBalance >= currentPrice;

  if (isServiceActive === false) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Service Temporarily Unavailable</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Virtual Numbers and SMS verification services are currently undergoing maintenance or have been disabled by the administrator. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
            Virtual Numbers & SMS Verification
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white tracking-wide uppercase shadow-xs">
            Live
          </span>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm">
          Instant disposable virtual numbers to receive SMS OTP codes for WhatsApp, Telegram, Google, OpenAI, and 500+ services.
        </p>
      </div>

      <div>
        <DashboardPromoBanner />
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-slate-200/60 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('short')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'short'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Short-Term Numbers</span>
        </button>
        <button
          onClick={() => setActiveTab('long')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'long'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Long-Term Numbers (3–30 Days)</span>
        </button>
      </div>

      {/* Buying Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 mb-10">
        {/* Step 1: Country Selector (Required First) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Select Country
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Required first</span>
          </div>
          <CountryDropdown value={selectedCountry} onChange={setSelectedCountry} />
        </div>

        {/* Long-Term Days Selector */}
        {activeTab === 'long' && (
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Rental Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRentalDays(days)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    rentalDays === days
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Popular Platforms (Icons Only, unclickable toggle) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Popular Platforms
            </label>
            <span className="text-[11px] text-slate-400">Click to select or unclick</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {POPULAR_SERVICES.map((p) => {
              const isSelected =
                String(selectedService?.service_id ?? '').toLowerCase() === p.id.toLowerCase() ||
                String(selectedService?.service_name ?? '').toLowerCase().includes(p.id.toLowerCase());
              return (
                <button
                  key={p.id}
                  type="button"
                  title={isSelected ? `Selected: ${p.name} (Click to deselect)` : p.name}
                  aria-label={p.name}
                  disabled={loadingServices}
                  onClick={() => handlePopularClick(p.id)}
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-2xs ${
                    isSelected ? p.active : p.idle
                  }`}
                >
                  <PlatformIcon name={p.name} className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Collapsible All Available Services Dropdown */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            3. Choose a Service
          </label>
          <ServiceDropdown
            services={services}
            selectedService={selectedService}
            onSelect={setSelectedService}
            loading={loadingServices}
            disabled={loadingServices}
            durationMultiplier={durationMultiplier}
          />
        </div>

        {/* Step 4: Available Route / Server Options */}
        {selectedService && (
          <div className="mb-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Available Route Options
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {loadingOptions
                  ? 'Checking server pools...'
                  : `${options.length} ${options.length === 1 ? 'option' : 'options'} available`}
              </span>
            </div>

            {loadingOptions ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2.5 text-slate-500 text-xs">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading available routes for {selectedService.service_name}...</span>
              </div>
            ) : options.length > 0 ? (
              <div className={`grid gap-3 ${options.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {options.map((opt, idx) => {
                  const optKey = opt.pool_id || String(idx);
                  const isSelected = selectedOption
                    ? (selectedOption.pool_id ? selectedOption.pool_id === opt.pool_id : selectedOption.service_id === opt.service_id && idx === 0)
                    : idx === 0;
                  const optPrice = Number(opt.price) * durationMultiplier;

                  return (
                    <button
                      key={optKey}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-2xs relative ${
                        isSelected
                          ? 'bg-blue-50/70 border-primary shadow-xs ring-2 ring-primary/20'
                          : 'bg-slate-50/70 hover:bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            <PlatformIcon name={selectedService.service_name} className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {opt.pool_name || `Server Route #${idx + 1}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                          Auto-Refund
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-200/60">
                        <div>
                          <span className="text-base sm:text-lg font-black text-slate-900">
                            {formatCurrency(optPrice)}
                          </span>
                          {activeTab === 'long' && (
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {rentalDays} days rental
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-primary text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}>
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        {/* Price Tag */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Charge
          </span>
          <span className="text-2xl font-black text-slate-900">
            {formatCurrency(currentPrice)}
          </span>
          {activeTab === 'long' && (
            <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
              {rentalDays} Days Rental
            </span>
          )}
        </div>

        {/* Buy Action Button */}
        <button
          onClick={handleRent}
          disabled={isRenting || !selectedService || !hasEnoughFunds || loadingServices || loadingOptions}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-sm cursor-pointer ${
            !selectedService
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : !hasEnoughFunds
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : isRenting || loadingOptions
              ? 'bg-primary/80 text-white cursor-wait'
              : 'bg-primary hover:bg-primary-hover text-white active:scale-[0.99]'
          }`}
        >
          {isRenting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Reserving Virtual Number...</span>
            </div>
          ) : loadingOptions ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Checking Route Availability...</span>
            </div>
          ) : !selectedService ? (
            'Please select a service above'
          ) : !hasEnoughFunds ? (
            `Insufficient Balance (${formatCurrency(userBalance)} of ${formatCurrency(currentPrice)})`
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Buy {selectedService.service_name} {formatCurrency(currentPrice)}</span>
            </span>
          )}
        </button>

        {/* 100% Auto-Refunded Pill Centered at Base of Buy Button */}
        <div className="flex items-center justify-center mt-3.5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            100% Auto-Refunded if no SMS
          </span>
        </div>

        {rentError && (
          <p className="text-rose-600 text-xs font-bold mt-3 text-center">
            {rentError}
          </p>
        )}
      </div>

      {/* Clean Verification Modal Cockpit */}
      <OtpVerificationModal
        order={modalOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleOrderUpdated}
      />
    </div>
  );
}
