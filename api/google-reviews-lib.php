<?php

declare(strict_types=1);

const GOOGLE_REVIEWS_DEFAULT_PLACE_ID = 'ChIJH3wo1T-Bn5URWbjYHGGrkHo';
const GOOGLE_REVIEWS_DEFAULT_TTL = 86400;

function google_reviews_config(): array
{
    $projectRoot = dirname(__DIR__);
    $privateConfigPaths = [
        dirname($projectRoot) . '/.google-reviews.env.php',
        $projectRoot . '/.google-reviews.env.php',
    ];

    $fileConfig = [];
    foreach ($privateConfigPaths as $configPath) {
        if (!is_file($configPath)) {
            continue;
        }

        $loaded = require $configPath;
        if (is_array($loaded)) {
            $fileConfig = $loaded;
        }
        break;
    }

    $apiKey = getenv('GOOGLE_PLACES_API_KEY');
    $placeId = getenv('GOOGLE_PLACE_ID');
    $cachePath = getenv('GOOGLE_REVIEWS_CACHE_PATH');

    $apiMode = strtolower((string) ($fileConfig['api'] ?? 'auto'));
    if (!in_array($apiMode, ['auto', 'new', 'legacy'], true)) {
        $apiMode = 'auto';
    }

    return [
        'api' => $apiMode,
        'api_key' => is_string($apiKey) && $apiKey !== ''
            ? $apiKey
            : (string) ($fileConfig['api_key'] ?? ''),
        'place_id' => is_string($placeId) && $placeId !== ''
            ? $placeId
            : (string) ($fileConfig['place_id'] ?? GOOGLE_REVIEWS_DEFAULT_PLACE_ID),
        'cache_ttl' => max(
            GOOGLE_REVIEWS_DEFAULT_TTL,
            (int) ($fileConfig['cache_ttl'] ?? GOOGLE_REVIEWS_DEFAULT_TTL),
        ),
        'cache_path' => is_string($cachePath) && $cachePath !== ''
            ? $cachePath
            : $projectRoot . '/api/cache/google-reviews.json',
    ];
}

function google_reviews_read_cache(string $cachePath): ?array
{
    if (!is_file($cachePath) || !is_readable($cachePath)) {
        return null;
    }

    $contents = file_get_contents($cachePath);
    if (!is_string($contents) || $contents === '') {
        return null;
    }

    $decoded = json_decode($contents, true);
    return is_array($decoded) ? $decoded : null;
}

function google_reviews_cache_is_fresh(?array $cache, int $ttl): bool
{
    if (!$cache || empty($cache['updated_at'])) {
        return false;
    }

    $updatedAt = strtotime((string) $cache['updated_at']);
    return $updatedAt !== false && (time() - $updatedAt) < $ttl;
}

function google_reviews_http_get(string $url, array $headers = []): array
{
    $curl = curl_init($url);
    if ($curl === false) {
        throw new RuntimeException('No se pudo iniciar la conexión con Google.');
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_USERAGENT => 'LosTrovadoresReviews/1.0',
        CURLOPT_HTTPHEADER => $headers,
    ]);

    $response = curl_exec($curl);
    $httpStatus = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if (!is_string($response) || $response === '') {
        throw new RuntimeException(
            $curlError !== '' ? $curlError : 'Google no devolvió respuesta.',
        );
    }

    return ['status' => $httpStatus, 'body' => $response];
}

/**
 * Places API (New) — https://places.googleapis.com/v1/places/{PLACE_ID}
 * Es la única disponible para proyectos de Google Cloud creados después de marzo 2025.
 */
function google_reviews_fetch_new(array $config): array
{
    $url = 'https://places.googleapis.com/v1/places/'
        . rawurlencode($config['place_id'])
        . '?languageCode=es&regionCode=UY';

    // Field mask mínimo a propósito: pedir "reviews" mueve la llamada al SKU
    // Enterprise + Atmosphere, que es el más caro. Sólo necesitamos el contador.
    $response = google_reviews_http_get($url, [
        'Content-Type: application/json',
        'X-Goog-Api-Key: ' . $config['api_key'],
        'X-Goog-FieldMask: id,displayName,rating,userRatingCount',
    ]);

    $payload = json_decode($response['body'], true);
    if (!is_array($payload)) {
        throw new RuntimeException('Respuesta inválida de Places API (New).');
    }

    if ($response['status'] !== 200 || isset($payload['error'])) {
        $message = (string) ($payload['error']['message'] ?? 'Places API (New) respondió con un error.');
        throw new RuntimeException($message);
    }

    return [
        'name' => (string) ($payload['displayName']['text'] ?? 'Heladería Los Trovadores'),
        'rating' => (float) ($payload['rating'] ?? 0),
        'user_ratings_total' => (int) ($payload['userRatingCount'] ?? 0),
        'source' => 'places_new',
        'updated_at' => gmdate(DATE_ATOM),
    ];
}

/**
 * Places API (Legacy). Sólo funciona en proyectos de Google Cloud que ya la tenían habilitada
 * antes de marzo 2025. Se mantiene como fallback.
 */
function google_reviews_fetch_legacy(array $config): array
{
    $query = http_build_query([
        'place_id' => $config['place_id'],
        'fields' => 'name,rating,user_ratings_total',
        'language' => 'es',
        'key' => $config['api_key'],
    ]);

    $response = google_reviews_http_get(
        'https://maps.googleapis.com/maps/api/place/details/json?' . $query,
    );

    if ($response['status'] !== 200) {
        throw new RuntimeException('Places API (Legacy) respondió con un error.');
    }

    $payload = json_decode($response['body'], true);
    if (!is_array($payload) || ($payload['status'] ?? '') !== 'OK') {
        $message = (string) ($payload['error_message'] ?? $payload['status'] ?? 'Respuesta inválida.');
        throw new RuntimeException($message);
    }

    $result = is_array($payload['result'] ?? null) ? $payload['result'] : [];

    return [
        'name' => (string) ($result['name'] ?? 'Heladería Los Trovadores'),
        'rating' => (float) ($result['rating'] ?? 0),
        'user_ratings_total' => (int) ($result['user_ratings_total'] ?? 0),
        'source' => 'places_legacy',
        'updated_at' => gmdate(DATE_ATOM),
    ];
}

function google_reviews_fetch(array $config): array
{
    if ($config['api_key'] === '') {
        throw new RuntimeException('Falta configurar GOOGLE_PLACES_API_KEY.');
    }

    $mode = $config['api'] ?? 'auto';

    if ($mode === 'legacy') {
        return google_reviews_fetch_legacy($config);
    }

    if ($mode === 'new') {
        return google_reviews_fetch_new($config);
    }

    try {
        return google_reviews_fetch_new($config);
    } catch (Throwable $newApiError) {
        try {
            return google_reviews_fetch_legacy($config);
        } catch (Throwable $legacyError) {
            throw new RuntimeException(
                'Places API (New): ' . $newApiError->getMessage()
                . ' | Places API (Legacy): ' . $legacyError->getMessage(),
            );
        }
    }
}

function google_reviews_write_cache(string $cachePath, array $payload): void
{
    $cacheDirectory = dirname($cachePath);
    if (!is_dir($cacheDirectory) && !mkdir($cacheDirectory, 0755, true) && !is_dir($cacheDirectory)) {
        throw new RuntimeException('No se pudo crear el directorio de caché.');
    }

    $encoded = json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT,
    );
    if (!is_string($encoded)) {
        throw new RuntimeException('No se pudo preparar la caché de reseñas.');
    }

    $temporaryPath = $cachePath . '.tmp';
    if (file_put_contents($temporaryPath, $encoded, LOCK_EX) === false) {
        throw new RuntimeException('No se pudo escribir la caché de reseñas.');
    }

    if (!rename($temporaryPath, $cachePath)) {
        @unlink($temporaryPath);
        throw new RuntimeException('No se pudo publicar la caché de reseñas.');
    }
}

function google_reviews_get(bool $forceRefresh = false): array
{
    $config = google_reviews_config();
    $cache = google_reviews_read_cache($config['cache_path']);

    if (!$forceRefresh && google_reviews_cache_is_fresh($cache, $config['cache_ttl'])) {
        return $cache;
    }

    try {
        $fresh = google_reviews_fetch($config);
        google_reviews_write_cache($config['cache_path'], $fresh);
        return $fresh;
    } catch (Throwable $error) {
        if ($cache) {
            $cache['stale'] = true;
            return $cache;
        }
        throw $error;
    }
}
