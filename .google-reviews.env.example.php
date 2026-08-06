<?php

return [
    // Copiar como /home2/lostrova/.google-reviews.env.php en cPanel.
    // (Fuera de public_html: así la API key nunca queda accesible por web.)

    // API key de Google Cloud con "Places API (New)" habilitada.
    'api_key' => 'REEMPLAZAR_CON_API_KEY',

    // Place ID del negocio en Google Maps. Verificar en:
    // https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
    'place_id' => 'ChIJH3wo1T-Bn5URWbjYHGGrkHo',

    // 'auto'   → intenta Places API (New) y cae a la legacy si falla (recomendado)
    // 'new'    → sólo Places API (New)
    // 'legacy' → sólo Places API (Legacy); no se puede habilitar en proyectos
    //            de Google Cloud creados después de marzo de 2025
    'api' => 'auto',

    // Segundos que dura la caché antes de volver a consultar a Google. Mínimo 86400 (24 h).
    'cache_ttl' => 86400,
];
