import React, { useMemo, useState } from 'react';

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';


/* ============================================================
   RECENTRAGE AUTOMATIQUE
============================================================ */

function FitMapToPoints({ points }) {
  const map = useMap();

  React.useEffect(() => {
    if (!points || points.length === 0) {
      return;
    }

    const coordinates = points
      .filter(
        (point) =>
          Number.isFinite(
            Number(point.latitude)
          ) &&
          Number.isFinite(
            Number(point.longitude)
          )
      )
      .map((point) => [
        Number(point.latitude),
        Number(point.longitude)
      ]);

    if (coordinates.length === 0) {
      return;
    }

    if (coordinates.length === 1) {
      map.setView(
        coordinates[0],
        8
      );

      return;
    }

    const latitudes =
      coordinates.map(
        (coordinate) =>
          coordinate[0]
      );

    const longitudes =
      coordinates.map(
        (coordinate) =>
          coordinate[1]
      );

    const minLat =
      Math.min(...latitudes);

    const maxLat =
      Math.max(...latitudes);

    const minLng =
      Math.min(...longitudes);

    const maxLng =
      Math.max(...longitudes);

    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng]
      ],
      {
        padding: [50, 50],
        maxZoom: 12
      }
    );
  }, [points, map]);

  return null;
}


/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function VisitorMap({
  visitors = [],
  onlineVisitors = []
}) {

  /* ----------------------------------------------------------
     FILTRE DE PERIODE
  ---------------------------------------------------------- */

  const [period, setPeriod] =
    useState('7');

  /* ----------------------------------------------------------
     MODE D'AFFICHAGE
  ---------------------------------------------------------- */

  const [displayMode, setDisplayMode] =
    useState('cities');


  /* ==========================================================
     VISITEURS AVEC GPS
  ========================================================== */

  const gpsVisitors =
    useMemo(() => {

      return visitors.filter(
        (visitor) =>
          Number.isFinite(
            Number(visitor.latitude)
          ) &&
          Number.isFinite(
            Number(visitor.longitude)
          )
      );

    }, [visitors]);


  /* ==========================================================
     FILTRE PAR DATE
  ========================================================== */

  const filteredVisitors =
    useMemo(() => {

      if (period === 'all') {
        return gpsVisitors;
      }

      const now =
        new Date();

      let start =
        new Date();

      if (period === 'today') {

        start.setHours(
          0,
          0,
          0,
          0
        );

      } else if (period === '7') {

        start = new Date(
          now.getTime() -
          7 * 24 * 60 * 60 * 1000
        );

      } else if (period === '30') {

        start = new Date(
          now.getTime() -
          30 * 24 * 60 * 60 * 1000
        );

      }

      return gpsVisitors.filter(
        (visitor) => {

          const date =
            new Date(
              visitor.visited_at ||
              visitor.client_time ||
              0
            );

          return (
            !Number.isNaN(
              date.getTime()
            ) &&
            date >= start
          );
        }
      );

    }, [
      gpsVisitors,
      period
    ]);


  /* ==========================================================
     VISITEURS EN LIGNE
  ========================================================== */

  const onlineIds =
    useMemo(() => {

      return new Set(
        onlineVisitors
          .map(
            (visitor) =>
              visitor.visitor_id ||
              visitor.id
          )
          .filter(Boolean)
      );

    }, [onlineVisitors]);


  /* ==========================================================
     DERNIÈRE POSITION DE CHAQUE VISITEUR
  ========================================================== */

  const latestVisitors =
    useMemo(() => {

      const map =
        new Map();

      filteredVisitors.forEach(
        (visitor) => {

          const id =
            visitor.visitor_id ||
            visitor.id;

          if (!id) {
            return;
          }

          const existing =
            map.get(id);

          if (!existing) {

            map.set(
              id,
              visitor
            );

            return;
          }

          const existingDate =
            new Date(
              existing.visited_at ||
              existing.client_time ||
              0
            );

          const currentDate =
            new Date(
              visitor.visited_at ||
              visitor.client_time ||
              0
            );

          if (
            currentDate >
            existingDate
          ) {

            map.set(
              id,
              visitor
            );

          }

        }
      );

      return Array.from(
        map.values()
      );

    }, [filteredVisitors]);


  /* ==========================================================
     REGROUPEMENT PAR VILLE
  ========================================================== */

  const cityStats =
    useMemo(() => {

      const cities =
        new Map();

      latestVisitors.forEach(
        (visitor) => {

          const cityName =
            (
              visitor.city ||
              'Ville inconnue'
            ).trim();

          const key =
            cityName.toLowerCase();

          if (!cities.has(key)) {

            cities.set(
              key,
              {
                city:
                  cityName,

                country:
                  visitor.country ||
                  'Pays inconnu',

                region:
                  visitor.region ||
                  'Région inconnue',

                latitude:
                  Number(
                    visitor.latitude
                  ),

                longitude:
                  Number(
                    visitor.longitude
                  ),

                visitors: 0,

                online: 0,

                visitorIds:
                  new Set(),

                sources:
                  new Set()
              }
            );

          }

          const city =
            cities.get(key);

          const visitorId =
            visitor.visitor_id ||
            visitor.id;

          if (
            visitorId &&
            !city.visitorIds.has(
              visitorId
            )
          ) {

            city.visitorIds.add(
              visitorId
            );

            city.visitors += 1;

          }

          if (
            visitorId &&
            onlineIds.has(
              visitorId
            )
          ) {

            city.online += 1;

          }

          if (
            visitor.location_source
          ) {

            city.sources.add(
              visitor.location_source
            );

          }

        }
      );

      return Array.from(
        cities.values()
      )
        .filter(
          (city) =>
            Number.isFinite(
              city.latitude
            ) &&
            Number.isFinite(
              city.longitude
            )
        )
        .sort(
          (a, b) =>
            b.visitors -
            a.visitors
        );

    }, [
      latestVisitors,
      onlineIds
    ]);


  /* ==========================================================
     FORMAT DATE
  ========================================================== */

  const formatDate =
    (value) => {

      if (!value) {
        return '—';
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return '—';

      }

      return date.toLocaleString(
        'fr-FR'
      );
    };


  /* ==========================================================
     CENTRE INITIAL
  ========================================================== */

  const defaultCenter = [
    12.1067,
    15.0444
  ];


  const mapCenter =
    useMemo(() => {

      if (
        cityStats.length === 0
      ) {

        return defaultCenter;

      }

      const latitudes =
        cityStats.map(
          (city) =>
            city.latitude
        );

      const longitudes =
        cityStats.map(
          (city) =>
            city.longitude
        );

      return [

        latitudes.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
          latitudes.length,

        longitudes.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
          longitudes.length

      ];

    }, [cityStats]);


  /* ==========================================================
     POINTS POUR RECENTRAGE
  ========================================================== */

  const mapPoints =
    displayMode === 'cities'
      ? cityStats
      : latestVisitors;


  /* ==========================================================
     LABEL PERIODE
  ========================================================== */

  const periodLabel =
    period === 'today'
      ? "Aujourd'hui"
      : period === '7'
      ? '7 derniers jours'
      : period === '30'
      ? '30 derniers jours'
      : 'Toutes les visites';


  /* ==========================================================
     CARTE
  ========================================================== */

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm md:p-8">

      {/* ======================================================
          TITRE
      ====================================================== */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">

        <div>

          <h2 className="text-xl font-black text-[#002B49]">
            🌍 Carte des visiteurs
          </h2>

          <p className="text-sm text-slate-500">
            {periodLabel}
          </p>

        </div>


        {/* ====================================================
            FILTRE PERIODE
        ==================================================== */}

        <select
          value={period}
          onChange={(e) =>
            setPeriod(
              e.target.value
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-[#002B49] outline-none focus:border-[#D4AF37]"
        >

          <option value="today">
            Aujourd'hui
          </option>

          <option value="7">
            7 derniers jours
          </option>

          <option value="30">
            30 derniers jours
          </option>

          <option value="all">
            Toutes les visites
          </option>

        </select>

      </div>


      {/* ======================================================
          BOUTONS MODE
      ====================================================== */}

      <div className="mb-5 flex flex-wrap gap-2">

        <button
          onClick={() =>
            setDisplayMode(
              'cities'
            )
          }
          className={`rounded-xl px-4 py-2 text-sm font-black transition ${
            displayMode === 'cities'
              ? 'bg-[#002B49] text-white'
              : 'bg-slate-100 text-[#002B49]'
          }`}
        >
          📍 Villes
        </button>

        <button
          onClick={() =>
            setDisplayMode(
              'visitors'
            )
          }
          className={`rounded-xl px-4 py-2 text-sm font-black transition ${
            displayMode === 'visitors'
              ? 'bg-[#002B49] text-white'
              : 'bg-slate-100 text-[#002B49]'
          }`}
        >
          👤 Visiteurs
        </button>

      </div>


      {/* ======================================================
          RESUME
      ====================================================== */}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">

        <div className="rounded-2xl bg-slate-50 p-4">

          <p className="text-xs font-bold uppercase text-slate-500">
            Villes
          </p>

          <p className="mt-1 text-2xl font-black text-[#002B49]">
            {cityStats.length}
          </p>

        </div>


        <div className="rounded-2xl bg-slate-50 p-4">

          <p className="text-xs font-bold uppercase text-slate-500">
            Visiteurs
          </p>

          <p className="mt-1 text-2xl font-black text-[#002B49]">
            {latestVisitors.length}
          </p>

        </div>


        <div className="rounded-2xl bg-green-50 p-4">

          <p className="text-xs font-bold uppercase text-green-700">
            En ligne
          </p>

          <p className="mt-1 text-2xl font-black text-green-700">
            {onlineVisitors.length}
          </p>

        </div>

      </div>


      {/* ======================================================
          CARTE
      ====================================================== */}

      {mapPoints.length === 0 ? (

        <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-slate-100">

          <div className="text-center">

            <div className="mb-3 text-5xl">
              📍
            </div>

            <p className="font-black text-[#002B49]">
              Aucun visiteur GPS pour cette période
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Essaie une période plus large.
            </p>

          </div>

        </div>

      ) : (

        <div className="overflow-hidden rounded-2xl border border-slate-200">

          <MapContainer
            center={mapCenter}
            zoom={6}
            scrollWheelZoom={true}
            style={{
              height: '520px',
              width: '100%'
            }}
          >

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            <FitMapToPoints
              points={mapPoints}
            />


            {/* ==================================================
                MODE VILLES
            ================================================== */}

            {displayMode ===
              'cities' &&

              cityStats.map(
                (city) => {

                  const radius =
                    Math.min(
                      25,
                      Math.max(
                        10,
                        8 +
                          city.visitors *
                            2
                      )
                    );

                  const cityOnline =
                    city.online > 0;

                  return (

                    <CircleMarker
                      key={
                        `${city.city}-${city.latitude}-${city.longitude}`
                      }
                      center={[
                        city.latitude,
                        city.longitude
                      ]}
                      radius={
                        radius
                      }
                      pathOptions={{
                        color:
                          cityOnline
                            ? '#15803d'
                            : '#1d4ed8',

                        fillColor:
                          cityOnline
                            ? '#22c55e'
                            : '#3b82f6',

                        fillOpacity:
                          0.75,

                        weight: 3
                      }}
                    >

                      <Tooltip
                        direction="top"
                        offset={[
                          0,
                          -10
                        ]}
                      >
                        <strong>
                          {city.city}
                        </strong>

                        {' — '}

                        {city.visitors}{' '}
                        visiteur
                        {city.visitors >
                        1
                          ? 's'
                          : ''}
                      </Tooltip>


                      <Popup>

                        <div className="min-w-[240px]">

                          <h3 className="mb-3 text-lg font-black text-[#002B49]">
                            📍 {city.city}
                          </h3>


                          <div className="space-y-2 text-sm">

                            <p>
                              <strong>
                                Pays :
                              </strong>{' '}
                              {city.country}
                            </p>

                            <p>
                              <strong>
                                Région :
                              </strong>{' '}
                              {city.region}
                            </p>

                            <p>
                              <strong>
                                Visiteurs :
                              </strong>{' '}
                              {city.visitors}
                            </p>

                            <p className="font-bold text-green-600">
                              🟢 En ligne :{' '}
                              {city.online}
                            </p>

                            <p>
                              <strong>
                                Latitude :
                              </strong>{' '}
                              {city.latitude.toFixed(
                                6
                              )}
                            </p>

                            <p>
                              <strong>
                                Longitude :
                              </strong>{' '}
                              {city.longitude.toFixed(
                                6
                              )}
                            </p>

                          </div>

                        </div>

                      </Popup>

                    </CircleMarker>

                  );

                }
              )}


            {/* ==================================================
                MODE VISITEURS
            ================================================== */}

            {displayMode ===
              'visitors' &&

              latestVisitors.map(
                (
                  visitor,
                  index
                ) => {

                  const latitude =
                    Number(
                      visitor.latitude
                    );

                  const longitude =
                    Number(
                      visitor.longitude
                    );

                  const id =
                    visitor.visitor_id ||
                    visitor.id ||
                    index;

                  const isOnline =
                    onlineIds.has(
                      id
                    );

                  return (

                    <CircleMarker
                      key={`${id}-${index}`}
                      center={[
                        latitude,
                        longitude
                      ]}
                      radius={
                        isOnline
                          ? 10
                          : 7
                      }
                      pathOptions={{
                        color:
                          isOnline
                            ? '#15803d'
                            : '#1d4ed8',

                        fillColor:
                          isOnline
                            ? '#22c55e'
                            : '#3b82f6',

                        fillOpacity:
                          0.85,

                        weight: 3
                      }}
                    >

                      <Popup>

                        <div className="min-w-[230px]">

                          <h3 className="mb-3 font-black text-[#002B49]">
                            👤 Visiteur
                          </h3>

                          <div className="space-y-2 text-sm">

                            <p>
                              <strong>
                                Ville :
                              </strong>{' '}
                              {visitor.city ||
                                'Inconnue'}
                            </p>

                            <p>
                              <strong>
                                Pays :
                              </strong>{' '}
                              {visitor.country ||
                                'Inconnu'}
                            </p>

                            <p>
                              <strong>
                                Région :
                              </strong>{' '}
                              {visitor.region ||
                                'Inconnue'}
                            </p>

                            <p>
                              <strong>
                                Latitude :
                              </strong>{' '}
                              {latitude.toFixed(
                                6
                              )}
                            </p>

                            <p>
                              <strong>
                                Longitude :
                              </strong>{' '}
                              {longitude.toFixed(
                                6
                              )}
                            </p>

                            {visitor.location_accuracy !=
                              null && (

                              <p>
                                <strong>
                                  Précision :
                                </strong>{' '}
                                ±
                                {Number(
                                  visitor.location_accuracy
                                ).toFixed(
                                  0
                                )}{' '}
                                m
                              </p>

                            )}

                            <p>
                              <strong>
                                Page :
                              </strong>{' '}
                              {visitor.page_path ||
                                '/'}
                            </p>

                            <p>
                              <strong>
                                Heure :
                              </strong>{' '}
                              {formatDate(
                                visitor.client_time ||
                                  visitor.visited_at
                              )}
                            </p>

                            <p
                              className={
                                isOnline
                                  ? 'font-bold text-green-600'
                                  : 'font-bold text-slate-500'
                              }
                            >
                              {isOnline
                                ? '🟢 En ligne'
                                : '🔵 Visiteur'}
                            </p>

                          </div>

                        </div>

                      </Popup>

                    </CircleMarker>

                  );

                }
              )}

          </MapContainer>

        </div>

      )}


      {/* ======================================================
          LISTE DES VILLES
      ====================================================== */}

      {cityStats.length >
        0 && (

        <div className="mt-5">

          <h3 className="mb-3 font-black text-[#002B49]">
            📍 Villes détectées
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {cityStats.map(
              (city) => (

                <div
                  key={`${city.city}-list`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >

                  <div className="flex items-center justify-between">

                    <p className="font-black text-[#002B49]">
                      {city.city}
                    </p>

                    <span className="rounded-full bg-[#002B49] px-3 py-1 text-xs font-black text-white">
                      {city.visitors}
                    </span>

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {city.country}
                  </p>

                  <p className="mt-1 text-xs font-bold text-green-600">
                    🟢 {city.online} en ligne
                  </p>

                </div>

              )
            )}

          </div>

        </div>

      )}

    </section>
  );
}