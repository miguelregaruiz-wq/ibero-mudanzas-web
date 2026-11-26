
"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  useMap,
} from "react-leaflet";


type Coordinates = [number, number];

type AddressOption = {
  label: string;
  coordinates: Coordinates;
};

function MapUpdater({
  origin,
  destination,
}: {
  origin: Coordinates | null;
  destination: Coordinates | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (origin && destination) {
      map.fitBounds([origin, destination], { padding: [45, 45] });
    } else if (origin) {
      map.setView(origin, 15);
    } else if (destination) {
      map.setView(destination, 15);
    }
  }, [origin, destination, map]);

  return null;
}


function AddressSearch({
  label,
  name,
  value,
  onChange,
  onSelect,
  selected,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: AddressOption) => void;
  selected: Coordinates | null;
}) {
  const [suggestions, setSuggestions] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (value.trim().length < 3 || selected) {
      setSuggestions([]);
      setOpen(false);
      setErrorMessage("");
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const params = new URLSearchParams({
  q: value.trim(),
  limit: "6",
  lat: "37.3",
  lon: "-6.0",
});

        const response = await fetch(
          `https://photon.komoot.io/api/?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`El servicio de direcciones respondió con el código ${response.status}`);
        }

        const result = await response.json();

        const features = Array.isArray(result.features)
          ? result.features
          : [];

        const options: AddressOption[] = features
          .filter((feature: any) =>
            feature.geometry?.coordinates?.length === 2
          )
          .map((feature: any) => {
            const p = feature.properties || {};

            const street = [
              p.street,
              p.housenumber,
            ].filter(Boolean).join(" ");

            const locality =
              p.city ||
              p.town ||
              p.village ||
              p.locality ||
              p.district ||
              p.county;

            const label = [
              street || p.name,
              p.postcode,
              locality,
              p.state,
              p.country,
            ]
              .filter(Boolean)
              .join(", ");

            return {
              label,
              coordinates: [
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0],
              ] as Coordinates,
            };
          })
          .filter((option: AddressOption) => option.label);

        setSuggestions(options);
        setOpen(options.length > 0);

        if (options.length === 0) {
          setErrorMessage("No se han encontrado direcciones. Prueba a añadir la localidad.");
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error buscando dirección:", error);
          setErrorMessage("No se ha podido conectar con el servicio de direcciones.");
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, selected]);

  return (
    <div className="address-autocomplete">
      <label className="field">
        <span>{label}</span>
        <input
          name={name}
          value={value}
          placeholder="Empieza a escribir la dirección..."
          autoComplete="off"
          required
          onChange={(event) => {
            onChange(event.target.value);
            onSelect({ label: "", coordinates: [0, 0] });
            setErrorMessage("");
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
        />
        {loading && <small>Buscando direcciones...</small>}
        {errorMessage && <small className="address-error">{errorMessage}</small>}
      </label>

      {open && suggestions.length > 0 && (
        <div className="address-suggestions">
          {suggestions.map((option, index) => (
            <button
              type="button"
              key={`${option.label}-${index}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.label);
                onSelect(option);
                setSuggestions([]);
                setOpen(false);
              }}
            >
              <span>⌖</span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


export default function AddressMapFields() {
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [route, setRoute] = useState<Coordinates[]>([]);
  const [routeInfo, setRouteInfo] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (!origin || !destination) {
  setRoute([]);
  setRouteInfo("");
  setRouteLoading(false);
  return;
}
const routeOrigin = origin;
    const routeDestination = destination;
    const controller = new AbortController();

    async function calculateRoute() {
      try {
        setRouteLoading(true);

                const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${routeOrigin[1]},${routeOrigin[0]};${routeDestination[1]},${routeDestination[0]}` +
          "?overview=full&geometries=geojson";
          
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("No se pudo calcular la ruta");

        const result = await response.json();
        const selectedRoute = result.routes?.[0];

        if (!selectedRoute) throw new Error("No se encontró una ruta");

        setRoute(
          selectedRoute.geometry.coordinates.map(
            ([longitude, latitude]: [number, number]) =>
              [latitude, longitude] as Coordinates
          )
        );

        
const km = selectedRoute.distance / 1000;
const totalMinutes = Math.round(selectedRoute.duration / 60);

const hours = Math.floor(totalMinutes / 60);
const minutes = totalMinutes % 60;

const durationText =
  hours > 0
    ? `${hours} h ${minutes} min`
    : `${minutes} min`;

setRouteInfo(
  `${km.toFixed(1)} km · ${durationText} aproximadamente`
);

      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setRouteInfo("No se ha podido calcular la ruta en este momento.");
        }
      } finally {
        setRouteLoading(false);
      }
    }

    calculateRoute();


    return () => controller.abort();
  }, [origin, destination]);

  return (
    <>
      {/* PUNTO DE ORIGEN */}
      <div className="form-section">
        <div className="section-heading">
          <span className="step-dot">1</span>
          <h3>Punto de origen</h3>
        </div>

        <div className="field-grid">
          <AddressSearch
            label="Dirección completa"
            name="originAddress"
            value={originText}
            onChange={setOriginText}
            onSelect={(option) =>
              setOrigin(option.label ? option.coordinates : null)
            }
            selected={origin}
          />

          <label className="field">
            <span>Tipo de inmueble</span>
            <input
              name="originProperty"
              placeholder="Piso 3 hab 2.º piso"
              required
            />
          </label>
        </div>

        <div className="inline-options">
          <label className="check">
            <input type="checkbox" name="originElevator" />
            Dispone de ascensor
          </label>

          <label className="check">
            <input type="checkbox" name="originAssembly" />
            Desmontaje y montaje
          </label>

          <label className="check">
            <input type="checkbox" name="originPacking" />
            Servicio de embalaje
          </label>
        </div>

        <p className="field-note">
          Selecciona una dirección de las sugerencias para situarla en el mapa.
        </p>
      </div>

      {/* PUNTO DE DESTINO */}
      <div className="form-section">
        <div className="section-heading">
          <span className="step-dot">2</span>
          <h3>Punto de destino</h3>
        </div>

        <div className="field-grid">
          <AddressSearch
            label="Dirección completa"
            name="destinationAddress"
            value={destinationText}
            onChange={setDestinationText}
            onSelect={(option) =>
              setDestination(option.label ? option.coordinates : null)
            }
            selected={destination}
          />

          <label className="field">
            <span>Tipo de inmueble</span>
            <input
              name="destinationProperty"
              placeholder="Piso 3 habitaciones"
              required
            />
          </label>
        </div>

        <div className="inline-options">
          <label className="check">
            <input type="checkbox" name="destinationElevator" />
            Dispone de ascensor
          </label>

          <label className="check">
            <input type="checkbox" name="destinationAssembly" />
            Desmontaje y montaje
          </label>

          <label className="check">
            <input type="checkbox" name="destinationPacking" />
            Servicio de embalaje
          </label>
        </div>

        <p className="field-note">
          Selecciona también la dirección de destino en las sugerencias.
        </p>
      </div>

      {/* MAPA Y RECORRIDO */}
      <div className="moving-map-section">
        <div className="map-heading">
          <div>
            <strong>TU MUDANZA, SOBRE EL MAPA</strong>
            <p>Visualiza el recorrido entre el origen y el destino.</p>
          </div>

          {routeLoading && (
            <span>Calculando recorrido...</span>
          )}
        </div>

        {/* ÚNICO MAPA */}
        <MapContainer
          center={[37.3, -6.0]}
          zoom={8}
          scrollWheelZoom={false}
          className="moving-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {origin && (
            <CircleMarker
              center={origin}
              radius={9}
              pathOptions={{
                color: "#fff",
                weight: 3,
                fillColor: "#26834a",
                fillOpacity: 1,
              }}
            />
          )}

          {destination && (
            <CircleMarker
              center={destination}
              radius={9}
              pathOptions={{
                color: "#fff",
                weight: 3,
                fillColor: "#c33d35",
                fillOpacity: 1,
              }}
            />
          )}

          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                color: "#b28f45",
                weight: 5,
              }}
            />
          )}

          <MapUpdater
            origin={origin}
            destination={destination}
          />
        </MapContainer>

        {/* DIRECCIONES */}
        <div className="route-summary">
          <div className="route-address">
            <span className="route-point origin-dot" />

            <div>
              <small>PUNTO DE ORIGEN</small>
              <p>{originText || "Pendiente de seleccionar"}</p>
            </div>
          </div>

          <div className="route-address">
            <span className="route-point destination-dot" />

            <div>
              <small>PUNTO DE DESTINO</small>
              <p>{destinationText || "Pendiente de seleccionar"}</p>
            </div>
          </div>
        </div>

        {/* DISTANCIA Y DURACIÓN */}
        <div className="route-metrics">
          <div className="route-metric">
            <span className="metric-icon">↗</span>

            <div>
              <small>DISTANCIA</small>

              <strong>
                {routeInfo && routeInfo.includes(" km")
                  ? routeInfo.split(" km")[0] + " km"
                  : "Pendiente"}
              </strong>
            </div>
          </div>

          <div className="route-metric">
            <span className="metric-icon">◷</span>

            <div>
              <small>DURACIÓN ESTIMADA</small>

              <strong>
                {routeInfo && routeInfo.includes("·")
                  ? routeInfo.split("·")[1].trim()
                  : "Pendiente"}
              </strong>
            </div>
          </div>
        </div>

        <p className="map-disclaimer">
          Distancia y duración aproximadas según el recorrido por carretera.
          El tiempo real puede variar según el tráfico y las condiciones del trayecto.
        </p>
      </div>
    </>
  );
}
