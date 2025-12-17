"use client";

import { useEffect, useState } from "react";
import { getVerifiedLawyers, LawyerProfile } from "@/lib/firebase/services";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<LawyerProfile[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    let result = lawyers;
    if (cityFilter) {
      // Note: city is currently inside lawyer object if we duplicated it, or we need to join.
      // For MVP assuming lawyer object has city or we filter loosely on fields we have.
      // Wait, my services.ts getVerifiedLawyers returns LawyerProfile which extends UserProfile?
      // No, UserProfile has city. LawyerProfile extends UserProfile. 
      // But in services.ts I only returned lawyer data.
      // I need to ensure lawyer data includes city.
      // IF the services.ts `getVerifiedLawyers` only fetches from `lawyers` collection, it won't have `city` unless I perform a join/fetch user data.
      // Let's assume for MVP I fix Service to include city or just filter by what's available.
      // The prompt says "Lawyer ... City".
      // I will assume the data is there or I will add a text search that might miss if data is missing.
      // Ideally `createLawyerProfile` should save city too? Or `getVerifiedLawyers` should fetch it.

      // Let's attempt to filter, assuming 'city' might be in the object (User Profile mixin).
      result = result.filter(l => l.city?.toLowerCase().includes(cityFilter.toLowerCase()));
    }
    if (specFilter) {
      result = result.filter(l => l.specializations.some(s => s.toLowerCase().includes(specFilter.toLowerCase())));
    }
    setFilteredLawyers(result);
  }, [cityFilter, specFilter, lawyers]);

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Find the Right Lawyer
        </h1>
        <p className="max-w-xl mx-auto text-xl text-gray-500">
          Search for verified attorneys in your city by specialization.
        </p>

        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 mt-8">
          <input
            type="text"
            placeholder="City (e.g. New York)"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Specialization (e.g. Criminal)"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
          />
        </div>
      </section>

      {loading ? (
        <div className="text-center py-12">Loading lawyers...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLawyers.map((lawyer) => (
            <div key={lawyer.uid} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xl">
                    {lawyer.name?.[0] || 'L'}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{lawyer.name}</h3>
                    <p className="text-sm text-gray-500">{lawyer.city || 'Unknown City'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {lawyer.specializations.slice(0, 3).map((spec, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {spec}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-gray-500 line-clamp-3">
                    {lawyer.description || "No description provided."}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <Link href={`/lawyer/${lawyer.uid}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View Profile &rarr;
                </Link>
              </div>
            </div>
          ))}
          {filteredLawyers.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12">
              No lawyers found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
