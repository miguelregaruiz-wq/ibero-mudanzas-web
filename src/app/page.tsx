"use client";

import { FormEvent, useMemo, useState } from "react";

type InventoryItem = { name: string; quantity: number };

import dynamic from "next/dynamic";

const AddressMapFields = dynamic(
  () => import("./components/AddressMapFields"),
  {
    ssr: false,
    loading: () => <p>Cargando mapa...</p>,
  }
);

const inventoryGroups = [
  { title: "Salón", items: ["Sofá", "Sillón", "Mesa de centro", "Mesa de comedor", "Sillas", "Mueble de TV", "Televisor", "Estantería"] },
  { title: "Dormitorio", items: ["Cama individual", "Cama doble", "Colchón", "Mesita", "Cómoda", "Armario", "Escritorio"] },
  { title: "Cocina", items: ["Frigorífico", "Lavadora", "Lavavajillas", "Horno", "Microondas", "Mesa", "Sillas"] },
  { title: "Cajas y otros", items: ["Caja pequeña", "Caja mediana", "Caja grande", "Maleta", "Bicicleta", "Planta", "Otros bultos"] },
];


const workItems = [
  {
    id: 1,
    number: "01",
    category: "MUDANZAS DE VIVIENDAS",
    title: "Un nuevo hogar comienza aquí.",
    description: "Mudanzas de pisos, casas y chalets. Cuidamos cada pertenencia durante todo el traslado.",
    detail: "MUDANZAS PARA PARTICULARES",
    icon: "⌂",
  },
  {
    id: 2,
    number: "02",
    category: "OFICINAS Y NEGOCIOS",
    title: "Tu negocio, en su nuevo espacio.",
    description: "Traslados de oficinas, mobiliario y equipos profesionales con planificación adaptada.",
    detail: "MUDANZAS PARA EMPRESAS",
    icon: "▤",
  },
  {
    id: 3,
    number: "03",
    category: "MUEBLES Y OBJETOS ESPECIALES",
    title: "Cada objeto merece un cuidado especial.",
    description: "Transporte de muebles y objetos voluminosos, prestando atención a su protección y manipulación.",
    detail: "TRANSPORTE Y PROTECCIÓN",
    icon: "◇",
  },
  {
    id: 4,
    number: "04",
    category: "MUDANZAS NACIONALES E INTERNACIONALES",
    title: "Llegamos contigo más lejos.",
    description: "Organizamos traslados entre localidades, provincias y países, adaptándonos a cada proyecto.",
    detail: "TRASLADOS A CUALQUIER DESTINO",
    icon: "↗",
  },
];


function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function AddressFields({ title, prefix }: { title: string; prefix: "origin" | "destination" }) {
  return (
    <div className="form-section">
      <div className="section-heading"><span className="step-dot">{prefix === "origin" ? "1" : "2"}</span><h3>{title}</h3></div>
      <div className="field-grid">
        <Field label="Dirección completa">
          <input name={`${prefix}Address`} placeholder="Calle, número, código postal, ciudad" required />
        </Field>
        <Field label="Tipo de inmueble">
          <input name={`${prefix}Property`} placeholder="Piso 3 hab 2.º piso" required />
        </Field>
      </div>
      <div className="inline-options">
        <label className="check"><input type="checkbox" name={`${prefix}Elevator`} /> Dispone de ascensor</label>
        <label className="check"><input type="checkbox" name={`${prefix}Assembly`} /> Desmontaje y montaje</label>
        <label className="check"><input type="checkbox" name={`${prefix}Packing`} /> Servicio de embalaje</label>
      </div>
      <p className="field-note">Marca «Dispone de ascensor» únicamente si el inmueble tiene ascensor.</p>
    </div>
  );
}

export default function Home() {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [activeWork, setActiveWork] = useState(0);

function changeWork(direction: number) {
  setActiveWork((current) =>
    (current + direction + workItems.length) % workItems.length
  );
}
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [extraItems, setExtraItems] = useState("");

  const selectedItems = useMemo(
    () => Object.entries(inventory).filter(([, quantity]) => quantity > 0),
    [inventory],
  );

  function updateQuantity(name: string, quantity: number) {
    setInventory((current) => ({ ...current, [name]: Math.max(0, quantity) }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setFeedback("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("serviceType", "mudanza");
    const list: InventoryItem[] = selectedItems.map(([name, quantity]) => ({ name, quantity }));
    formData.set("inventory", JSON.stringify(list));
    formData.set("extraItems", extraItems);
    if (files) Array.from(files).forEach((file) => formData.append("photos", file));

    try {
      const response = await fetch("/api/presupuesto", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se ha podido enviar la solicitud.");
      setFeedback("Solicitud enviada correctamente. Nos pondremos en contacto contigo lo antes posible.");
      form.reset();
      setInventory({});
      setFiles(null);
      setExtraItems("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Ha ocurrido un error al enviar el formulario.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Ibero Mudanzas, inicio">
          <span className="brand-mark">
  <img
    className="brand-logo"
    src="/logo-iberomudanzas.ico"
    alt="Logotipo de Ibero Mudanzas"
  />
</span>
          <span className="brand-name">IBERO <b>MUDANZAS</b><small>MUDANZAS NACIONALES E INTERNACIONALES</small></span>
        </a>
        <nav className="desktop-nav">
          <a href="#quienes-somos">Quiénes somos</a><a href="#servicios">Servicios</a><a href="#presupuesto">Presupuesto</a><a href="#trabajos">Nuestros trabajos</a><a href="#resenas">Reseñas</a><a href="#contacto">Contacto</a>
        </nav>
        <a className="header-cta" href="#presupuesto">Pedir presupuesto <span>↗</span></a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow"><span /> MUDANZAS NACIONALES E INTERNACIONALES</p>
          <h1>Tu mudanza.<br /><em>Nuestro compromiso.</em></h1>
          <p className="hero-copy">Cuidamos tus pertenencias en cada etapa. Soluciones profesionales de mudanza para hogares y empresas.</p>
          <div className="hero-actions"><a className="button button-gold" href="#presupuesto">Solicitar presupuesto <span>↗</span></a><a className="text-link" href="#servicios">Descubrir servicios <span>↓</span></a></div>
          <div className="hero-proof"><span className="proof-line" /> CUIDAMOS CADA DETALLE DE TU MUDANZA</div>
        </div>
        <div className="hero-label"><b>IBERO</b><span>MUDANZAS</span></div>
      </section>

      <section className="trust-strip">
        <div><b>01</b><span>Atención personalizada</span></div><div><b>02</b><span>Planificación a medida</span></div><div><b>03</b><span>Alcance nacional e internacional</span></div><div><b>04</b><span>Cuidado de tus pertenencias</span></div>
      </section>

      <section className="intro section-wrap" id="quienes-somos">
        <div className="intro-image"><div className="image-caption">CADA MUDANZA, UNA NUEVA HISTORIA</div></div>
        <div className="intro-copy"><p className="eyebrow dark">QUIÉNES SOMOS</p><h2>Mucho más que<br /><em>una mudanza.</em></h2><p>En Ibero Mudanzas ayudamos a particulares y empresas a trasladar sus hogares, oficinas y pertenencias, dentro y fuera de España.</p><p>Nos ocupamos de cada etapa de la mudanza con cercanía, planificación y atención al detalle, para que tú puedas centrarte en lo importante.</p><a className="underlined-link" href="#presupuesto">Cuéntanos qué necesitas <span>↗</span></a></div>
      </section>

      <section className="services-section" id="servicios">
        <div className="section-wrap"><div className="section-top"><div><p className="eyebrow">QUÉ HACEMOS</p><h2>Nos ocupamos de<br /><em>cada detalle.</em></h2></div><p className="section-intro">Organizamos tu mudanza de principio a fin, adaptándonos a tu vivienda, volumen de enseres, accesos y necesidades.</p></div>
          <div className="service-grid">
            <article className="service-card service-main"><div className="service-number">01 / MUDANZAS</div><h3>Empezar en<br />un nuevo lugar.</h3><p>Mudanzas de viviendas, pisos, chalets, oficinas y empresas, en ámbito nacional e internacional.</p><a href="#presupuesto">Solicitar presupuesto <span>↗</span></a></article>
            <article className="service-card service-clear"><div className="service-number">02 / RETIRADA Y VACIADO</div><h3>Espacio para<br />lo que viene.</h3><p>Retirada y vaciado de mobiliario y enseres de viviendas, locales y oficinas como servicio complementario.</p><a href="#presupuesto">Solicitar presupuesto <span>↗</span></a></article>
            <article className="service-card service-extra"><div className="service-number">03 / SERVICIOS COMPLEMENTARIOS</div><h3>Nos ocupamos<br />de los detalles.</h3><p>Embalaje, protección de enseres, desmontaje y montaje de muebles para facilitar tu mudanza.</p><a href="#presupuesto">Solicitar presupuesto <span>↗</span></a></article>
          </div>
        </div>
      </section>

      <section className="quote-section" id="presupuesto">
        <div className="section-wrap">
          <div className="quote-heading"><p className="eyebrow dark">EMPECEMOS A PLANIFICAR</p><h2>Cuéntanos cómo<br /><em>será tu mudanza.</em></h2><p>Completa los datos y estudiaremos tu mudanza para preparar una propuesta adaptada a tus necesidades.</p></div>
          <div className="quote-card">
            <form onSubmit={submitForm}>
              <div className="form-section">
                <div className="section-heading"><span className="step-dot">0</span><h3>Tus datos de contacto</h3></div>
                <div className="field-grid three">
                  <Field label="Nombre y apellidos"><input name="customerName" placeholder="Tu nombre" required /></Field>
                  <Field label="Teléfono"><input name="phone" type="tel" placeholder="+34 600 000 000" required /></Field>
                  <Field label="Correo electrónico"><input name="email" type="email" placeholder="nombre@correo.com" required /></Field>
                </div>
              </div>

              <AddressMapFields />

              <div className="form-section">
                <div className="section-heading"><span className="step-dot">3</span><h3>Inventario de enseres</h3></div>
                <p className="field-note">Indica las cantidades aproximadas. Puedes añadir cualquier otro elemento y adjuntar fotografías.</p>
                <div className="inventory-groups">
                  {inventoryGroups.map((group) => <div className="inventory-group" key={group.title}><h4>{group.title}</h4><div className="inventory-list">{group.items.map((item) => <div className="inventory-row" key={item}><span>{item}</span><input aria-label={`Cantidad de ${item}`} type="number" min="0" max="999" value={inventory[item] || ""} placeholder="0" onChange={(e) => updateQuantity(item, Number(e.target.value))} /></div>)}</div></div>)}
                </div>
                <Field label="Otros enseres / descripción adicional"><textarea rows={3} value={extraItems} onChange={(e) => setExtraItems(e.target.value)} placeholder="Describe aquí cualquier mueble, objeto o enser que no aparezca en el inventario..." /></Field>
                <Field label="Fotografías de los enseres" hint="Puedes seleccionar varias imágenes. Máximo recomendado: 8 MB por archivo."><input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} /></Field>
                {selectedItems.length > 0 && <div className="inventory-summary"><b>Resumen del inventario</b><p>{selectedItems.map(([name, quantity]) => `${name} × ${quantity}`).join(" · ")}</p></div>}
              </div>

              <div className="form-section">
                <div className="section-heading"><span className="step-dot">4</span><h3>Detalles de la mudanza</h3></div>
                <div className="field-grid"><Field label="Fecha aproximada"><input name="movingDate" type="date" /></Field><Field label="Información adicional"><input name="movingNotes" placeholder="Horario, accesos, necesidades especiales..." /></Field></div>
              </div>

              <div className="form-footer"><p>Al enviar este formulario aceptas que contactemos contigo para atender tu solicitud. Consulta nuestra política de privacidad.</p><button className="button button-gold submit-button" type="submit" disabled={sending}>{sending ? "Enviando..." : "Solicitar presupuesto"} <span>↗</span></button></div>
              {feedback && <p className={feedback.startsWith("Solicitud") ? "form-feedback success" : "form-feedback error"} role="status">{feedback}</p>}
            </form>
          </div>
          <aside className="route-note"><div className="route-icon">⌖</div><div><b>¿Cómo planificamos tu mudanza?</b><p>Con las direcciones y los detalles que nos facilites podremos estudiar el recorrido, los accesos a los inmuebles, el volumen de enseres y los servicios que necesitas. El recorrido se visualizará mediante OpenStreetMap para ayudarte a planificar tu mudanza.</p></div></aside>
        </div>
      </section>



<section className="work-section" id="trabajos">
  <div className="section-wrap">

    <div className="section-top">
      <div>
        <p className="eyebrow">NUESTRO TRABAJO</p>
        <h2>
          Cada mudanza,
          <br />
          <em>una nueva historia.</em>
        </h2>
      </div>

      <p className="section-intro">
        Descubre los diferentes servicios que realizamos.
        Desliza nuestra galería y conoce todo lo que podemos
        hacer por ti.
      </p>
    </div>

    <div className="work-carousel">

      <button
        type="button"
        className="work-arrow work-arrow-left"
        onClick={() => changeWork(-1)}
        aria-label="Trabajo anterior"
      >
        ‹
      </button>

      <div className="work-track">
        {[-1, 0, 1].map((offset) => {
          const index =
            (activeWork + offset + workItems.length) % workItems.length;

          const item = workItems[index];

          return (
            <article
              key={item.id}
              className={`work-slide ${
                offset === 0
                  ? "is-active"
                  : offset === -1
                    ? "is-prev"
                    : "is-next"
              }`}
            >
              <div className="work-slide-content">

                <span className="work-slide-number">
                  {item.number} / 04
                </span>

                <div className="work-slide-icon">
                  {item.icon}
                </div>

                <span className="work-slide-category">
                  {item.category}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <span className="work-slide-detail">
                  {item.detail}
                </span>

                {offset === 0 && (
                  <a
                    className="work-slide-link"
                    href="#presupuesto"
                  >
                    Solicitar presupuesto ↗
                  </a>
                )}

              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="work-arrow work-arrow-right"
        onClick={() => changeWork(1)}
        aria-label="Trabajo siguiente"
      >
        ›
      </button>

    </div>

    <div className="work-carousel-footer">
      <span>
        {String(activeWork + 1).padStart(2, "0")}
        <span className="work-counter-separator"> / </span>
        {String(workItems.length).padStart(2, "0")}
      </span>

      <div className="work-dots">
        {workItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === activeWork ? "active" : ""}
            onClick={() => setActiveWork(index)}
            aria-label={`Mostrar ${item.category}`}
          />
        ))}
      </div>

      <span className="work-swipe-label">
        EXPLORA NUESTROS SERVICIOS
      </span>
    </div>

  </div>
</section>

      <section className="reviews-section" id="resenas"><div className="section-wrap reviews-inner"><div><p className="eyebrow dark">LA CONFIANZA SE CONSTRUYE</p><h2>Lo importante<br /><em>es tu experiencia.</em></h2><p>Las opiniones de nuestros clientes ayudan a otras personas a elegir con confianza.</p></div><div className="review-placeholder"><div className="google-word">Google</div><div className="stars">★★★★★</div><h3>Opiniones de nuestros clientes</h3><p>Conectaremos aquí las reseñas reales del perfil de empresa de Ibero Mudanzas en Google.</p><span className="review-tag">RESEÑAS VERIFICADAS · PENDIENTE DE CONECTAR</span></div></div></section>

      
<section className="contact-section" id="contacto">
  <div className="section-wrap">
    <div className="contact-heading">
      <p className="eyebrow">ESTAMOS A TU DISPOSICIÓN</p>
      <h2>
        Hablemos de<br />
        <em>tu próxima mudanza.</em>
      </h2>
      <p>
        ¿Tienes alguna pregunta o necesitas más información?
        Contacta con nosotros. Estaremos encantados de ayudarte.
      </p>
    </div>

    <div className="contact-grid">
      <div className="contact-info">
        <h3>Contacta con nuestro equipo</h3>

        <a className="contact-item" href="tel:+34644860960">
          <span className="contact-icon">☎</span>
          <span>
            <small>LLÁMANOS</small>
            <strong>644 86 09 60</strong>
          </span>
        </a>

        <a
          className="contact-item"
          href="https://wa.me/34644860960"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="contact-icon">◉</span>
          <span>
            <small>WHATSAPP</small>
            <strong>644 86 09 60</strong>
          </span>
        </a>

        <a
          className="contact-item"
          href="mailto:iberomudanzas@hotmail.com"
        >
          <span className="contact-icon">✉</span>
          <span>
            <small>ESCRÍBENOS</small>
            <strong>iberomudanzas@hotmail.com</strong>
          </span>
        </a>
<a
  className="contact-item"
  href="https://www.google.com/maps/search/?api=1&query=Calle+Arquitectura+6+Torre+9+41015+Sevilla"
  target="_blank"
  rel="noopener noreferrer"
>
  <span className="contact-icon">⌖</span>
  <span>
    <small>VISÍTANOS</small>
    <strong>Calle Arquitectura, 6, Torre 9</strong>
    <span>Distrito Norte, 41015 Sevilla</span>
    <small className="contact-map-link">Cómo llegar ↗</small>
  </span>
</a>
        <div className="contact-item contact-hours">
          <span className="contact-icon">◷</span>
          <span>
            <small>HORARIO DE ATENCIÓN</small>
            <strong>Lunes a viernes</strong>
            <span>08:00 – 14:00</span>
            <span>16:00 – 20:00</span>
          </span>
        </div>

        <div className="contact-socials">
          <span>SÍGUENOS EN REDES SOCIALES</span>

          <a
            href="https://www.instagram.com/iberomudanzas/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram · @iberomudanzas
          </a>

          <a
            href="https://www.facebook.com/portesmudanzasnacional"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook · Ibero Mudanzas
          </a>
        </div>
      </div>

      <div className="contact-action">
        <div className="contact-action-content">
          <span className="contact-action-number">IBERO MUDANZAS</span>
          <h3>Estamos aquí para ayudarte.</h3>
          <p>
            Cada mudanza es diferente. Cuéntanos qué necesitas
            y prepararemos una propuesta adaptada a ti.
          </p>

          <a className="button button-gold" href="#presupuesto">
            Solicitar presupuesto <span>↗</span>
          </a>

          <a
            className="contact-whatsapp-link"
            href="https://wa.me/34644860960"
            target="_blank"
            rel="noopener noreferrer"
          >
            O escríbenos directamente por WhatsApp ↗
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<a
  className="floating-whatsapp"
  href="https://wa.me/34644860960"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Contactar con Ibero Mudanzas por WhatsApp"
  title="Contactar por WhatsApp"
>
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2.1 7L3 29l6.4-2.1a13.2 13.2 0 0 0 6.6 1.7h.1c7.1 0 12.9-5.8 12.9-12.9A12.9 12.9 0 0 0 16 3zm0 23.4h-.1c-2 0-4-.5-5.7-1.6l-.4-.2-3.8 1.2 1.2-3.7-.2-.4a10.6 10.6 0 0 1-1.7-5.8C5.3 10.1 10.1 5.3 16 5.3c2.8 0 5.5 1.1 7.5 3.1a10.5 10.5 0 0 1 3.1 7.5c0 5.8-4.8 10.5-10.6 10.5zm5.8-7.9c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.2 3.2c.1.2 2.2 3.4 5.3 4.8.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"
    />
  </svg>
</a>

      <footer className="footer"><a className="brand footer-brand" href="#inicio"><span className="brand-mark">
  <img
    className="brand-logo"
    src="/logo-iberomudanzas.ico"
    alt="Logotipo de Ibero Mudanzas"
  />
</span><span className="brand-name">IBERO <b>MUDANZAS</b><small>MUDANZAS NACIONALES E INTERNACIONALES</small></span></a><span>© {new Date().getFullYear()} Ibero Mudanzas. Todos los derechos reservados.</span><div><a href="#contacto">Contacto</a><a href="#inicio">Volver arriba ↑</a></div></footer>
    </main>
  );
}
