import React, { useMemo } from 'react';

export default function VisitorCharts({
  visitors = [],
  onlineVisitors = []
}) {
  /* =========================================================
     UTILITAIRES
  ========================================================= */

  const getDate = (visitor) => {
    const value =
      visitor.client_time ||
      visitor.visited_at;

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const formatDay = (date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getDayKey = (date) => {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };


  /* =========================================================
     7 DERNIERS JOURS
  ========================================================= */

  const last7Days = useMemo(() => {
    const days = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);

      date.setDate(
        now.getDate() - i
      );

      date.setHours(
        0,
        0,
        0,
        0
      );

      days.push({
        key: getDayKey(date),
        label: formatDay(date),
        visits: 0,
        uniqueIds: new Set()
      });
    }

    const dayMap = new Map(
      days.map((day) => [
        day.key,
        day
      ])
    );

    visitors.forEach((visitor) => {
      const date =
        getDate(visitor);

      if (!date) return;

      const key =
        getDayKey(date);

      const day =
        dayMap.get(key);

      if (!day) return;

      day.visits += 1;

      const visitorId =
        visitor.visitor_id ||
        visitor.id;

      if (visitorId) {
        day.uniqueIds.add(
          visitorId
        );
      }
    });

    return days.map((day) => ({
      ...day,
      unique: day.uniqueIds.size
    }));
  }, [visitors]);


  /* =========================================================
     STATISTIQUES DES VILLES
  ========================================================= */

  const cityStats = useMemo(() => {
    const map = new Map();

    visitors.forEach((visitor) => {
      const city =
        visitor.city?.trim() ||
        'Ville inconnue';

      if (!map.has(city)) {
        map.set(city, {
          city,
          visits: 0,
          uniqueIds: new Set()
        });
      }

      const item =
        map.get(city);

      item.visits += 1;

      const visitorId =
        visitor.visitor_id ||
        visitor.id;

      if (visitorId) {
        item.uniqueIds.add(
          visitorId
        );
      }
    });

    return Array.from(
      map.values()
    )
      .map((item) => ({
        city: item.city,
        visits: item.visits,
        unique: item.uniqueIds.size
      }))
      .sort(
        (a, b) =>
          b.visits - a.visits
      )
      .slice(0, 8);
  }, [visitors]);


  /* =========================================================
     STATISTIQUES PAYS
  ========================================================= */

  const countryStats = useMemo(() => {
    const map = new Map();

    visitors.forEach((visitor) => {
      const country =
        visitor.country?.trim() ||
        'Pays inconnu';

      const current =
        map.get(country) || 0;

      map.set(
        country,
        current + 1
      );
    });

    return Array.from(
      map.entries()
    )
      .map(
        ([country, visits]) => ({
          country,
          visits
        })
      )
      .sort(
        (a, b) =>
          b.visits - a.visits
      )
      .slice(0, 8);
  }, [visitors]);


  /* =========================================================
     TOTALS
  ========================================================= */

  const totalVisits =
    visitors.length;

  const uniqueVisitors =
    new Set(
      visitors
        .map(
          (visitor) =>
            visitor.visitor_id ||
            visitor.id
        )
        .filter(Boolean)
    ).size;

  const totalCities =
    new Set(
      visitors
        .map(
          (visitor) =>
            visitor.city?.trim() ||
            'Ville inconnue'
        )
    ).size;


  /* =========================================================
     MAX POUR LES BARRES
  ========================================================= */

  const maxVisits =
    Math.max(
      1,
      ...last7Days.map(
        (day) =>
          day.visits
      )
    );

  const maxUnique =
    Math.max(
      1,
      ...last7Days.map(
        (day) =>
          day.unique
      )
    );

  const maxCity =
    Math.max(
      1,
      ...cityStats.map(
        (city) =>
          city.visits
      )
    );

  const maxCountry =
    Math.max(
      1,
      ...countryStats.map(
        (country) =>
          country.visits
      )
    );


  /* =========================================================
     RENDU
  ========================================================= */

  return (
    <section className="mt-8">

      {/* =====================================================
          TITRE
      ===================================================== */}

      <div className="mb-5">

        <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
          Analytics
        </p>

        <h2 className="text-2xl font-black text-[#002B49]">
          📊 Graphiques des visiteurs
        </h2>

        <p className="text-sm text-slate-500">
          Analyse des visites, visiteurs uniques,
          villes et pays.
        </p>

      </div>


      {/* =====================================================
          CARTES RESUME
      ===================================================== */}

      <div className="mb-6 grid gap-4 md:grid-cols-4">

        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <p className="text-xs font-bold uppercase text-slate-500">
            Visites
          </p>

          <p className="mt-2 text-3xl font-black text-[#002B49]">
            {totalVisits}
          </p>

        </div>


        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <p className="text-xs font-bold uppercase text-slate-500">
            Visiteurs uniques
          </p>

          <p className="mt-2 text-3xl font-black text-[#002B49]">
            {uniqueVisitors}
          </p>

        </div>


        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <p className="text-xs font-bold uppercase text-slate-500">
            Villes
          </p>

          <p className="mt-2 text-3xl font-black text-[#002B49]">
            {totalCities}
          </p>

        </div>


        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <p className="text-xs font-bold uppercase text-slate-500">
            En ligne
          </p>

          <p className="mt-2 text-3xl font-black text-green-600">
            {onlineVisitors.length}
          </p>

        </div>

      </div>


      {/* =====================================================
          GRAPHIQUE 1
          VISITES / 7 JOURS
      ===================================================== */}

      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm md:p-8">

        <div className="mb-6">

          <h3 className="text-lg font-black text-[#002B49]">
            📈 Visites des 7 derniers jours
          </h3>

          <p className="text-sm text-slate-500">
            Nombre total de visites par jour.
          </p>

        </div>


        <div className="flex h-64 items-end gap-3 overflow-x-auto border-b border-slate-200 pb-2">

          {last7Days.map((day) => {

            const height =
              (day.visits /
                maxVisits) *
              100;

            return (
              <div
                key={day.key}
                className="flex min-w-[55px] flex-1 flex-col items-center justify-end gap-2"
              >

                <span className="text-xs font-black text-[#002B49]">
                  {day.visits}
                </span>

                <div
                  className="w-full max-w-[48px] rounded-t-xl bg-[#002B49] transition-all"
                  style={{
                    height: `${Math.max(
                      height,
                      day.visits > 0
                        ? 8
                        : 2
                    )}%`
                  }}
                  title={`${day.visits} visite(s)`}
                />

                <span className="text-xs font-bold text-slate-500">
                  {day.label}
                </span>

              </div>
            );

          })}

        </div>

      </div>


      {/* =====================================================
          GRAPHIQUE 2
          VISITEURS UNIQUES
      ===================================================== */}

      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm md:p-8">

        <div className="mb-6">

          <h3 className="text-lg font-black text-[#002B49]">
            👥 Visiteurs uniques
          </h3>

          <p className="text-sm text-slate-500">
            Nombre de visiteurs différents par jour.
          </p>

        </div>


        <div className="flex h-64 items-end gap-3 overflow-x-auto border-b border-slate-200 pb-2">

          {last7Days.map((day) => {

            const height =
              (day.unique /
                maxUnique) *
              100;

            return (
              <div
                key={day.key}
                className="flex min-w-[55px] flex-1 flex-col items-center justify-end gap-2"
              >

                <span className="text-xs font-black text-green-700">
                  {day.unique}
                </span>

                <div
                  className="w-full max-w-[48px] rounded-t-xl bg-green-500 transition-all"
                  style={{
                    height: `${Math.max(
                      height,
                      day.unique > 0
                        ? 8
                        : 2
                    )}%`
                  }}
                  title={`${day.unique} visiteur(s) unique(s)`}
                />

                <span className="text-xs font-bold text-slate-500">
                  {day.label}
                </span>

              </div>
            );

          })}

        </div>

      </div>


      {/* =====================================================
          VILLES
      ===================================================== */}

      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm md:p-8">

        <div className="mb-6">

          <h3 className="text-lg font-black text-[#002B49]">
            📍 Visites par ville
          </h3>

          <p className="text-sm text-slate-500">
            Les villes qui génèrent le plus de visites.
          </p>

        </div>


        {cityStats.length === 0 ? (

          <p className="text-slate-500">
            Aucune donnée disponible.
          </p>

        ) : (

          <div className="space-y-4">

            {cityStats.map(
              (city) => {

                const width =
                  (city.visits /
                    maxCity) *
                  100;

                return (
                  <div
                    key={city.city}
                  >

                    <div className="mb-1 flex items-center justify-between">

                      <span className="font-bold text-[#002B49]">
                        {city.city}
                      </span>

                      <span className="text-sm font-black text-slate-600">
                        {city.visits}
                      </span>

                    </div>

                    <div className="h-4 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-[#D4AF37] transition-all"
                        style={{
                          width: `${width}%`
                        }}
                      />

                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {city.unique} visiteur
                      {city.unique > 1
                        ? 's'
                        : ''}{' '}
                      unique
                      {city.unique > 1
                        ? 's'
                        : ''}
                    </p>

                  </div>
                );

              }
            )}

          </div>

        )}

      </div>


      {/* =====================================================
          PAYS
      ===================================================== */}

      <div className="rounded-3xl bg-white p-5 shadow-sm md:p-8">

        <div className="mb-6">

          <h3 className="text-lg font-black text-[#002B49]">
            🌍 Visites par pays
          </h3>

          <p className="text-sm text-slate-500">
            Répartition géographique des visiteurs.
          </p>

        </div>


        {countryStats.length === 0 ? (

          <p className="text-slate-500">
            Aucune donnée disponible.
          </p>

        ) : (

          <div className="space-y-4">

            {countryStats.map(
              (country) => {

                const width =
                  (country.visits /
                    maxCountry) *
                  100;

                return (
                  <div
                    key={country.country}
                  >

                    <div className="mb-1 flex items-center justify-between">

                      <span className="font-bold text-[#002B49]">
                        {country.country}
                      </span>

                      <span className="text-sm font-black text-slate-600">
                        {country.visits}
                      </span>

                    </div>

                    <div className="h-4 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{
                          width: `${width}%`
                        }}
                      />

                    </div>

                  </div>
                );

              }
            )}

          </div>

        )}

      </div>

    </section>
  );
}