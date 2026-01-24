## Sistema de cobro manual

Para mostrar mensajes informativos de pago a tus clientes:

1. Abre el archivo `billing-gate-config.js`.
2. Cambia el valor de `expirationDate` a la nueva fecha límite de pago (formato YYYY-MM-DD).
3. Si deseas, ajusta el número de días de gracia (`graceDays`).
4. Guarda y sube los cambios a tu repositorio de GitHub Pages.

El mensaje se mostrará automáticamente en la landing page si el cliente está en período de gracia o vencido. El acceso a la página no se bloquea, solo se informa el estado de pago.
# Urgentito Valle Landing

A minimal, responsive landing page mirroring the core structure of urgentitovalle.com: hero background, logo, three CTAs (WhatsApp, Catálogo, Mapa), headings, and footer.

## Files
- `index.html`: Page structure
- `styles.css`: Responsive styles and fonts
- `script.js`: Placeholder for future interactions

## Run
- Double-click `index.html` to open it in your browser.
- Or serve locally (optional):
  - Python: `python -m http.server 5500`
  - Node (serve): `npx serve -p 5500`

Then visit http://localhost:5500/index.html

## Customize
- Colors and fonts in `styles.css` (`:root` variables)
- Text content in `index.html`
- Replace images/links with your own if desired
