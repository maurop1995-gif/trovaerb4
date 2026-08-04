<?php

declare(strict_types=1);

require dirname(__DIR__) . '/api/google-reviews-lib.php';

try {
    $payload = google_reviews_get(true);
    $count = count((array) ($payload['reviews'] ?? []));
    fwrite(STDOUT, sprintf(
        "[%s] Caché actualizada: %d reseñas.\n",
        gmdate(DATE_ATOM),
        $count,
    ));
    exit(0);
} catch (Throwable $error) {
    fwrite(STDERR, sprintf(
        "[%s] Error al actualizar reseñas: %s\n",
        gmdate(DATE_ATOM),
        $error->getMessage(),
    ));
    exit(1);
}
