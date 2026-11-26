# Ibero Mudanzas — web comercial

Proyecto independiente construido con Next.js, TypeScript y Tailwind CSS.

## Requisitos
- Node.js 20.9 o superior.
- npm.

## Instalación en Windows (PowerShell)
1. Descomprime el ZIP en una carpeta, por ejemplo `C:\Users\TU_USUARIO\Desktop\ibero-mudanzas-web`.
2. Abre PowerShell en esa carpeta.
3. Ejecuta:

```powershell
npm install
npm run dev
```

4. Abre `http://localhost:3000`.

## Activar el envío de presupuestos
El formulario está preparado para enviar las solicitudes a una dirección de correo mediante Resend.

1. Crea una cuenta en https://resend.com y verifica el dominio remitente.
2. Copia `.env.example` como `.env.local`.
3. Rellena:
   - `RESEND_API_KEY`
   - `QUOTE_TO_EMAIL` (correo donde quieres recibir presupuestos)
   - `QUOTE_FROM_EMAIL` (remitente verificado en Resend)
4. Reinicia el servidor (`Ctrl+C` y `npm run dev`).

Sin estas variables el formulario muestra un aviso y no simula un envío correcto.

## Antes de publicar
- Sustituir fotografías de muestra por fotografías propias de Ibero Mudanzas.
- Confirmar teléfono, correo, dominio y redes sociales.
- Añadir política de privacidad, aviso legal y política de cookies.
- Conectar el perfil real de Google Business para mostrar reseñas auténticas.
- Configurar Google Maps Platform si se desea calcular kilómetros y duración de ruta automáticamente.
- Revisar textos, consentimiento y tratamiento de datos personales con asesoramiento adecuado.

## Nota sobre el mapa
En esta primera versión se recoge el origen y destino y se prepara la estructura de la solicitud. El cálculo real de kilómetros/tiempo y el mapa de ruta requieren configurar Google Maps Platform y su clave API; no se muestran cifras inventadas.
