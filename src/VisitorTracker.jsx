import { useEffect } from 'react';
import { supabase } from './supabase';

const IP_GEO_URL = 'https://ipapi.co/json/';
const REVERSE_GEO_URL =
  'https://api.bigdatacloud.net/data/reverse-geocode-client';

export default function VisitorTracker() {
  useEffect(() => {
    let active = true;

    // =========================================================
    // 1. IDENTIFIANT DU VISITEUR
    // =========================================================

    let visitorId = localStorage.getItem('erdikoudi_visitor_id');

    if (!visitorId) {
      visitorId =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      localStorage.setItem('erdikoudi_visitor_id', visitorId);
    }

    // =========================================================
    // 2. INFORMATIONS DU NAVIGATEUR
    // =========================================================

    const userAgent = navigator.userAgent;

    const browserTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'Africa/Ndjamena';

    // Heure exacte du visiteur au moment de la visite
    const clientTime = new Date().toISOString();

    // =========================================================
    // 3. GÉOLOCALISATION PAR IP - SECOURS
    // =========================================================

    const getIPLocation = async () => {
      try {
        const response = await fetch(IP_GEO_URL);

        if (!response.ok) {
          throw new Error('Impossible de récupérer la localisation IP');
        }

        const data = await response.json();

        return {
          country: data.country_name || null,
          country_code: data.country_code || null,
          city: data.city || null,
          region: data.region || null,
          latitude: data.latitude
            ? Number(data.latitude)
            : null,
          longitude: data.longitude
            ? Number(data.longitude)
            : null,
          timezone: data.timezone || browserTimezone,
          org: data.org || null,
          accuracy: null,
          source: 'ip',
        };
      } catch (error) {
        console.warn(
          'Localisation IP indisponible :',
          error.message
        );

        return {
          country: null,
          country_code: null,
          city: null,
          region: null,
          latitude: null,
          longitude: null,
          timezone: browserTimezone,
          org: null,
          accuracy: null,
          source: 'unknown',
        };
      }
    };

    // =========================================================
    // 4. GPS DU TÉLÉPHONE / PC
    // =========================================================

    const getGPSLocation = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = position.coords;

            resolve({
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
            });
          },
          (error) => {
            console.warn(
              'GPS non disponible ou permission refusée :',
              error.message
            );

            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

    // =========================================================
    // 5. TRANSFORMER GPS → VILLE / PAYS
    // =========================================================

    const reverseGeocode = async (
      latitude,
      longitude
    ) => {
      try {
        const url =
          `${REVERSE_GEO_URL}` +
          `?latitude=${encodeURIComponent(latitude)}` +
          `&longitude=${encodeURIComponent(longitude)}` +
          `&localityLanguage=fr`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            'Reverse geocoding indisponible'
          );
        }

        const data = await response.json();

        return {
          country:
            data.countryName ||
            data.countryNameEn ||
            null,

          country_code:
            data.countryCode || null,

          city:
            data.city ||
            data.localityName ||
            data.locality ||
            null,

          region:
            data.principalSubdivision ||
            null,

          latitude:
            Number.isFinite(Number(data.latitude))
              ? Number(data.latitude)
              : latitude,

          longitude:
            Number.isFinite(Number(data.longitude))
              ? Number(data.longitude)
              : longitude,

          timezone: browserTimezone,

          org: null,
        };
      } catch (error) {
        console.warn(
          'Reverse geocoding impossible :',
          error.message
        );

        return null;
      }
    };

    // =========================================================
    // 6. OBTENIR LA MEILLEURE LOCALISATION
    // =========================================================

    const getBestLocation = async () => {
      // On essaie d'abord le GPS
      const gps = await getGPSLocation();

      if (gps) {
        const address = await reverseGeocode(
          gps.latitude,
          gps.longitude
        );

        if (address) {
          return {
            ...address,
            latitude: gps.latitude,
            longitude: gps.longitude,
            accuracy: gps.accuracy,
            source: 'gps',
          };
        }

        // Même si le reverse geocoding échoue,
        // on conserve les coordonnées GPS.
        return {
          country: null,
          country_code: null,
          city: null,
          region: null,
          latitude: gps.latitude,
          longitude: gps.longitude,
          timezone: browserTimezone,
          org: null,
          accuracy: gps.accuracy,
          source: 'gps',
        };
      }

      // GPS refusé → localisation IP
      return await getIPLocation();
    };

    // =========================================================
    // 7. ENREGISTRER UNE VISITE
    // =========================================================

    const registerVisit = async () => {
      if (!active) return;

      const pagePath =
        window.location.pathname || '/';

      /*
       * Protection contre les doubles insertions causées
       * notamment par React StrictMode en développement.
       */
      const visitLockKey =
        'erdikoudi_last_visit_lock';

      const now = Date.now();

      try {
        const previousVisit =
          JSON.parse(
            sessionStorage.getItem(visitLockKey) || 'null'
          );

        if (
          previousVisit &&
          previousVisit.path === pagePath &&
          now - previousVisit.time < 5000
        ) {
          return;
        }

        sessionStorage.setItem(
          visitLockKey,
          JSON.stringify({
            path: pagePath,
            time: now,
          })
        );

        // Localisation
        const location = await getBestLocation();

        if (!active) return;

        const { error } = await supabase
          .from('visitor_visits')
          .insert({
            visitor_id: visitorId,
            page_path: pagePath,

            country: location.country,
            country_code: location.country_code,
            city: location.city,
            region: location.region,

            latitude: location.latitude,
            longitude: location.longitude,

            timezone:
              location.timezone ||
              browserTimezone,

            org: location.org,

            user_agent: userAgent,

            location_accuracy:
              location.accuracy,

            location_source:
              location.source,

            client_time: clientTime,
          });

        if (error) {
          throw error;
        }

        console.log(
          'Visite enregistrée :',
          {
            ville: location.city,
            pays: location.country,
            latitude: location.latitude,
            longitude: location.longitude,
            précision: location.accuracy,
            source: location.source,
            heure: clientTime,
            timezone: browserTimezone,
          }
        );
      } catch (error) {
        console.error(
          'Erreur d’enregistrement de la visite :',
          error.message
        );
      }
    };

    // =========================================================
    // 8. SESSION / VISITEUR EN LIGNE
    // =========================================================

    const updateSession = async () => {
      if (!active) return;

      const pagePath =
        window.location.pathname || '/';

      const lastSeen =
        new Date().toISOString();

      try {
        const { data: existing, error: searchError } =
          await supabase
            .from('visitor_sessions')
            .select('id')
            .eq('visitor_id', visitorId)
            .limit(1)
            .maybeSingle();

        if (searchError) {
          throw searchError;
        }

        if (!existing) {
          const { error } = await supabase
            .from('visitor_sessions')
            .insert({
              visitor_id: visitorId,
              page_path: pagePath,
              last_seen: lastSeen,
            });

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('visitor_sessions')
            .update({
              page_path: pagePath,
              last_seen: lastSeen,
            })
            .eq('visitor_id', visitorId);

          if (error) throw error;
        }
      } catch (error) {
        console.error(
          'Erreur de suivi des sessions :',
          error.message
        );
      }
    };

    // =========================================================
    // 9. DÉMARRAGE
    // =========================================================

    registerVisit();
    updateSession();

    // Heartbeat toutes les 30 secondes
    const interval = setInterval(() => {
      updateSession();
    }, 30000);

    // =========================================================
    // 10. CHANGEMENT DE PAGE
    // =========================================================

    let lastPath =
      window.location.pathname;

    const pathChecker = setInterval(() => {
      const currentPath =
        window.location.pathname;

      if (
        currentPath !== lastPath
      ) {
        lastPath = currentPath;

        registerVisit();
        updateSession();
      }
    }, 1000);

    // =========================================================
    // NETTOYAGE
    // =========================================================

    return () => {
      active = false;

      clearInterval(interval);
      clearInterval(pathChecker);
    };
  }, []);

  return null;
}