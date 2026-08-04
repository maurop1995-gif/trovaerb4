<?php

declare(strict_types=1);

require __DIR__ . '/google-reviews-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    echo json_encode(
        google_reviews_get(false),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
    );
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode([
        'error' => 'Las reseñas de Google no están disponibles temporalmente.',
    ], JSON_UNESCAPED_UNICODE);
}
