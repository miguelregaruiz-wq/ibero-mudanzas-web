
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getValue(data: FormData, key: string) {
  return String(data.get(key) || "").trim();
}

function yesNo(data: FormData, key: string) {
  return data.has(key) ? "Sí" : "No";
}

function formatDate(value: string) {
  if (!value) return "No especificada";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 12px;color:#777;width:38%;border-bottom:1px solid #eee;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:10px 12px;color:#222;font-weight:600;border-bottom:1px solid #eee;">
        ${escapeHtml(value || "No indicado")}
      </td>
    </tr>`;
}

function section(title: string, content: string) {
  return `
    <h3 style="margin:28px 0 10px;color:#b58a3b;font-size:16px;">
      ${escapeHtml(title)}
    </h3>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;">
      ${content}
    </table>`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.QUOTE_TO_EMAIL;
    const from = process.env.QUOTE_FROM_EMAIL;

    if (!apiKey || !to || !from) {
      return NextResponse.json(
        { error: "El formulario todavía no está conectado al correo." },
        { status: 503 }
      );
    }

    const data = await request.formData();

    const serviceType = getValue(data, "serviceType");
    const customerName = getValue(data, "customerName");
    const email = getValue(data, "email");
    const phone = getValue(data, "phone");

    if (
      serviceType !== "mudanza" ||
      !customerName ||
      !email ||
      !phone
    ) {
      return NextResponse.json(
        { error: "Revisa los datos obligatorios del formulario." },
        { status: 400 }
      );
    }

    // Cargar el logotipo desde la carpeta public
    const logoPath = path.join(
      process.cwd(),
      "public",
      "logo-ibero-mudanzas-email.png"
    );

    let logoContent: string;

    try {
      const logoBuffer = await readFile(logoPath);
      logoContent = logoBuffer.toString("base64");
    } catch {
      console.error("No se encuentra el logotipo:", logoPath);

      return NextResponse.json(
        {
          error:
            "No se encuentra el logotipo. Comprueba que está en la carpeta public con el nombre correcto.",
        },
        { status: 500 }
      );
    }

    // Inventario
    let inventory: { name: string; quantity: number }[] = [];

    const inventoryData = data.get("inventory");

    if (inventoryData) {
      try {
        inventory = JSON.parse(String(inventoryData));

        if (!Array.isArray(inventory)) {
          throw new Error("Inventario inválido");
        }
      } catch {
        return NextResponse.json(
          { error: "No se ha podido leer el inventario." },
          { status: 400 }
        );
      }
    }

    // Direcciones
    const origin = [
      row("Dirección", getValue(data, "originAddress")),
      row("Tipo de inmueble", getValue(data, "originProperty")),
      row("Dispone de ascensor", yesNo(data, "originElevator")),
      row("Desmontaje y montaje", yesNo(data, "originAssembly")),
      row("Servicio de embalaje", yesNo(data, "originPacking")),
    ].join("");

    const destination = [
      row("Dirección", getValue(data, "destinationAddress")),
      row("Tipo de inmueble", getValue(data, "destinationProperty")),
      row("Dispone de ascensor", yesNo(data, "destinationElevator")),
      row("Desmontaje y montaje", yesNo(data, "destinationAssembly")),
      row("Servicio de embalaje", yesNo(data, "destinationPacking")),
    ].join("");

    // Inventario en HTML
    const inventoryHtml = inventory.length
      ? inventory
          .filter(item => item.name && Number(item.quantity) > 0)
          .map(item => row(item.name, `${item.quantity} unidades`))
          .join("")
      : row("Inventario", "No se han indicado elementos");

    const extraItems = getValue(data, "extraItems");
    const movingNotes = getValue(data, "movingNotes");
    const movingDate = formatDate(getValue(data, "movingDate"));

    // Fotografías del cliente
    const attachments: { filename: string; content: string }[] = [];
    let totalSize = 0;

    for (const entry of data.getAll("photos")) {
      if (!(entry instanceof File) || entry.size === 0) continue;

      if (!entry.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Solo se permiten fotografías." },
          { status: 400 }
        );
      }

      if (entry.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Cada fotografía debe ocupar como máximo 8 MB." },
          { status: 400 }
        );
      }

      totalSize += entry.size;

      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json(
          { error: "El conjunto de fotografías supera los 20 MB." },
          { status: 400 }
        );
      }

      const bytes = Buffer.from(await entry.arrayBuffer());

      attachments.push({
        filename: entry.name.replace(/[^\w.-]/g, "_"),
        content: bytes.toString("base64"),
      });
    }

    const html = `
      <div style="background:#f4f4f4;padding:30px 12px;font-family:Arial,sans-serif;color:#222;">
        <div style="max-width:650px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;">

          <div style="background:#000;padding:25px 30px;text-align:center;">
            <img
              src="cid:ibero-logo"
              alt="Ibero Mudanzas"
              width="300"
              style="display:block;width:100%;max-width:300px;height:auto;margin:0 auto;"
            />
            <p style="margin:18px 0 0;color:#d4ad61;font-size:12px;letter-spacing:1.5px;">
              NUEVA SOLICITUD DE PRESUPUESTO
            </p>
          </div>

          <div style="padding:25px 30px;">
            <p style="font-size:15px;line-height:1.6;">
              Se ha recibido una nueva solicitud de presupuesto desde la página web.
            </p>

            ${section("DATOS DEL CLIENTE", [
              row("Nombre y apellidos", customerName),
              row("Teléfono", phone),
              row("Correo electrónico", email),
            ].join(""))}

            ${section("1. DIRECCIÓN DE ORIGEN", origin)}

            ${section("2. DIRECCIÓN DE DESTINO", destination)}

            ${section("3. INVENTARIO DE ENSERES", inventoryHtml)}

            ${
              extraItems
                ? `<div style="margin-top:15px;padding:15px;background:#faf8f3;border-left:3px solid #d4ad61;">
                    <strong>Otros enseres / descripción adicional</strong>
                    <p style="white-space:pre-wrap;line-height:1.5;">${escapeHtml(extraItems)}</p>
                  </div>`
                : ""
            }

            ${section("4. DETALLES DE LA MUDANZA", [
              row("Fecha aproximada", movingDate),
              row("Información adicional", movingNotes || "No indicada"),
              row("Fotografías adjuntas", `${attachments.length} archivo(s)`),
            ].join(""))}

            <div style="margin-top:30px;padding-top:18px;border-top:1px solid #eee;">
              <p style="font-size:12px;color:#888;line-height:1.5;">
                Este mensaje se ha generado automáticamente desde el formulario
                de presupuestos de Ibero Mudanzas.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Versión de texto
    const text = `
IBERO MUDANZAS
NUEVA SOLICITUD DE PRESUPUESTO

DATOS DEL CLIENTE
Nombre: ${customerName}
Teléfono: ${phone}
Correo: ${email}

DIRECCIÓN DE ORIGEN
Dirección: ${getValue(data, "originAddress")}
Inmueble: ${getValue(data, "originProperty")}
Ascensor: ${yesNo(data, "originElevator")}
Desmontaje y montaje: ${yesNo(data, "originAssembly")}
Embalaje: ${yesNo(data, "originPacking")}

DIRECCIÓN DE DESTINO
Dirección: ${getValue(data, "destinationAddress")}
Inmueble: ${getValue(data, "destinationProperty")}
Ascensor: ${yesNo(data, "destinationElevator")}
Desmontaje y montaje: ${yesNo(data, "destinationAssembly")}
Embalaje: ${yesNo(data, "destinationPacking")}

INVENTARIO
${inventory.map(item => `${item.name}: ${item.quantity} unidades`).join("\n") || "No indicado"}

OTROS ENSERES
${extraItems || "No indicado"}

DETALLES DE LA MUDANZA
Fecha: ${movingDate}
Información adicional: ${movingNotes || "No indicada"}
Fotografías adjuntas: ${attachments.length}

IBERO MUDANZAS
Solicitud recibida desde la página web.
`;

    // Logotipo incrustado + fotografías del cliente
    const emailAttachments = [
      {
        filename: "logo-ibero-mudanzas-email.png",
        content: logoContent,
        content_type: "image/png",
        content_id: "ibero-logo",
      },
      ...attachments,
    ];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Nueva solicitud de mudanza - ${customerName}`,
        html,
        text,
        attachments: emailAttachments,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Error de Resend:", detail);

      return NextResponse.json(
        { error: "No se ha podido enviar la solicitud. Inténtalo de nuevo más tarde." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Error en /api/presupuesto:", error);

    return NextResponse.json(
      { error: "Ha ocurrido un error inesperado al procesar la solicitud." },
      { status: 500 }
    );
  }
}
