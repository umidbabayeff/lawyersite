"use client";

import { useEffect, useState } from "react";
import { getVerifiedLawyers, LawyerProfile, getConstants, seedDatabase } from "@/lib/services";
import Link from "next/link";
import { FaSearch, FaMapMarkerAlt, FaGavel } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import FavoriteButton from "@/components/ui/FavoriteButton";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useLanguage } from "@/lib/i18n_context";
import Image from "next/image";

export default function Home() {
  const { t, language } = useLanguage();
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<LawyerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Metadata
  const [locations, setLocations] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);


  // Filters
  const [cityFilter, setCityFilter] = useState("");
  const [specFilter, setSpecFilter] = useState("");

  useEffect(() => {
    async function fetchLawyers() {
      try {
        const data = await getVerifiedLawyers();
        setLawyers(data);
        setFilteredLawyers(data);
      } catch (e) {
        console.error("Failed to fetch lawyers", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLawyers();

    // Fetch Metadata
    getConstants('locations', language).then(setLocations);
    getConstants('specializations', language).then(setSpecializations);
  }, [language]);

  useEffect(() => {
    let result = lawyers;
    if (cityFilter) {
      result = result.filter(l => l.city?.toLowerCase().includes(cityFilter.toLowerCase()));
    }
    if (specFilter) {
      result = result.filter(l => l.specializations.some(s => s.toLowerCase().includes(specFilter.toLowerCase())));
    }
    setFilteredLawyers(result);
  }, [cityFilter, specFilter, lawyers]);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative -mt-8 py-20 lg:py-32 overflow-hidden bg-primary dark:bg-slate-950 text-primary-foreground dark:text-white rounded-b-[3rem] shadow-2xl mx-[-2rem] px-[2rem] sm:mx-[-3rem] sm:px-[3rem] lg:mx-[-4rem] lg:px-[4rem]">
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl">
            {t("hero.title")} <br />
            <span className="text-secondary dark:text-accent">{t("hero.subtitle")}</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-300 dark:text-slate-400 font-light">
            {t("hero.description")}
          </p>

          {/* Search Bar */}
          <div className="bg-white/10 dark:bg-slate-800/50 backdrop-blur-md p-2 rounded-2xl mt-8 shadow-xl border border-white/20 dark:border-slate-700 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <SearchableSelect
                items={locations}
                value={cityFilter}
                onChange={setCityFilter}
                placeholder={t("hero.search.city")}
                icon={<FaMapMarkerAlt />}
              />
            </div>
            <div className="flex-1 relative">
              <SearchableSelect
                items={specializations}
                value={specFilter}
                onChange={setSpecFilter}
                placeholder={t("hero.search.service")}
                icon={<FaGavel />}
              />
            </div>
          </div>

          {/* Temporary Seed Button (Hidden in Prod) */}
          <div className="text-center">
            <button
              onClick={() => seedDatabase().then(() => alert("Database Seeded! Refresh page."))}
              className="text-xs text-slate-400 hover:text-white underline opacity-50 hover:opacity-100"
            >
              Initialize Data (Run Once)
            </button>
          </div>
        </div>


        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-accent mix-blend-multiply filter blur-[100px] rounded-full animate-blob"></div>
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-600 mix-blend-multiply filter blur-[100px] rounded-full animate-blob animation-delay-2000"></div>
        </div>
      </section >

      {/* Results Section */}
      < section >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground dark:text-white">{t("home.topRated")}</h2>
          <span className="text-sm text-muted-foreground dark:text-slate-400">{filteredLawyers.length} {t("home.verifiedPros")}</span>
        </div>

        {
          loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLawyers.map((lawyer, index) => (
                <div key={lawyer.uid || index} className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Card Header / Image Placeholder */}
                  <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 relative">
                    {lawyer.bannerUrl && (
                      <Image src={lawyer.bannerUrl} alt="Banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    )}
                    <div className={`absolute inset-0 ${lawyer.bannerUrl ? 'bg-black/20' : ''}`}></div>
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      <FavoriteButton lawyerId={lawyer.uid} />
                      {lawyer.verified && (
                        <div className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-green-700 shadow-sm flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span> Verified
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-10 left-6 z-10">
                      <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-md">
                        {lawyer.photoUrl ? (
                          <div className="relative w-full h-full">
                            <Image src={lawyer.photoUrl} alt={lawyer.name} fill className="object-cover rounded-xl" sizes="80px" />
                          </div>
                        ) : (
                          <div className="h-full w-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                            {lawyer.name?.[0]?.toUpperCase() || 'L'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-12 px-6 pb-6 flex-grow flex flex-col">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors flex items-center gap-2">
                        {lawyer.name}
                        {lawyer.verified && (
                          <MdVerified className="text-blue-500 text-xl" title="Verified Lawyer" />
                        )}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <FaMapMarkerAlt className="mr-1.5 text-accent" />
                        {lawyer.city || 'Location N/A'}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {lawyer.specializations.slice(0, 3).map((spec, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {spec}
                        </span>
                      ))}
                    </div>

                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {lawyer.description || "Experienced legal professional ready to assist with your case."}
                    </p>

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t("home.rate")}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{t("common.currency")}{lawyer.price}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">{t("lawyer.perHour")}</span></p>
                      </div>
                      <Link href={`/lawyer/${lawyer.uid}`} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all">
                        {t("home.viewProfile")}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {filteredLawyers.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                    <FaSearch className="text-xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No lawyers found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your filters to find what you&apos;re looking for.</p>
                </div>
              )}
            </div>
          )
        }
      </section >
    </div >
  );
}
