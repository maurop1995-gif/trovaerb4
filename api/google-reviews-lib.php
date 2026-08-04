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

    return [
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

function google_reviews_fetch(array $config): array
{
    if ($config['api_key'] === '') {
        throw new RuntimeException('Falta configurar GOOGLE_PLACES_API_KEY.');
    }

    $query = http_build_query([
        'place_id' => $config['place_id'],
        'fields' => 'name,rating,user_ratings_total,reviews,url',
        'reviews_sort' => 'newest',
        'reviews_no_translations' => 'false',
        'language' => 'es',
        'key' => $config['api_key'],
    ]);
    $url = 'https://maps.googleapis.com/maps/api/place/details/json?' . $query;

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
    ]);

    $response = curl_exec($curl);
    $httpStatus = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if (!is_string($response) || $response === '' || $httpStatus !== 200) {
        throw new RuntimeException(
            $curlError !== '' ? $curlError : 'Google respondió con un error.',
        );
    }

    $payload = json_decode($response, true);
    if (!is_array($payload) || ($payload['status'] ?? '') !== 'OK') {
        $message = (string) ($payload['error_message'] ?? $payload['status'] ?? 'Respuesta inválida.');
        throw new RuntimeException($message);
    }

    $result = is_array($payload['result'] ?? null) ? $payload['result'] : [];
    $reviews = [];
    foreach (array_slice((array) ($result['reviews'] ?? []), 0, 5) as $review) {
        if (!is_array($review)) {
            continue;
        }

        $reviews[] = [
            'author_name' => (string) ($review['author_name'] ?? 'Usuario de Google'),
            'author_url' => (string) ($review['author_url'] ?? ''),
            'profile_photo_url' => (string) ($review['profile_photo_url'] ?? ''),
            'rating' => (int) ($review['rating'] ?? 5),
            'relative_time_description' => (string) ($review['relative_time_description'] ?? ''),
            'text' => trim(strip_tags((string) ($review['text'] ?? ''))),
            'time' => (int) ($review['time'] ?? 0),
            'translated' => (bool) ($review['translated'] ?? false),
        ];
    }

    return [
        'name' => (string) ($result['name'] ?? 'Heladería Los Trovadores'),
        'rating' => (float) ($result['rating'] ?? 0),
        'user_ratings_total' => (int) ($result['user_ratings_total'] ?? 0),
        'reviews' => $reviews,
        'google_url' => (string) ($result['url'] ?? ''),
        'sort' => 'newest',
        'updated_at' => gmdate(DATE_ATOM),
    ];
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
