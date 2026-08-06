# Reseñas de Google y formularios en cPanel

La cantidad total de reseñas se sincroniza con el perfil de Google del negocio.
Las tarjetas del carrusel son fijas y se editan directamente en `index.html`.
El código ya está escrito. Falta **configurarlo en Google Cloud y en cPanel**.

## Cómo funciona

```
Google Places API
      ↓ (1 vez por día, cron de cPanel)
cron/update-google-reviews.php
      ↓ escribe
api/cache/google-reviews.json      ← caché en el servidor
      ↓ lee
api/google-reviews.php             ← devuelve JSON al navegador
      ↓ fetch()
assets/main.js → actualiza el contador de reseñas
```

Si Google falla o el cron no corrió, se sirve la última caché. Si tampoco hay caché,
`index.html` conserva el contador escrito a mano. Las reseñas fijas siempre siguen visibles.

La API key vive **fuera de `public_html`**, así que nunca se expone al navegador.

---

## Paso 1 — API key en Google Cloud Console

Esto va en **Google Cloud Console** (`console.cloud.google.com`), no en el Admin Console
de Workspace. Son dos productos distintos.

1. Crear un proyecto (o usar uno existente).
2. **APIs & Services → Library →** habilitar **"Places API (New)"**.
   La *Places API* vieja ya no se puede habilitar en proyectos creados después de
   marzo de 2025, por eso el código usa la nueva.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Restringir la key:
   - *Application restrictions*: **None** (la llama el servidor, no el navegador;
     una restricción por IP del hosting también sirve).
   - *API restrictions*: **Restrict key** → sólo **Places API (New)**.
5. Habilitar facturación en el proyecto. Con el cron diario son ~30 llamadas al mes,
   muy por debajo del crédito mensual gratuito, pero Google exige tarjeta igual.

## Paso 2 — Verificar el Place ID

El código trae `ChIJH3wo1T-Bn5URWbjYHGGrkHo` por defecto. Confirmalo en el
[Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)
buscando "Heladería Los Trovadores, Gabriel Pereira 3202, Montevideo". Si no coincide,
usá el que devuelva el buscador.

## Paso 3 — Archivo de configuración en cPanel

En **File Manager**, crear `/home2/lostrova/.google-reviews.env.php`
(al lado de `public_html`, **nunca adentro**), con el contenido de
`.google-reviews.env.example.php` y la key real:

```php
<?php

return [
    'api_key'   => 'AIza...la key real...',
    'place_id'  => 'ChIJH3wo1T-Bn5URWbjYHGGrkHo',
    'api'       => 'auto',
    'cache_ttl' => 86400,
];
```

Permisos del archivo: **600**.

> Si tu home no es `/home2/lostrova`, miralo arriba a la derecha en cPanel
> ("Home Directory") y usá ese. El código también acepta el archivo en la raíz del
> proyecto como segunda opción, pero es menos seguro.

## Paso 4 — Subir el sitio

Subir a `public_html/` todo el contenido de esta carpeta **excepto**:

- `.git/`, `.gitignore`, `.DS_Store`
- `.google-reviews.env.example.php`
- `DEPLOY-RESENAS.md`
- `assets/productos/originales-heic/` (son los originales sin convertir, pesan de más)

Asegurarse de que exista `public_html/api/cache/` con permisos **755** (PHP necesita
poder escribir ahí).

### Configurar el formulario de sugerencias

En **File Manager**, crear `/home2/lostrova/.forms.env.php`, también fuera de
`public_html`, usando `.forms.env.example.php` como modelo:

```php
<?php

return [
    'suggestions_recipient' => 'TU_EMAIL_PRIVADO',
    'from_email' => 'no-reply@lostrovadores.com.uy',
];
```

Permisos del archivo: **600**. El destinatario nunca aparece en el JavaScript,
en GitHub ni en el HTML enviado al navegador.

## Paso 5 — Cron job diario

cPanel → **Cron Jobs** → *Add New Cron Job*.

- Frecuencia: **Once Per Day** (`0 4 * * *`, 4 AM)
- Comando:

```
/usr/local/bin/php /home2/lostrova/public_html/cron/update-google-reviews.php >> /home2/lostrova/logs/google-reviews.log 2>&1
```

Ajustá la ruta de PHP si cPanel usa otra (se ve en *Select PHP Version*).

## Paso 6 — Probar

1. Abrir `https://lostrovadores.com.uy/api/google-reviews.php` en el navegador.
   Tiene que devolver un JSON con `rating` y `user_ratings_total`.
   Si devuelve el error 503, el mensaje del log del cron dice qué falta.
2. Abrir la home y verificar que la cantidad de reseñas cambie respecto al valor
   fijo del HTML (`7.607 reseñas`).
3. Enviar una sugerencia desde `productos.html` y comprobar que llegue al correo
   configurado en `.forms.env.php`.

---

## Cosas a tener en cuenta

- **`7.607 reseñas` en el HTML es un número inventado de placeholder.** Se pisa apenas
  responde la API, pero si el PHP falla queda visible. Conviene reemplazarlo en
  `index.html` por el número real del perfil de Google.
- **El Admin Console de Google no interviene acá.** Sólo hace falta Google Cloud Console
  (para la key) y el perfil de Google Business (que ya existe, de ahí salen las reseñas).
- La vista previa de GitHub Pages no ejecuta PHP. El formulario se ve y se puede
  revisar, pero el envío queda habilitado recién en cPanel.
